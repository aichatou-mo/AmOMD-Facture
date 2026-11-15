"use client";

import React, { useState, useEffect } from "react";
import { IconArrowUp, IconArrowDown } from "./Icons";

export default function ScrollNavigation() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-40 flex flex-col items-center gap-1.5 select-none print:hidden group"
      aria-label="Navigation rapide haut et bas"
    >
      {/* Widget Flottant Dual-Arrow */}
      <div className="bg-[#111522]/95 backdrop-blur-md text-white border border-white/15 shadow-2xl shadow-[#111522]/40 rounded-2xl p-1.5 flex flex-col items-center gap-1 transition-all duration-200 hover:border-[#ffdc45]/60">
        {/* Flèche Aller tout en HAUT */}
        <button
          type="button"
          onClick={scrollToTop}
          title="Aller tout en haut (Début)"
          className="p-2 sm:p-2.5 rounded-xl hover:bg-[#ffdc45]/20 hover:text-[#ffdc45] text-[#c4c7d1] active:scale-90 transition-all duration-150 flex items-center justify-center group/btn"
          aria-label="Aller tout en haut"
        >
          <IconArrowUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </button>

        {/* Ligne de séparation subtile avec barre de progression */}
        <div className="w-5 h-[1px] bg-white/15 relative overflow-hidden my-0.5">
          <div
            className="h-full bg-[#ffdc45] transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Flèche Aller tout en BAS */}
        <button
          type="button"
          onClick={scrollToBottom}
          title="Aller tout en bas (Fin)"
          className="p-2 sm:p-2.5 rounded-xl hover:bg-[#ffdc45]/20 hover:text-[#ffdc45] text-[#c4c7d1] active:scale-90 transition-all duration-150 flex items-center justify-center group/btn"
          aria-label="Aller tout en bas"
        >
          <IconArrowDown className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Petit badge d'information escamotable */}
      <span className="text-[9px] font-mono font-bold text-[#111522] bg-[#ffdc45]/95 backdrop-blur-sm px-2 py-0.5 rounded-full border border-[#ffe36a] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
        Haut / Bas
      </span>
    </div>
  );
}
