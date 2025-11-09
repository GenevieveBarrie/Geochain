// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title GeoChainFHE
 * @notice FHE-enabled score aggregation and result indexing for the GeoChain game.
 *         - Stores per-player total score as encrypted euint32
 *         - Accepts encrypted score inputs with input proof
 *         - Emits lightweight proof-of-result events carrying resultHash/CID and optional public score
 *         - Grants decryption rights to the sender on each update
 *
 * On-chain data is minimized:
 *  - Encrypted aggregates per player
 *  - Sequential result id counter
 *  - Events for indexing (off-chain leaderboard/history can be reconstructed from events + IPFS)
 */
contract GeoChainFHE is ZamaEthereumConfig {
    struct PlayerStats {
        uint256 numGames;
        uint256 totalPublicScore;
        uint256 maxSinglePublicScore;
        uint256 lastPlayedAt;
    }
    struct GeoResult {
        uint256 id;
        address player;
        bytes32 resultHash;
        string resultCID;
        uint256 scorePublic; // 0 if not published by the player
        uint256 timestamp;
    }

    event ResultSubmitted(
        uint256 indexed id,
        address indexed player,
        bytes32 resultHash,
        string resultCID,
        uint256 scorePublic,
        uint256 timestamp
    );

    event QuestionPoolUpdated(string poolCID, uint256 version);

    // Next result id
    uint256 public nextResultId = 1;

    // Per-player encrypted total score
    mapping(address => euint32) private _encryptedTotalScoreByPlayer;
    // Per-result encrypted score
    mapping(uint256 => euint32) private _encryptedScoreByResultId;
    // Public stats used for achievements/leaderboard
    mapping(address => PlayerStats) public playerStats;
    // badgeId => player => claimed
    mapping(uint256 => mapping(address => bool)) public badgeClaimed;

    event BadgeClaimed(address indexed player, uint256 indexed badgeId, uint256 timestamp);

    /**
     * @notice Submit a single game result with an encrypted score and optional public score.
     * @param scoreExt Encrypted score (externalEuint32)
     * @param inputProof Input proof for `scoreExt`
     * @param resultHash keccak256(JSON) of the full result payload uploaded to IPFS
     * @param resultCID IPFS CID (can be encrypted off-chain if player prefers privacy)
     * @param scorePublic Optional clear score for public leaderboard; use 0 to keep it private
     * @return resultId Sequential identifier of the stored result
     */
    function submitResult(
        externalEuint32 scoreExt,
        bytes calldata inputProof,
        bytes32 resultHash,
        string calldata resultCID,
        uint32 scorePublic
    ) external returns (uint256 resultId) {
        // Verify proof and transform to internal euint32
        euint32 score = FHE.fromExternal(scoreExt, inputProof);

        // Aggregate encrypted total score per player
        euint32 currentTotal = _encryptedTotalScoreByPlayer[msg.sender];
        euint32 newTotal = FHE.add(currentTotal, score);
        _encryptedTotalScoreByPlayer[msg.sender] = newTotal;

        // Grant decryption/auth rights (contract itself + sender)
        FHE.allowThis(newTotal);
        FHE.allow(newTotal, msg.sender);
        // Also allow decrypt on this record's encrypted score
        FHE.allowThis(score);
        FHE.allow(score, msg.sender);

        // Mint result id and emit event (lightweight index)
        resultId = nextResultId++;
        // Persist per-result encrypted score
        _encryptedScoreByResultId[resultId] = score;
        // Update public stats (for achievements)
        unchecked {
            PlayerStats storage s = playerStats[msg.sender];
            s.numGames += 1;
            s.totalPublicScore += uint256(scorePublic);
            if (uint256(scorePublic) > s.maxSinglePublicScore) {
                s.maxSinglePublicScore = uint256(scorePublic);
            }
            s.lastPlayedAt = block.timestamp;
        }
        emit ResultSubmitted(
            resultId,
            msg.sender,
            resultHash,
            resultCID,
            uint256(scorePublic),
            block.timestamp
        );
    }

    /**
     * @notice Returns the encrypted total score of an address.
     * @dev The returned value is an FHE handle; decrypt via FHEVM (mock or relayer).
     */
    function getEncryptedTotalScore(address player) external view returns (euint32) {
        return _encryptedTotalScoreByPlayer[player];
    }

    /**
     * @notice Convenience getter for the sender's encrypted total score.
     */
    function getMyEncryptedTotalScore() external view returns (euint32) {
        return _encryptedTotalScoreByPlayer[msg.sender];
    }

    /**
     * @notice Returns the encrypted score for a specific result id.
     */
    function getEncryptedResultScore(uint256 id) external view returns (euint32) {
        return _encryptedScoreByResultId[id];
    }

    /**
     * @notice Return player public stats used by achievements.
     */
    function getPlayerStats(address player) external view returns (
        uint256 numGames,
        uint256 totalPublicScore,
        uint256 maxSinglePublicScore,
        uint256 lastPlayedAt
    ) {
        PlayerStats memory s = playerStats[player];
        return (s.numGames, s.totalPublicScore, s.maxSinglePublicScore, s.lastPlayedAt);
    }

    /**
     * @notice Claim badge when conditions are met.
     * IDs:
     * 1 First Try            numGames >= 1
     * 2 Score 10 Total       totalPublicScore >= 10
     * 3 High Score 20        maxSinglePublicScore >= 20
     * 4 Active (7d >= 3)     numGames >= 3 && lastPlayedAt within 7 days
     * 5 Daily                 lastPlayedAt within 1 day
     * 6 Veteran              numGames >= 10
     */
    function claimBadge(uint256 badgeId) external {
        require(!badgeClaimed[badgeId][msg.sender], "Already claimed");
        PlayerStats memory s = playerStats[msg.sender];
        bool ok = false;
        if (badgeId == 1) {
            ok = s.numGames >= 1;
        } else if (badgeId == 2) {
            ok = s.totalPublicScore >= 10;
        } else if (badgeId == 3) {
            ok = s.maxSinglePublicScore >= 20;
        } else if (badgeId == 4) {
            ok = s.numGames >= 3 && s.lastPlayedAt + 7 days >= block.timestamp;
        } else if (badgeId == 5) {
            ok = s.lastPlayedAt + 1 days >= block.timestamp;
        } else if (badgeId == 6) {
            ok = s.numGames >= 10;
        } else {
            revert("Unknown badge");
        }
        require(ok, "Conditions not met");
        badgeClaimed[badgeId][msg.sender] = true;
        emit BadgeClaimed(msg.sender, badgeId, block.timestamp);
    }

    /**
     * @notice Admin-only update of question pool CID and version.
     * @dev For MVP, keep it open; in production wire to a multisig/ACL.
     */
    function updateQuestionPool(string calldata poolCID, uint256 version) external {
        emit QuestionPoolUpdated(poolCID, version);
    }
}


