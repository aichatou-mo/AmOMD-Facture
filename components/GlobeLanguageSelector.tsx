"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation, Language } from "@/lib/i18n";
import { IconGlobe, IconCheck, IconClose, IconSearch } from "./Icons";

export interface LanguageOption {
  code: Language;
  flag: string;
  nativeName: string;
  region: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { code: "fr", flag: "", nativeName: "Français", region: "Langue principale" },
  { code: "en", flag: "", nativeName: "English", region: "International" },
  { code: "ha", flag: "", nativeName: "Harshen Hausa", region: "Afrique de l'Ouest" },
  { code: "ar", flag: "", nativeName: "العربية", region: "Al-Arabiya" },
  { code: "es", flag: "", nativeName: "Español", region: "Castellano" },
  { code: "pt", flag: "", nativeName: "Português", region: "Lusophone" },
  { code: "de", flag: "", nativeName: "Deutsch", region: "Standard Deutsch" },
  { code: "zh", flag: "", nativeName: "中文 (Mandarin)", region: "International" },
];

interface GlobeLanguageSelectorProps {
  className?: string;
  dropdownAlign?: "left" | "right";
  showCodeBadge?: boolean;
}

export default function GlobeLanguageSelector({
  className = "",
  dropdownAlign = "right",
  showCodeBadge = true,
}: GlobeLanguageSelectorProps) {
  const { lang, setLang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentLangObj =
    AVAILABLE_LANGUAGES.find((l) => l.code === lang) || AVAILABLE_LANGUAGES[0];

  const filteredLanguages = AVAILABLE_LANGUAGES.filter((l) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q) ||
      l.region.toLowerCase().includes(q)
    );
  });

  const handleSelectLanguage = (code: Language) => {
    setLang(code);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        id="globe-language-btn"
        aria-label="Sélectionner la langue"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-all duration-200 active:scale-95 shadow-xs ${
          isOpen
            ? "bg-slate-900 text-white border-slate-800 ring-2 ring-emerald-500/40 shadow-md"
            : "bg-white text-slate-700 border-slate-200 hover:text-emerald-700 hover:border-emerald-300"
        }`}
        title={`Langue : ${currentLangObj.nativeName}`}
      >
        <div className="relative flex items-center justify-center">
          <IconGlobe className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-12 text-current" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        {showCodeBadge && (
          <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-slate-900 text-white font-mono text-[9px] font-extrabold rounded-full border border-white shadow-xs leading-none">
            {lang.toUpperCase()}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            dropdownAlign === "left" ? "left-0" : "right-0"
          } mt-2.5 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-scale-up`}
          style={{ transformOrigin: dropdownAlign === "left" ? "top left" : "top right" }}
        >
          <div className="p-3.5 bg-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <IconGlobe className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 tracking-tight">
                  Choisir une langue
                </h4>
                <p className="text-[10px] text-slate-500">Recherchez ou cliquez pour changer</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition active:scale-90"
              title="Fermer"
            >
              <IconClose className="w-4 h-4" />
            </button>
          </div>

          {/* Search input */}
          <div className="px-3 pt-2.5 pb-1">
            <div className="relative">
              <IconSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une langue..."
                autoFocus
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="p-2 max-h-64 overflow-y-auto space-y-1">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Aucune langue trouvée
              </div>
            ) : (
              filteredLanguages.map((item) => {
                const isSelected = item.code === lang;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelectLanguage(item.code)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 active:scale-95 ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg font-mono text-[10px] font-extrabold uppercase flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.code}
                      </span>
                      <div className="text-left min-w-0">
                        <p className={`font-bold truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {item.nativeName}
                        </p>
                        <p className={`text-[10px] truncate ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                          {item.region}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-slate-900 shrink-0">
                        <IconCheck className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
