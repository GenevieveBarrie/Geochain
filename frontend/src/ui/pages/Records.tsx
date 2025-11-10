import { useEffect, useMemo, useState, RefObject } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { GeoChainABI } from "../../abi/GeoChainABI";
import { GeoChainAddresses } from "../../abi/GeoChainAddresses";
import { FhevmInstance } from "../../web3/fhevm/fhevmTypes";
import { useGeoChain } from "../../web3/hooks/useGeoChain";

type RecordItem = {
  id: bigint;
  player: string;
  resultHash: string;
  resultCID: string;
  scorePublic: bigint;
  timestamp: bigint;
  txHash: string;
  blockNumber: number;
};

export function Records({
  account,
  ethersReadonlyProvider,
  chainId,
  fhevmInstance,
  ethersSigner,
  sameChain,
  sameSigner,
}: {
  account?: string;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  chainId: number | undefined;
  fhevmInstance: FhevmInstance | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(signer: ethers.JsonRpcSigner | undefined) => boolean>;
}) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addressEntry = useMemo(() => (chainId ? (GeoChainAddresses as any)[String(chainId)] : undefined), [chainId]);
  const contractAddress = addressEntry?.address as `0x${string}` | undefined;

  const geoChain = useGeoChain({
    instance: fhevmInstance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  useEffect(() => {
    if (!ethersReadonlyProvider || !contractAddress || !account) return;
    setLoading(true);
    setError(null);
    const c = new ethers.Contract(contractAddress, GeoChainABI.abi, ethersReadonlyProvider);
    (async () => {
      try {
        const filter = c.filters.ResultSubmitted(null, account);
        const logs = await c.queryFilter(filter, 0, "latest");
        const items: RecordItem[] = logs
          .map((ev: any) => {
            const { args, transactionHash, blockNumber } = ev;
            if (!args) return undefined;
            return {
              id: args[0] as bigint,
              player: args[1] as string,
              resultHash: args[2] as string,
              resultCID: args[3] as string,
              scorePublic: BigInt(args[4]),
              timestamp: BigInt(args[5]),
              txHash: transactionHash,
              blockNumber,
            } as RecordItem;
          })
          .filter(Boolean) as RecordItem[];
        items.sort((a, b) => Number(b.id - a.id));
        setRecords(items);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [ethersReadonlyProvider, contractAddress, account]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">我的答题记录</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => geoChain.refreshEncryptedTotal()}
              disabled={!geoChain.canRefresh}
              className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
            >
              刷新密文
            </button>
            <button
              onClick={() => geoChain.decryptEncryptedTotal()}
              disabled={geoChain.isDecrypting || (!geoChain.canDecrypt && !geoChain.isRefreshing)}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50"
            >
              {geoChain.isRefreshing ? "等待刷新..." : geoChain.isDecrypting ? "解密中..." : "解密我的总分"}
            </button>
          </div>
        </div>
        <p className="text-gray-600 mt-1">
          {geoChain.clear !== undefined ? `当前总分（解密）：${geoChain.clear.toString()}` : "总分需解密后可见"}
        </p>
        {geoChain.message && <p className="text-sm text-gray-700 mt-1">{geoChain.message}</p>}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        {loading ? (
          <p className="text-gray-600">加载中...</p>
        ) : error ? (
          <p className="text-red-600">加载失败：{error}</p>
        ) : records.length === 0 ? (
          <p className="text-gray-600">暂无记录</p>
        ) : (
          <div className="divide-y">
            {records.map((r) => (
              <div key={r.txHash} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-gray-900">#{r.id.toString()} · {new Date(Number(r.timestamp) * 1000).toLocaleString()}</p>
                  <p className="text-xs text-gray-600 break-all">tx: {r.txHash}</p>
                </div>
                <Link
                  to={`/records/${r.id.toString()}`}
                  state={{ record: r }}
                  className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                >
                  查看详情
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


