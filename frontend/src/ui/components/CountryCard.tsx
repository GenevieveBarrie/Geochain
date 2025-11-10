import { useState, useEffect } from "react";
import { Map } from "lucide-react";
import { GeoCountry } from "./GeoCountry";

interface CountryCardProps {
  countryName: string;
  revealed: boolean;
  mapUrl?: string; // 静态 SVG 轮廓地址（public 下）
}

export function CountryCard({ countryName, revealed, mapUrl }: CountryCardProps) {
  const [revealProgress, setRevealProgress] = useState(0);

  useEffect(() => {
    if (revealed) {
      const interval = setInterval(() => {
        setRevealProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 30);
      return () => clearInterval(interval);
    } else {
      setRevealProgress(0);
    }
  }, [revealed]);

  return (
    <div className="relative w-full aspect-video bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-2xl overflow-hidden shadow-inner">
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full grid grid-cols-8 grid-rows-6">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border border-blue-300"></div>
          ))}
        </div>
      </div>

      {/* Map silhouette (SVG) */}
      {mapUrl ? (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <img
            src={mapUrl}
            alt={countryName}
            className={`w-full h-full object-contain drop-shadow-xl transition-all duration-700 ${
              revealed ? "opacity-100 scale-100" : "opacity-90 scale-[0.98]"
            }`}
          />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 p-4">
            <GeoCountry countryNameZh={countryName} revealed={revealed} />
          </div>
        </>
      )}

      {/* Reveal overlay */}
      {revealed && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"
          style={{
            left: `${revealProgress - 100}%`,
            width: "200%",
          }}
        ></div>
      )}

      {/* Country name */}
      {revealed && revealProgress >= 80 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <p className="text-4xl font-bold text-white drop-shadow-lg">
              {countryName}
            </p>
          </div>
        </div>
      )}

      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
    </div>
  );
}

