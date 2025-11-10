import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Trophy,
  Clock,
  Target,
  Share2,
  Home,
  RotateCcw,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { RefObject, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { FhevmInstance } from "../../web3/fhevm/fhevmTypes";
import { useGeoChain } from "../../web3/hooks/useGeoChain";

interface ResultProps {
  fhevmInstance: FhevmInstance | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  chainId: number | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(signer: ethers.JsonRpcSigner | undefined) => boolean>;
}

export function Result({
  fhevmInstance,
  ethersSigner,
  ethersReadonlyProvider,
  chainId,
  sameChain,
  sameSigner,
}: ResultProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  const { score = 0, totalQuestions = 3, timeSpent = 0, txHash } = location.state || {};

  const accuracy = totalQuestions > 0 ? (score / (totalQuestions * 3)) * 100 : 0;
  const avgTimePerQuestion = totalQuestions > 0 ? timeSpent / totalQuestions : 0;

  // FHEVM: 仅解密后展示
  const geoChain = useGeoChain({
    instance: fhevmInstance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });
  const canAutoDecrypt = geoChain.canDecrypt;
  const decryptedTotal = geoChain.clear;
  const showData = useMemo(() => decryptedTotal !== undefined, [decryptedTotal]);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // 初始只刷新密文，不自动解密；解密需要用户点击并签名
  useEffect(() => {
    console.log("[Result] useEffect triggered, canRefresh:", geoChain.canRefresh);
    
    if (!geoChain.canRefresh) return;
    
    // 执行刷新
    console.log("[Result] Calling refreshEncryptedTotal");
    geoChain.refreshEncryptedTotal();
    
  }, []); // 只在组件挂载时执行一次
  // 若带着 txHash 进入，自动轮询一段时间直到拿到非 0x0 句柄
  useEffect(() => {
    if (!txHash) return;
    let cancelled = false;
    let tries = 0;
    const tick = async () => {
      if (cancelled) return;
      const hasHandle = typeof geoChain.handle === "string" && !/^0x0+$/i.test(geoChain.handle);
      if (hasHandle) return;
      if (geoChain.canRefresh) {
        geoChain.refreshEncryptedTotal();
      }
      tries += 1;
      if (tries < 10 && !cancelled) {
        setTimeout(tick, 1000);
      }
    };
    setTimeout(tick, 500);
    return () => {
      cancelled = true;
    };
  }, [txHash, geoChain.canRefresh, geoChain.handle]);

  const getRank = () => {
    if (accuracy >= 90) return { title: "地理大师", color: "from-yellow-400 to-orange-500", emoji: "🏆" };
    if (accuracy >= 70) return { title: "地理专家", color: "from-purple-400 to-pink-500", emoji: "🎯" };
    if (accuracy >= 50) return { title: "地理学徒", color: "from-blue-400 to-indigo-500", emoji: "📚" };
    return { title: "地理新手", color: "from-gray-400 to-gray-500", emoji: "🌱" };
  };

  const rank = getRank();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10%",
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  ["bg-yellow-400", "bg-blue-400", "bg-pink-400", "bg-green-400"][
                    Math.floor(Math.random() * 4)
                  ]
                }`}
              ></div>
            </div>
          ))}
        </div>
      )}

      {/* Hero Result Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-12 shadow-2xl text-center">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6 animate-bounce-slow">
            <Trophy className="w-12 h-12 text-yellow-300" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            {rank.emoji} 游戏完成！
          </h1>
          <div className={`inline-block px-6 py-2 bg-gradient-to-r ${rank.color} rounded-full text-white font-bold text-lg mb-6`}>
            {rank.title}
          </div>
          <p className="text-7xl font-bold text-white mb-2">
            {showData ? String(decryptedTotal) : "🔒"}
          </p>
          <p className="text-xl text-blue-100">总得分（需解密）</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center transform hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-500 text-sm mb-2">正确率</p>
          <p className="text-3xl font-bold text-gray-900">
            {showData ? `${accuracy.toFixed(0)}%` : "——"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg text-center transform hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-500 text-sm mb-2">平均用时</p>
          <p className="text-3xl font-bold text-gray-900">
            {showData ? `${avgTimePerQuestion.toFixed(1)}s` : "——"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg text-center transform hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-500 text-sm mb-2">答对题数</p>
          <p className="text-3xl font-bold text-gray-900">
            {showData ? `${Math.round(score / 2)} / ${totalQuestions}` : "——"}
          </p>
        </div>
      </div>

      {/* Chain Proof */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border border-green-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">✨ 成绩已上链！</h3>
            <p className="text-sm text-gray-600">你的成绩已通过 FHEVM 加密存储到区块链</p>
          </div>
        </div>
        {txHash ? (
          <div className="p-4 bg-white rounded-xl border border-green-100">
            <p className="text-xs text-gray-500 mb-1">交易哈希</p>
            <p className="font-mono text-sm text-gray-900 break-all">{txHash}</p>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-xl border border-yellow-100">
            <p className="text-xs text-gray-500 mb-1">链上状态</p>
            <p className="text-sm text-gray-700">未获取到交易哈希（你可能取消了交易或网络错误）。</p>
          </div>
        )}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => geoChain.refreshEncryptedTotal()}
            disabled={!geoChain.canRefresh}
            className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
          >
            刷新密文
          </button>
          <button
            onClick={() => geoChain.decryptEncryptedTotal({ forceSign: true })}
            disabled={geoChain.isDecrypting || (!geoChain.canDecrypt && !geoChain.isRefreshing)}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
          >
            {geoChain.isRefreshing ? "等待刷新..." : geoChain.isDecrypting ? "解密中..." : "解密查看"}
          </button>
        </div>
        {geoChain.message && (
          <p className="mt-2 text-sm text-gray-700">{geoChain.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/play"
          className="flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          <RotateCcw className="w-5 h-5" />
          <span>再来一局</span>
        </Link>

        <Link
          to="/leaderboard"
          className="flex items-center justify-center space-x-2 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 border-2 border-indigo-600 transform hover:scale-105 transition-all duration-200"
        >
          <TrendingUp className="w-5 h-5" />
          <span>查看排行榜</span>
        </Link>
      </div>

      {/* Share & Home */}
      <div className="flex items-center justify-center space-x-4">
        <button className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all duration-200">
          <Share2 className="w-5 h-5" />
          <span>分享成绩</span>
        </button>
        <Link
          to="/"
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all duration-200"
        >
          <Home className="w-5 h-5" />
          <span>返回首页</span>
        </Link>
      </div>
    </div>
  );
}

