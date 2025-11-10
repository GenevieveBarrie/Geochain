import { Link, useLocation } from "react-router-dom";
import { Globe, Award, TrendingUp, Home, Play, List } from "lucide-react";

interface NavbarProps {
  isConnected: boolean;
  account?: string;
  chainId?: number;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Navbar({
  isConnected,
  account,
  chainId,
  onConnect,
  onDisconnect,
}: NavbarProps) {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "首页" },
    { path: "/play", icon: Play, label: "开始游戏" },
    { path: "/records", icon: List, label: "我的记录" },
    { path: "/leaderboard", icon: TrendingUp, label: "排行榜" },
    { path: "/badges", icon: Award, label: "成就" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              GeoChain
            </span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-3">
            {isConnected && chainId && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Chain {chainId}</span>
              </div>
            )}
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </div>
                <button
                  onClick={onDisconnect}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  断开
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                连接钱包
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center justify-around pb-2 pt-1 border-t border-gray-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

