import { ethers } from "ethers";
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

const LS_KEY = "geochain_autoconnect";

export function useMetaMask(): {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(signer: ethers.JsonRpcSigner | undefined) => boolean>;
  initialMockChains: Readonly<Record<number, string>>;
} {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[] | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [readonlyProvider, setReadonlyProvider] = useState<ethers.ContractRunner | undefined>(undefined);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const eth = (window as any).ethereum as ethers.Eip1193Provider;
    const accs = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    const chainIdHex = (await eth.request({ method: "eth_chainId" })) as string;
    const chainIdNum = Number.parseInt(chainIdHex, 16);
    const web3 = new ethers.BrowserProvider(eth);
    const signer = await web3.getSigner();
    setProvider(eth);
    setAccounts(accs);
    setChainId(chainIdNum);
    setSigner(signer);
    setReadonlyProvider(web3);
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {}
  }, []);

  const disconnect = useCallback(() => {
    setAccounts(undefined);
    setSigner(undefined);
    setReadonlyProvider(undefined);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const eth = (window as any).ethereum as ethers.Eip1193Provider;
    const onChainChanged = (hex: string) => {
      const id = Number.parseInt(hex, 16);
      setChainId(id);
    };
    const onAccountsChanged = (acc: string[]) => setAccounts(acc);
    (eth as any).on?.("chainChanged", onChainChanged);
    (eth as any).on?.("accountsChanged", onAccountsChanged);
    return () => {
      (eth as any).removeListener?.("chainChanged", onChainChanged);
      (eth as any).removeListener?.("accountsChanged", onAccountsChanged);
    };
  }, []);

  // 自动恢复连接（仅当 dapp 已获授权时，不会弹窗）
  useEffect(() => {
    const shouldAuto = (() => {
      try {
        return localStorage.getItem(LS_KEY) === "1";
      } catch {
        return false;
      }
    })();
    if (!shouldAuto) return;
    (async () => {
      if (typeof window === "undefined" || !(window as any).ethereum) return;
      const eth = (window as any).ethereum as ethers.Eip1193Provider;
      const accs = (await eth.request({ method: "eth_accounts" })) as string[];
      if (!accs || accs.length === 0) return;
      const chainIdHex = (await eth.request({ method: "eth_chainId" })) as string;
      const chainIdNum = Number.parseInt(chainIdHex, 16);
      const web3 = new ethers.BrowserProvider(eth);
      const signer = await web3.getSigner();
      setProvider(eth);
      setAccounts(accs);
      setChainId(chainIdNum);
      setSigner(signer);
      setReadonlyProvider(web3);
    })();
  }, []);

  const isConnected = useMemo(
    () => Boolean(provider && chainId && accounts && accounts.length > 0),
    [provider, chainId, accounts]
  );

  // 用 ref 保存最新的 chainId 和 signer，避免闭包陷阱
  const chainIdRef = useRef(chainId);
  const signerRef = useRef(signer);
  useEffect(() => {
    chainIdRef.current = chainId;
  }, [chainId]);
  useEffect(() => {
    signerRef.current = signer;
  }, [signer]);

  const sameChain = useRef<(c: number | undefined) => boolean>((c) => c === chainIdRef.current);
  const sameSigner = useRef<(s: ethers.JsonRpcSigner | undefined) => boolean>((s) => s?.address === signerRef.current?.address);

  const initialMockChains = useMemo(
    () => ({ 31337: "http://localhost:8545" } as const),
    []
  );

  return {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    disconnect,
    ethersSigner: signer,
    ethersReadonlyProvider: readonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains
  };
}


