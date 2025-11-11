import type { Eip1193Provider } from "ethers";

export type FhevmInstanceConfig = {
  network: string | Eip1193Provider;
  publicKey?: {
    data: Uint8Array | null;
    id: string | null;
  };
  publicParams: {
    "2048": {
      publicParams: Uint8Array;
      publicParamsId: string;
    };
  } | null;
  kmsContractAddress: string;
  inputVerifierContractAddress: string;
  aclContractAddress: string;
  chainId: number;
  gatewayChainId: number;
};

export type FhevmInstance = {
  getPublicKey: () => { data: Uint8Array; publicKeyId: string };
  getPublicParams: (n: 2048) => { publicParams: Uint8Array; publicParamsId: string };
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ) => EIP712Type;
  createEncryptedInput: (contractAddress: string, userAddress: string) => {
    add32: (value: number) => void;
    encrypt: () => Promise<{ handles: string[]; inputProof: string }>;
  };
  userDecrypt: (
    requests: { handle: string; contractAddress: string }[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, string | bigint | boolean>>;
};

export type EIP712Type = {
  domain: Record<string, unknown>;
  message: Record<string, unknown>;
  primaryType: string;
  types: Record<string, unknown>;
};

export type FhevmRelayerSDKType = {
  __initialized__?: boolean;
  initSDK: (options?: FhevmInitSDKOptions) => Promise<boolean>;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  SepoliaConfig: {
    kmsContractAddress: string;
    inputVerifierContractAddress: string;
    aclContractAddress: string;
    chainId: number;
    gatewayChainId: number;
  };
};

export type FhevmInitSDKOptions = unknown;
export type FhevmLoadSDKType = () => Promise<void>;
export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;

export type FhevmWindowType = Window & { relayerSDK: FhevmRelayerSDKType };

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};



