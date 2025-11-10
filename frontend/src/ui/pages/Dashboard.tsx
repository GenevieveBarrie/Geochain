import { useEffect, useState, RefObject } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Trophy,
  Target,
  Zap,
  TrendingUp,
  Award,
  Lock,
  Unlock,
} from "lucide-react";
import { ethers } from "ethers";
import { FhevmInstance } from "../../web3/fhevm/fhevmTypes";
import { useGeoChain } from "../../web3/hooks/useGeoChain";

interface DashboardProps {
  isConnected: boolean;
  account?: string;
  fhevmInstance: FhevmInstance | undefined;
  fhevmStatus: string;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  chainId: number | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}

export function Dashboard({
  isConnected,
  account,
  fhevmInstance,
  fhevmStatus,
  ethersSigner,
  ethersReadonlyProvider,
  chainId,
  sameChain,
  sameSigner,
}: DashboardProps) {
  const [totalScore, setTotalScore] = useState<bigint | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const geoChain = useGeoChain({
    instance: fhevmInstance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  useEffect(() => {
    if (isConnected && geoChain.canRefresh) {
      geoChain.refreshEncryptedTotal();
    }
  }, [isConnected, geoChain.canRefresh]);

  const handleDecrypt = async () => {
    setIsDecrypting(true);
    try {
      // 如果正在刷新，等待刷新完成
      if (geoChain.isRefreshing) {
        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            if (!geoChain.isRefreshing) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 5000);
        });
      }
      
      geoChain.decryptEncryptedTotal();
      
      // 等待解密完成
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (geoChain.clear !== undefined) {
            clearInterval(checkInterval);
            setTotalScore(BigInt(geoChain.clear.toString()));
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 10000);
      });
    } catch (e) {
      console.error("Decrypt failed:", e);
    } finally {
      setIsDecrypting(false);
    }
  };

  const stats = [
    {
      icon: Target,
      label: "今日答题",
      value: "0",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Zap,
      label: "当前连胜",
      value: "0",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Trophy,
      label: "总得分",
      value: totalScore !== null ? totalScore.toString() : "?",
      color: "from-purple-500 to-pink-500",
      action: totalScore === null && geoChain.handle && geoChain.handle !== "0x0" && (
        <button
          onClick={handleDecrypt}
          disabled={!geoChain.canDecrypt || isDecrypting}
          className="mt-2 px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          {isDecrypting ? "解密中..." : "解密查看"}
        </button>
      ),
    },
    {
      icon: Award,
      label: "成就徽章",
      value: "0",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            欢迎来到 GeoChain! 🌍
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl">
            挑战你的地理知识，通过 FHEVM 将成绩安全地存证到区块链上
          </p>
          {isConnected ? (
            <Link
              to="/play"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Play className="w-5 h-5" />
              <span>开始游戏</span>
            </Link>
          ) : (
            <div className="inline-flex items-center space-x-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl backdrop-blur-sm border border-white/20">
              <Lock className="w-5 h-5" />
              <span>请先连接钱包开始游戏</span>
            </div>
          )}
        </div>
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              ></div>
              <div className="relative z-10">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-2">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                {stat.action}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/leaderboard"
          className="group bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-orange-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">全球排行榜</h3>
            <TrendingUp className="w-6 h-6 text-orange-600 transform group-hover:scale-110 transition-transform duration-300" />
          </div>
          <p className="text-gray-600 mb-4">
            查看全球玩家的成绩排名和链上证明
          </p>
          <div className="flex items-center space-x-2 text-orange-600 font-semibold">
            <span>查看排行</span>
            <span className="transform group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </div>
        </Link>

        <Link
          to="/badges"
          className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-purple-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">成就徽章</h3>
            <Award className="w-6 h-6 text-purple-600 transform group-hover:scale-110 transition-transform duration-300" />
          </div>
          <p className="text-gray-600 mb-4">
            收集专属成就徽章，展示你的地理知识实力
          </p>
          <div className="flex items-center space-x-2 text-purple-600 font-semibold">
            <span>查看徽章</span>
            <span className="transform group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </div>
        </Link>
      </div>

      {/* FHEVM Status (Debug) */}
      {isConnected && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Unlock className="w-5 h-5 text-indigo-600" />
            <span>FHEVM 状态</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">状态:</span>
              <span
                className={`ml-2 font-semibold ${
                  fhevmStatus === "ready" ? "text-green-600" : "text-gray-900"
                }`}
              >
                {fhevmStatus}
              </span>
            </div>
            <div>
              <span className="text-gray-500">实例:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {fhevmInstance ? "OK" : "未就绪"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">合约部署:</span>
              <span
                className={`ml-2 font-semibold ${
                  geoChain.isDeployed ? "text-green-600" : "text-red-600"
                }`}
              >
                {geoChain.isDeployed ? "已部署" : "未部署"}
              </span>
            </div>
          </div>
          {geoChain.contractAddress && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">合约地址:</span>
              <p className="font-mono text-sm text-gray-900 mt-1 break-all">
                {geoChain.contractAddress}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

