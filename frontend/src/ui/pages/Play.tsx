import { useState, useEffect, useRef, RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { Timer, MapPin, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { ethers } from "ethers";
import { FhevmInstance } from "../../web3/fhevm/fhevmTypes";
import { useGeoChain } from "../../web3/hooks/useGeoChain";
import { CountryCard } from "../components/CountryCard";
import { ProgressRing } from "../components/ProgressRing";

interface PlayProps {
  isConnected: boolean;
  fhevmInstance: FhevmInstance | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  chainId: number | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}

// Mock question data - 使用真实地理数据，不用静态SVG
const mockQuestions = [
  { 
    id: 1, 
    country: "中国", 
    options: ["中国", "日本", "韩国", "蒙古"], 
    difficulty: "easy", 
    hint: "世界上人口最多的国家之一", 
    explanation: "中国，首都北京，是世界四大文明古国之一。"
  },
  {
    id: 2,
    country: "法国",
    options: ["西班牙", "意大利", "法国", "德国"],
    difficulty: "medium",
    hint: "以埃菲尔铁塔闻名",
    explanation: "法国，首都巴黎，是欧洲浪漫之都。"
  },
  {
    id: 3,
    country: "巴西",
    options: ["阿根廷", "巴西", "智利", "秘鲁"],
    difficulty: "hard",
    hint: "南美洲最大的国家",
    explanation: "巴西，首都巴西利亚，足球王国。"
  },
];

export function Play({
  isConnected,
  fhevmInstance,
  ethersSigner,
  ethersReadonlyProvider,
  chainId,
  sameChain,
  sameSigner,
}: PlayProps) {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const geoChain = useGeoChain({
    instance: fhevmInstance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const question = mockQuestions[currentQuestion];
  const totalQuestions = mockQuestions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  // Timer
  useEffect(() => {
    if (isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion, isAnswered]);

  const handleTimeout = () => {
    setIsAnswered(true);
    setIsCorrect(false);
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    const correct = answer === question.country;
    setIsCorrect(correct);

    if (correct) {
      const timeUsed = 30 - timeLeft;
      let points = 0;
      if (timeUsed <= 10) points = 3;
      else if (timeUsed <= 20) points = 2;
      else points = 1;

      if (showHint) points = Math.max(1, points - 1);
      setScore((prev) => prev + points);
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(30);
      setShowHint(false);
      setStartTime(Date.now());
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setSubmitError(null);
    // 必须走合约：若条件不满足则直接提示并阻止跳转
    if (!isConnected) {
      setSubmitError("请先连接钱包后再上链。");
      return;
    }
    // 不能依赖 geoChain.canSubmit（其依赖 hook 内部表单），改为最小环境就绪判断
    if (!geoChain.contractAddress || !ethersSigner || !fhevmInstance) {
      setSubmitError("合约未就绪：请确认已部署到当前网络并切到正确链，且 FHEVM 已就绪。");
      return;
    }
    try {
      setSubmitting(true);
      const resultCID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"; // Mock CID
      const resultHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ score })));
      const txHash = await geoChain.submitResultWith({
        score,
        // 公开号榜分数：用于排行榜统计
        scorePublic: score,
        resultCID,
        resultHash,
      });
      // 只有成功拿到交易哈希才跳转
      navigate("/result", {
        state: {
          score,
          totalQuestions,
          timeSpent: Math.floor((Date.now() - startTime) / 1000),
          txHash,
        },
      });
    } catch (e: any) {
      console.error("Submit failed:", e);
      setSubmitError(`上链失败：${e?.message ?? String(e)}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            请先连接钱包
          </h2>
          <p className="text-gray-600">连接钱包后即可开始游戏</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <ProgressRing progress={progress} size={60} />
            <div>
              <p className="text-sm text-gray-500">进度</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentQuestion + 1} / {totalQuestions}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">当前得分</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {score}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
          <Timer
            className={`w-6 h-6 ${
              timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-blue-600"
            }`}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                剩余时间
              </span>
              <span
                className={`text-lg font-bold ${
                  timeLeft <= 10 ? "text-red-600" : "text-gray-900"
                }`}
              >
                {timeLeft}s
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  timeLeft <= 10
                    ? "bg-red-500"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600"
                }`}
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="mb-6">
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg mb-4">
            {question.difficulty === "easy"
              ? "简单"
              : question.difficulty === "medium"
              ? "中等"
              : "困难"}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            这是哪个国家？
          </h2>

          {/* Map silhouette */}
          <CountryCard countryName={question.country} revealed={isAnswered} />
        </div>

        {/* Hint */}
        {!isAnswered && (
          <button
            onClick={() => setShowHint(true)}
            className="flex items-center space-x-2 text-yellow-600 hover:text-yellow-700 font-medium mb-6 transition-colors duration-200"
          >
            <Lightbulb className="w-5 h-5" />
            <span>{showHint ? question.hint : "显示提示（-1分）"}</span>
          </button>
        )}

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === question.country;
            const showResult = isAnswered;

            let className =
              "p-4 rounded-xl border-2 font-semibold transition-all duration-200 ";

            if (!showResult) {
              className += isSelected
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700";
            } else {
              if (isCorrectAnswer) {
                className +=
                  "border-green-500 bg-green-50 text-green-700 animate-bounce-once";
              } else if (isSelected && !isCorrectAnswer) {
                className += "border-red-500 bg-red-50 text-red-700";
              } else {
                className += "border-gray-200 bg-gray-50 text-gray-500";
              }
            }

            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={isAnswered}
                className={className}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {showResult && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Result Message */}
        {isAnswered && (
          <div
            className={`p-4 rounded-xl mb-6 ${
              isCorrect
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`font-semibold mb-2 ${
                isCorrect ? "text-green-700" : "text-red-700"
              }`}
            >
              {isCorrect ? "✨ 回答正确！" : "❌ 回答错误"}
            </p>
            <p className="text-gray-700 text-sm">{question.explanation}</p>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="p-4 rounded-xl mb-6 bg-red-50 border border-red-200 text-red-700">
            <p className="font-semibold mb-1">上链失败</p>
            <p className="text-sm">{submitError}</p>
          </div>
        )}

        {/* Next Button */}
        {isAnswered && (
          <button
            onClick={handleNext}
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            {currentQuestion < totalQuestions - 1 ? "下一题" : submitting ? "上链中..." : "完成并上链"}
          </button>
        )}
      </div>
    </div>
  );
}

