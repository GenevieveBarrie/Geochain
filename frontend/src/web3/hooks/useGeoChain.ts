import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FhevmInstance } from "../fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "../fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "../fhevm/GenericStringStorage";
import { GeoChainAddresses } from "../../abi/GeoChainAddresses";
import { GeoChainABI } from "../../abi/GeoChainABI";

export const useGeoChain = (parameters: {
  instance: FhevmInstance | undefined;
  eip1193Provider?: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const storage = useRef(new GenericStringStorage()).current;
  const [message, setMessage] = useState<string>("");
  const [handle, setHandle] = useState<string | undefined>(undefined);
  const [clear, setClear] = useState<bigint | undefined>(undefined);
  const isDecrypted = handle && clear !== undefined;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | undefined>(undefined);

  const isRefreshingRef = useRef(false);
  const isDecryptingRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const geoRef = useRef<any>(undefined);
  // 避免 React StrictMode 在开发环境造成的初始化 useEffect 双调用
  const initRefreshKeyRef = useRef<string>("");
  // 节流：相同 (contract + signer) 的刷新在时间窗口内只执行一次
  const lastRefreshKeyRef = useRef<string>("");
  const lastRefreshAtRef = useRef<number>(0);

  const contract = useMemo(() => {
    if (!chainId) return { abi: GeoChainABI.abi };
    const entry = (GeoChainAddresses as any)[String(chainId)];
    return {
      abi: GeoChainABI.abi,
      address: entry?.address as `0x${string}` | undefined,
      chainId: entry?.chainId ?? chainId,
      chainName: entry?.chainName,
    };
  }, [chainId]);
  geoRef.current = contract;

  const isDeployed = useMemo(() => {
    if (!contract) return undefined;
    return Boolean(contract.address) && contract.address !== ethers.ZeroAddress;
  }, [contract]);

  const canRefresh = useMemo(() => {
    return contract.address && ethersReadonlyProvider && ethersSigner && !isRefreshing;
  }, [contract.address, ethersReadonlyProvider, ethersSigner, isRefreshing]);

  const refreshEncryptedTotal = useCallback(() => {
    if (isRefreshingRef.current) return;
    if (!contract?.address || !ethersReadonlyProvider || !ethersSigner) {
      setHandle(undefined);
      setMessage("连接信息不完整，无法查询密文");
      return;
    }
    isRefreshingRef.current = true;
    setIsRefreshing(true);

    const thisChainId = contract.chainId;
    const thisAddress = contract.address;
    const thisSigner = ethersSigner;
    // 节流：2s 内对相同合约+签名地址的重复刷新直接跳过
    const key = `${thisAddress}:${thisSigner.address}`;
    const now = Date.now();
    if (lastRefreshKeyRef.current === key && now - lastRefreshAtRef.current < 2000) {
      console.log("[refreshEncryptedTotal] Throttled");
      isRefreshingRef.current = false;
      setIsRefreshing(false);
      return;
    }
    lastRefreshKeyRef.current = key;
    lastRefreshAtRef.current = now;
    const c = new ethers.Contract(thisAddress!, contract.abi, ethersReadonlyProvider);

    // 关键修复：用只读 provider 调用时 msg.sender 为 0x0，导致总是返回空句柄。
    // 因此改为显式传入地址查询。
    c.getEncryptedTotalScore(thisSigner.address)
      .then((value: any) => {
        console.log("[refreshEncryptedTotal] Raw value:", value);
        console.log("[refreshEncryptedTotal] Value type:", typeof value);
        
        // euint32 返回的可能是 BigInt 或字符串，需要转换
        const handleStr = typeof value === 'bigint' ? '0x' + value.toString(16) : String(value);
        console.log("[refreshEncryptedTotal] Converted handle:", handleStr);
        
        if (sameChain.current(thisChainId) && thisAddress === geoRef.current?.address) {
          // 一些情况下合约会返回 0x0（尚无密文），此时不允许解密
          const isZero = /^0x0+$/i.test(handleStr ?? "");
          setHandle(handleStr);
          setClear(undefined);
          if (isZero) {
            setMessage("未检测到你的密文分数，请先完成一次上链或稍后刷新");
          } else {
            setMessage("密文已刷新，可以解密");
          }
        }
      })
      .catch((e: any) => {
        console.error("[refreshEncryptedTotal] Error:", e);
        setMessage("刷新失败: " + String(e.message || e));
      })
      .finally(() => {
        console.log("[refreshEncryptedTotal] Finished");
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      });
  }, [contract.abi, contract.chainId, ethersReadonlyProvider, ethersSigner, sameChain]);

  // 只在初始化和关键依赖变化时刷新一次（对相同 key 防重复）
  useEffect(() => {
    if (!contract.address || !ethersReadonlyProvider || !ethersSigner) return;
    const key = `${contract.address}:${ethersSigner.address}`;
    if (initRefreshKeyRef.current === key) {
      return;
    }
    initRefreshKeyRef.current = key;
    console.log("[useEffect] Calling refreshEncryptedTotal");
    refreshEncryptedTotal();
  }, [contract.address, ethersReadonlyProvider, ethersSigner?.address]);

  const canDecrypt = useMemo(() => {
    const hasHandle = typeof handle === "string" && !/^0x0+$/i.test(handle);
    return (
      contract.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isDecrypting &&
      hasHandle &&
      clear === undefined
    );
  }, [contract.address, instance, ethersSigner, isRefreshing, isDecrypting, handle, clear]);

  const decryptEncryptedTotal = useCallback(async (options?: { forceSign?: boolean }) => {
    console.log("[decryptEncryptedTotal] Called, isRefreshing:", isRefreshingRef.current);
    
    // 如果正在刷新，等待刷新完成
    if (isRefreshingRef.current) {
      console.log("[decryptEncryptedTotal] Waiting for refresh to complete...");
      setMessage("正在刷新密文，等待完成后自动解密...");
      const waitForRefresh = new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          console.log("[decryptEncryptedTotal] Still waiting, isRefreshing:", isRefreshingRef.current);
          if (!isRefreshingRef.current) {
            clearInterval(checkInterval);
            console.log("[decryptEncryptedTotal] Refresh completed!");
            resolve();
          }
        }, 100);
        // 最多等待10秒
        setTimeout(() => {
          clearInterval(checkInterval);
          console.log("[decryptEncryptedTotal] Wait timeout!");
          resolve();
        }, 10000);
      });
      await waitForRefresh;
    }

    if (isDecryptingRef.current) {
      setMessage("解密进行中，请稍候");
      return;
    }
    if (!contract.address || !instance || !ethersSigner) {
      setMessage("FHEVM 或签名器未就绪，请先连接钱包并等待加载");
      return;
    }
    if (!handle || /^0x0+$/i.test(handle)) {
      setMessage("未检测到可解密的密文，请先完成一次上链或点击【刷新密文】。");
      return;
    }

    const thisChainId = chainId;
    const thisAddress = contract.address;
    const thisHandle = handle;
    const thisSigner = ethersSigner;

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setMessage("开始解密...");

    const run = async () => {
      const isStale = () =>
        thisAddress !== geoRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisSigner);
      try {
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [contract.address as `0x${string}`],
          ethersSigner,
          storage,
          undefined,
          { force: options?.forceSign === true }
        );
        if (!sig) {
          setMessage("无法生成解密签名");
          return;
        }
        if (isStale()) {
          setMessage("忽略过期解密请求");
          return;
        }
        setMessage("调用 userDecrypt 中...");
        const res = await instance.userDecrypt(
          [{ handle: thisHandle, contractAddress: thisAddress! }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );
        if (isStale()) {
          setMessage("忽略过期解密结果");
          return;
        }
        const value = res[thisHandle] as bigint;
        setClear(value);
        setMessage("解密完成");
      } catch (e: any) {
        setMessage("解密失败：" + String(e));
        console.error("Decryption error:", e);
      } finally {
        isDecryptingRef.current = false;
        setIsDecrypting(false);
      }
    };
    await run();
  }, [chainId, contract.address, ethersSigner, handle, instance, sameChain, sameSigner, storage]);

  const decryptHandle = useCallback(
    async (handleToDecrypt: string, options?: { forceSign?: boolean }) => {
      if (!contract.address || !instance || !ethersSigner) {
        throw new Error("FHEVM 或签名器未就绪");
      }
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contract.address as `0x${string}`],
        ethersSigner,
        storage,
        undefined,
        { force: options?.forceSign === true }
      );
      if (!sig) {
        throw new Error("无法生成解密签名");
      }
      const res = await instance.userDecrypt(
        [{ handle: handleToDecrypt, contractAddress: contract.address! }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );
      return res[handleToDecrypt] as bigint;
    },
    [contract.address, ethersSigner, instance, storage]
  );

  const [form, setForm] = useState<{ score: number; scorePublic: number; resultCID: string; resultHash: string }>({
    score: 1,
    scorePublic: 0,
    resultCID: "",
    resultHash: ""
  });

  const canSubmit = useMemo(() => {
    return contract.address && instance && ethersSigner && !isSubmitting && form.resultHash && form.resultCID && Number.isFinite(form.score);
  }, [contract.address, instance, ethersSigner, isSubmitting, form]);

  const submitCore = useCallback(async (payload: { score: number; scorePublic: number; resultCID: string; resultHash: string }) => {
    if (isRefreshingRef.current || isSubmittingRef.current) {
      throw new Error("已有正在执行的操作，请稍后再试");
    }
    if (!contract.address || !instance || !ethersSigner) {
      throw new Error("合约地址、FHEVM实例或签名器未就绪");
    }
    const thisChainId = chainId;
    const thisAddress = contract.address;
    const thisSigner = ethersSigner;
    const c = new ethers.Contract(thisAddress!, contract.abi, thisSigner);

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setMessage("准备加密分数...");

    const run = async () => {
      const isStale = () =>
        thisAddress !== geoRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisSigner);
      try {
        await new Promise((r) => setTimeout(r, 50));
        const input = instance.createEncryptedInput(
          thisAddress!,
          thisSigner.address
        );
        input.add32(payload.score);
        const enc = await input.encrypt();
        if (isStale()) {
          setMessage("忽略过期提交");
          throw new Error("链或签名器已切换，提交已取消");
        }
        setMessage("提交交易...");
        const tx: ethers.TransactionResponse = await c.submitResult(
          enc.handles[0],
          enc.inputProof,
          payload.resultHash,
          payload.resultCID,
          payload.scorePublic >>> 0 // ensure uint32
        );
        setMessage("等待确认：" + tx.hash);
        setLastTxHash(tx.hash);
        const r = await tx.wait();
        setMessage("提交完成，status=" + r?.status);
        refreshEncryptedTotal();
        return tx.hash as string;
      } catch (e: any) {
        setMessage("提交失败：" + String(e));
        throw e;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    };
    return await run();
  }, [chainId, contract.address, ethersSigner, instance, refreshEncryptedTotal, sameChain, sameSigner]);

  // 兼容旧用法：使用内部表单
  const submitResult = useCallback(() => {
    void submitCore(form);
  }, [form, submitCore]);

  // 新增：直接传入一次性负载，避免 setState 同步问题
  const submitResultWith = useCallback(async (payload: { score: number; scorePublic: number; resultCID: string; resultHash: string }) => {
    return await submitCore(payload);
  }, [submitCore]);

  return {
    contractAddress: contract.address as `0x${string}` | undefined,
    isDeployed,
    message,
    handle,
    clear,
    isDecrypted: Boolean(isDecrypted),
    isRefreshing,
    isDecrypting,
    lastTxHash,
    canRefresh,
    canDecrypt,
    refreshEncryptedTotal,
    decryptEncryptedTotal,
    decryptHandle,
    form,
    setForm,
    canSubmit,
    submitResult,
    submitResultWith,
  };
};


