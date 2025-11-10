import { Github, Twitter, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">
              GeoChain © 2024 | 地理知识链上存证
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-400 transition-colors duration-200"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>

          {/* Info */}
          <div className="text-sm text-gray-500">
            Powered by <span className="font-semibold text-indigo-600">FHEVM</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


