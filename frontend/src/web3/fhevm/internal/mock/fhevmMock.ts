//////////////////////////////////////////////////////////////////////////
//
// WARNING!!
// ALWAY USE DYNAMICALLY IMPORT THIS FILE TO AVOID INCLUDING THE ENTIRE 
// FHEVM MOCK LIB IN THE FINAL PRODUCTION BUNDLE!!
//
//////////////////////////////////////////////////////////////////////////

import { Contract, JsonRpcProvider } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import { FhevmInstance } from "../../fhevmTypes";

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> => {
  const provider = new JsonRpcProvider(parameters.rpcUrl);
  // 动态查询 InputVerifier 的 EIP712 domain，确保 verifyingContract 地址正确
  const inputVerifierContract = new Contract(
    parameters.metadata.InputVerifierAddress,
    [
      "function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])",
    ],
    provider
  );
  const domain = await inputVerifierContract.eip712Domain();
  // domain[3] = chainId (uint256), domain[4] = verifyingContract (address)
  const domainChainId = Number(domain[3]);
  const verifyingContractAddressInputVerification = domain[4] as `0x${string}`;

  const instance = await MockFhevmInstance.create(
    provider,
    provider,
    {
      aclContractAddress: parameters.metadata.ACLAddress,
      chainId: parameters.chainId,
      // 使用 EIP712 domain 的 chainId 作为 gatewayChainId，避免不一致
      gatewayChainId: domainChainId,
      inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
      kmsContractAddress: parameters.metadata.KMSVerifierAddress,
      // 保留默认的解密验证合约（仅用于兼容；如需严格匹配可改为与实际网络一致）
      verifyingContractAddressDecryption:
        "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
      verifyingContractAddressInputVerification,
    },
    {
      inputVerifierProperties: {},
      kmsVerifierProperties: {},
    }
  );
  return instance as unknown as FhevmInstance;
};



