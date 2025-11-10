import { useState, useEffect } from "react";
import { TrendingUp, Medal, Clock, Target, Award } from "lucide-react";
import { ethers } from "ethers";
import { GeoChainAddresses } from "../../abi/GeoChainAddresses";
import { GeoChainABI } from "../../abi/GeoChainABI";

interface LeaderboardProps {
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  chainId: number | undefined;
}

interface LeaderEntry {
  rank: number;
  address: string;
  score: number;
  txHash: string;
  timestamp: number;
}

export function Leaderboard({
  ethersReadonlyProvider,
  chainId,
}: LeaderboardProps) {
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "today">("all");
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [chainId, ethersReadonlyProvider, timeFilter]);

  const loadLeaderboard = async () => {
    if (!chainId || !ethersReadonlyProvider) return;

    setLoading(true);
    try {
      const addressEntry =
        GeoChainAddresses[chainId.toString() as keyof typeof GeoChainAddresses];
      if (!addressEntry || !("address" in addressEntry)) {
        setEntries([]);
        return;
      }

      const contract = new ethers.Contract(
        addressEntry.address,
        GeoChainABI.abi,
        ethersReadonlyProvider
      );

      // Query ResultSubmitted events
      const filter = contract.filters.ResultSubmitted();
      const events = await contract.queryFilter(filter, 0, "latest");

      // Aggregate scores by player
      const scoreMap = new Map<string, { total: number; txHash: string; timestamp: number }>();

      const nowSec = Math.floor(Date.now() / 1000);
      const startBoundary =
        timeFilter === "today"
          ? nowSec - 24 * 60 * 60
          : timeFilter === "week"
          ? nowSec - 7 * 24 * 60 * 60
          : 0;

      for (const event of events) {
        const log = event as ethers.EventLog;
        const player = (log.args?.[1] as string) || "";
        const score = Number((log.args?.[4] as any) ?? 0);
        const timestamp = Number((log.args?.[5] as any) ?? 0);

        if (timestamp < startBoundary) continue;

        const existing = scoreMap.get(player) || { total: 0, txHash: "", timestamp: 0 };
        scoreMap.set(player, {
          total: existing.total + score,
          txHash: event.transactionHash,
          timestamp: Math.max(existing.timestamp, timestamp),
        });
      }

      // Convert to array and sort
      const sorted = Array.from(scoreMap.entries())
        .map(([address, data]) => ({
          address,
          score: data.total,
          txHash: data.txHash,
          timestamp: data.timestamp,
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setEntries(sorted.slice(0, 20)); // Top 20
    } catch (e) {
      console.error("Failed to load leaderboard:", e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full">
          <Medal className="w-7 h-7 text-white" />
        </div>
      );
    if (rank === 2)
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full">
          <Medal className="w-6 h-6 text-white" />
        </div>
      );
    if (rank === 3)
      return (
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full">
          <Medal className="w-6 h-6 text-white" />
        </div>
      );
    return (
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
        <span className="font-bold text-gray-600">#{rank}</span>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-8 md:p-12 shadow-2xl text-white">
        <div className="flex items-center space-x-4 mb-4">
          <TrendingUp className="w-12 h-12" />
          <h1 className="text-4xl font-bold">全球排行榜</h1>
        </div>
        <p className="text-orange-100 text-lg">
          查看全球玩家的链上成绩证明
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center space-x-4">
          {["all", "week", "today"].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter as any)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                timeFilter === filter
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter === "all" ? "全部" : filter === "week" ? "本周" : "今日"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Target className="w-6 h-6 text-blue-600" />
            <p className="text-gray-600 font-medium">总参与人数</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{entries.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-6 h-6 text-green-600" />
            <p className="text-gray-600 font-medium">最快记录</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">—</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Award className="w-6 h-6 text-purple-600" />
            <p className="text-gray-600 font-medium">最高得分</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {entries.length > 0 ? entries[0].score : 0}
          </p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  排名
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  玩家地址
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  总得分
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  链上证明
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center space-x-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.address}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">{getRankBadge(entry.rank)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-gray-900">
                        {entry.address.slice(0, 10)}...{entry.address.slice(-8)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(entry.timestamp * 1000).toLocaleString("zh-CN")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {entry.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a
                        href={`https://etherscan.io/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>已验证</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

