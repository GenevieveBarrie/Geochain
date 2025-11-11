
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const GeoChainABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "badgeId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "BadgeClaimed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "poolCID",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "version",
          "type": "uint256"
        }
      ],
      "name": "QuestionPoolUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "resultHash",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "resultCID",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "scorePublic",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "ResultSubmitted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "badgeClaimed",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "badgeId",
          "type": "uint256"
        }
      ],
      "name": "claimBadge",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "getEncryptedResultScore",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        }
      ],
      "name": "getEncryptedTotalScore",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMyEncryptedTotalScore",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        }
      ],
      "name": "getPlayerStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "numGames",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalPublicScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "maxSinglePublicScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lastPlayedAt",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextResultId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "playerStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "numGames",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalPublicScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "maxSinglePublicScore",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lastPlayedAt",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "scoreExt",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes32",
          "name": "resultHash",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "resultCID",
          "type": "string"
        },
        {
          "internalType": "uint32",
          "name": "scorePublic",
          "type": "uint32"
        }
      ],
      "name": "submitResult",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "resultId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "poolCID",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "version",
          "type": "uint256"
        }
      ],
      "name": "updateQuestionPool",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;

