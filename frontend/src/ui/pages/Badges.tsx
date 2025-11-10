import { Award, Lock, Star, Zap, Target, Globe, Crown, Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { GeoChainABI } from "../../abi/GeoChainABI";
import { GeoChainAddresses } from "../../abi/GeoChainAddresses";

interface BadgesProps {
  account?: string;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  chainId: number | undefined;
  ethersSigner?: ethers.JsonRpcSigner | undefined;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: any;
  color: string;
  unlocked?: boolean;
  claimed?: boolean;
  progress?: number;
  maxProgress?: number;
}

function getTodayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

export function Badges({ account, ethersReadonlyProvider, chainId, ethersSigner }: BadgesProps) {
  const [loading, setLoading] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);

  const addressEntry = useMemo(
    () => (chainId ? (GeoChainAddresses as any)[String(chainId)] : undefined),
    [chainId]
  );

  useEffect(() => {
    const run = async () => {
      if (!ethersReadonlyProvider || !addressEntry?.address || !account) {
        setBadges([]);
        return;
      }
      setLoading(true);
      try {
        const c = new ethers.Contract(addressEntry.address, GeoChainABI.abi, ethersReadonlyProvider);
        const stats = await c.getPlayerStats(account);
        const games = Number(stats[0]);
        const totalScore = Number(stats[1]);
        const maxScore = Number(stats[2]);
        const lastPlayedAt = Number(stats[3]);
        const today = getTodayStart();
        const playedToday = lastPlayedAt >= today;
        const playedWeek = lastPlayedAt >= today - 6 * 24 * 60 * 60 ? Math.min(games, 3) : 0;

        const isClaimed = async (id: number) => {
          const v = await c.badgeClaimed(id, account);
          return Boolean(v);
        };

        const computed: Badge[] = [
          {
            id: 1,
            name: "初次尝试",
            description: "完成第一次游戏",
            icon: Star,
            color: "from-blue-400 to-cyan-500",
            unlocked: games >= 1,
            claimed: await isClaimed(1),
          },
          {
            id: 2,
            name: "小试牛刀",
            description: "累计获得 10 分",
            icon: Flame,
            color: "from-orange-400 to-red-500",
            unlocked: totalScore >= 10,
            claimed: await isClaimed(2),
            progress: Math.min(totalScore, 10),
            maxProgress: 10,
          },
          {
            id: 3,
            name: "高分记录",
            description: "单局得分 ≥ 20",
            icon: Zap,
            color: "from-yellow-400 to-orange-500",
            unlocked: maxScore >= 20,
            claimed: await isClaimed(3),
            progress: Math.min(maxScore, 20),
            maxProgress: 20,
          },
          {
            id: 4,
            name: "活跃玩家",
            description: "最近 7 天完成 3 局",
            icon: Target,
            color: "from-green-400 to-emerald-500",
            unlocked: playedWeek >= 3,
            claimed: await isClaimed(4),
            progress: Math.min(playedWeek, 3),
            maxProgress: 3,
          },
          {
            id: 5,
            name: "今日打卡",
            description: "今天完成一局",
            icon: Globe,
            color: "from-indigo-400 to-purple-500",
            unlocked: playedToday,
            claimed: await isClaimed(5),
            progress: playedToday ? 1 : 0,
            maxProgress: 1,
          },
          {
            id: 6,
            name: "老玩家",
            description: "累计完成 10 局",
            icon: Crown,
            color: "from-purple-500 to-pink-600",
            unlocked: games >= 10,
            claimed: await isClaimed(6),
            progress: Math.min(games, 10),
            maxProgress: 10,
          },
        ];

        setBadges(computed);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [account, addressEntry?.address, chainId, ethersReadonlyProvider]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;
  const completionRate = (unlockedCount / totalCount) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-3xl p-8 md:p-12 shadow-2xl text-white">
        <div className="flex items-center space-x-4 mb-4">
          <Award className="w-12 h-12" />
          <h1 className="text-4xl font-bold">成就徽章</h1>
        </div>
        <p className="text-purple-100 text-lg mb-6">
          收集徽章，展示你的地理知识实力
        </p>

        {/* Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold">解锁进度</span>
            <span className="text-white font-bold">
              {unlockedCount} / {totalCount}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge) => {
          const Icon = badge.icon;
          const isUnlocked = Boolean(badge.unlocked);
          const isClaimed = Boolean(badge.claimed);

          return (
            <div
              key={badge.id}
              className={`group relative overflow-hidden rounded-2xl p-6 shadow-lg transition-all duration-300 transform hover:-translate-y-2 ${
                isUnlocked
                  ? "bg-white hover:shadow-2xl"
                  : "bg-gray-100 opacity-75"
              }`}
            >
              {/* Unlock effect */}
              {isUnlocked && (
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                  style={{
                    backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                  }}
                ></div>
              )}

              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4">
                  {isUnlocked ? (
                    <div
                      className={`w-20 h-20 bg-gradient-to-br ${badge.color} rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gray-300 rounded-2xl flex items-center justify-center">
                      <Lock className="w-10 h-10 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <h3
                  className={`text-xl font-bold mb-2 ${
                    isUnlocked ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {badge.name}
                </h3>
                <p
                  className={`text-sm mb-4 ${
                    isUnlocked ? "text-gray-600" : "text-gray-500"
                  }`}
                >
                  {badge.description}
                </p>

                {/* Progress Bar */}
                {badge.progress !== undefined && badge.maxProgress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">进度</span>
                      <span className="font-semibold text-gray-700">
                        {badge.progress} / {badge.maxProgress}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${badge.color} rounded-full transition-all duration-500`}
                        style={{
                          width: `${(badge.progress / badge.maxProgress) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Claim / Claimed */}
                {isUnlocked && (
                  <div className="mt-4">
                    {isClaimed ? (
                      <div className="inline-flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-semibold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>已领取</span>
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!ethersSigner || !ethersReadonlyProvider || !addressEntry?.address) return;
                          const cWrite = new ethers.Contract(addressEntry.address, GeoChainABI.abi, ethersSigner);
                          const tx = await cWrite.claimBadge(badge.id);
                          await tx.wait();
                          // re-fetch claimed
                          const cRead = new ethers.Contract(addressEntry.address, GeoChainABI.abi, ethersReadonlyProvider);
                          const claimed = await cRead.badgeClaimed(badge.id, account);
                          setBadges((prev) =>
                            prev.map((b) => (b.id === badge.id ? { ...b, claimed: Boolean(claimed) } : b))
                          );
                        }}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors duration-200"
                      >
                        领取徽章
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Shine effect for unlocked badges */}
              {isUnlocked && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute -inset-full top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Call to Action */}
      {unlockedCount < totalCount && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            还有更多徽章等你解锁！
          </h3>
          <p className="text-gray-600 mb-6">
            继续挑战，收集所有成就徽章
          </p>
          <a
            href="/play"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            <span>开始游戏</span>
            <span>→</span>
          </a>
        </div>
      )}
    </div>
  );
}

