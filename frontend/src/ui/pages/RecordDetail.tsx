import { useLocation, useParams, Link } from "react-router-dom";
import { RefObject, useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "../../web3/fhevm/fhevmTypes";
import { useGeoChain } from "../../web3/hooks/useGeoChain";
import { GeoChainABI } from "../../abi/GeoChainABI";

export function RecordDetail({
  fhevmInstance,
  ethersSigner,
  ethersReadonlyProvider,
  chainId,
  sameChain,
  sameSigner,
}: {
  fhevmInstance: FhevmInstance | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  chainId: number | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(signer: ethers.JsonRpcSigner | undefined) => boolean>;
}) {
  const params = useParams();
  const { record } = (useLocation().state || {}) as {
    record?: {
      id: bigint;
      player: string;
      resultHash: string;
      resultCID: string;
      scorePublic: bigint;
      timestamp: bigint;
      txHash: string;
      blockNumber: number;
    };
  };

  if (!record) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 shadow-lg">
        <p className="text-gray-700">未找到记录：{params.id}</p>
        <Link to="/records" className="inline-block mt-4 px-4 py-2 rounded-lg border">返回列表</Link>
      </div>
    );
  }

  const geoChain = useGeoChain({
    instance: fhevmInstance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [scoreHandle, setScoreHandle] = useState<string | undefined>(undefined);
  const [scoreClear, setScoreClear] = useState<bigint | undefined>(undefined);
  const [msg, setMsg] = useState<string>("");
  const contractAddress = useMemo(() => geoChain.contractAddress, [geoChain.contractAddress]);

  const refreshMyScoreHandle = useCallback(async () => {
    if (!ethersReadonlyProvider || !contractAddress) return;
    try {
      const c = new ethers.Contract(contractAddress, GeoChainABI.abi, ethersReadonlyProvider);
      const value = (await c.getEncryptedResultScore(record.id)) as string;
      setScoreHandle(value);
      setScoreClear(undefined);
      if (/^0x0+$/i.test(value ?? "")) {
        setMsg("该记录没有可解密的分数句柄（可能是无效 id）");
      } else {
        setMsg("已获取到密文句柄");
      }
    } catch (e: any) {
      setMsg("获取记录密文失败：" + String(e?.message ?? e));
    }
  }, [contractAddress, ethersReadonlyProvider, record.id]);

  const decryptMyScore = useCallback(async () => {
    try {
      if (!scoreHandle || /^0x0+$/i.test(scoreHandle)) {
        setMsg("未检测到该记录的密文句柄，请先点击“刷新密文”");
        return;
      }
      const value = await geoChain.decryptHandle(scoreHandle, { forceSign: true });
      setScoreClear(value);
      setMsg("解密完成");
    } catch (e: any) {
      setMsg("解密失败：" + String(e?.message ?? e));
    }
  }, [geoChain, scoreHandle]);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">记录详情 #{record.id.toString()}</h1>
        <Link to="/records" className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50">返回列表</Link>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-gray-700"><strong>时间</strong>：{new Date(Number(record.timestamp) * 1000).toLocaleString()}</p>
        <p className="text-sm text-gray-700 break-all"><strong>交易哈希</strong>：{record.txHash}</p>
        <p className="text-sm text-gray-700"><strong>区块</strong>：{record.blockNumber}</p>
        <p className="text-sm text-gray-700 break-all"><strong>Result Hash</strong>：{record.resultHash}</p>
        <p className="text-sm text-gray-700 break-all"><strong>CID</strong>：{record.resultCID || "（未提供）"}</p>
      </div>
      <p className="text-gray-500 text-sm">如果 CID 指向 IPFS，你可以用网关查看具体答题数据。</p>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={refreshMyScoreHandle}
          disabled={!geoChain.contractAddress || !ethersReadonlyProvider}
          className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
        >
          刷新密文
        </button>
        <button
          onClick={decryptMyScore}
          disabled={!scoreHandle}
          className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
        >
          解密我的分数（签名）
        </button>
        <span className="text-sm text-gray-700">
          {scoreClear !== undefined ? `我的分数（解密）：${scoreClear.toString()}` : "未解密"}
        </span>
      </div>
      {(msg || geoChain.message) && <p className="text-sm text-gray-700">{msg || geoChain.message}</p>}
    </div>
  );
}


