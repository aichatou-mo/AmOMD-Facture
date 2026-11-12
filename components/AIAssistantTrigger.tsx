"use client";

import React from "react";

interface AIAssistantTriggerProps {
  onClick: () => void;
}

export default function AIAssistantTrigger({ onClick }: AIAssistantTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 sm:gap-2.5 px-3 py-2 sm:px-4 sm:py-3 bg-slate-900/95 hover:bg-slate-850 text-white rounded-2xl shadow-xl shadow-slate-950/40 border border-slate-700/80 backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer no-print"
      title="Ouvrir l'Assistant IA iziFACTURE"
    >
      <div className="relative flex items-center justify-center">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-ping" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5" />
        <span className="text-base sm:text-lg group-hover:rotate-12 transition-transform duration-200">✨</span>
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 leading-none flex items-center gap-1">
          <span>Assistant IA</span>
          <span>🎙️</span>
        </span>
        <span className="text-[11px] sm:text-xs font-black tracking-tight text-white leading-tight mt-0.5">
          iziBot Vocal
        </span>
      </div>
    </button>
  );
}

