"use client";

import React, { useState, useRef, useEffect } from "react";
import { IconChevronDown } from "./Icons";

// Matrice complète des Couleurs du Thème façon Microsoft Office / Word
const THEME_COLUMNS = [
  // 1. Blanc
  {
    base: "#FFFFFF",
    shades: ["#F8FAFC", "#F1F5F9", "#E2E8F0", "#CBD5E1", "#94A3B8"],
  },
  // 2. Noir Obsidienne
  {
    base: "#0F172A",
    shades: ["#475569", "#334155", "#1E293B", "#0F172A", "#020617"],
  },
  // 3. Gris Ardoise
  {
    base: "#64748B",
    shades: ["#F1F5F9", "#E2E8F0", "#94A3B8", "#64748B", "#334155"],
  },
  // 4. Bleu Sahel / Nuit
  {
    base: "#1E3A8A",
    shades: ["#DBEAFE", "#93C5FD", "#3B82F6", "#1D4ED8", "#172554"],
  },
  // 5. Vert Émeraude (Signature Sahel / iziFACTURE)
  {
    base: "#059669",
    shades: ["#D1FAE5", "#6EE7B7", "#10B981", "#059669", "#064E3B"],
  },
  // 6. Orange Safran
  {
    base: "#EA580C",
    shades: ["#FFEDD5", "#FDBA74", "#F97316", "#C2410C", "#7C2D12"],
  },
  // 7. Or / Ambre
  {
    base: "#D97706",
    shades: ["#FEF3C7", "#FCD34D", "#F59E0B", "#B45309", "#78350F"],
  },
  // 8. Bleu Roi
  {
    base: "#2563EB",
    shades: ["#EFF6FF", "#BFDBFE", "#60A5FA", "#1D4ED8", "#1E40AF"],
  },
  // 9. Pourpre / Indigo
  {
    base: "#7C3AED",
    shades: ["#F3E8FF", "#D8B4FE", "#A855F7", "#7E22CE", "#581C87"],
  },
  // 10. Rouge Terre
  {
    base: "#DC2626",
    shades: ["#FEE2E2", "#FCA5A5", "#EF4444", "#B91C1C", "#7F1D1D"],
  },
];

// Rangée des 10 Couleurs Standard Office
const STANDARD_COLORS = [
  { hex: "#C00000", name: "Rouge foncé" },
  { hex: "#FF0000", name: "Rouge" },
  { hex: "#FFC000", name: "Orange clair" },
  { hex: "#FFFF00", name: "Jaune" },
  { hex: "#92D050", name: "Vert clair" },
  { hex: "#00B050", name: "Vert" },
  { hex: "#00B0F0", name: "Bleu ciel" },
  { hex: "#0070C0", name: "Bleu moyen" },
  { hex: "#002060", name: "Bleu foncé" },
  { hex: "#7030A0", name: "Pourpre" },
];

interface OfficeColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function OfficeColorPicker({
  value,
  onChange,
  label = "Couleur du document",
}: OfficeColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomHex(value);
  }, [value]);

  // Fermer le popover au clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectColor = (hex: string) => {
    onChange(hex);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Bouton déclencheur élégant avec aperçu de la couleur */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-2 bg-white hover:bg-[#f8f7f3] border border-[#e4e2d9] rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-xs font-bold text-[#111522]"
        title="Ouvrir le nuancier de couleurs"
      >
        <span
          className="w-5 h-5 rounded-md border border-[#d6d3c9] shadow-2xs shrink-0"
          style={{ backgroundColor: value }}
        />
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-[#697080] font-semibold uppercase tracking-wider leading-none">
            {label}
          </span>
          <span className="font-mono text-xs font-extrabold text-[#111522] leading-tight">
            {value.toUpperCase()}
          </span>
        </div>
        <IconChevronDown
          className={`w-3.5 h-3.5 text-[#5f6571] transition-transform ml-1 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Menu façon Microsoft Office / Word */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 left-0 sm:left-auto sm:right-0 w-[275px] bg-white rounded-2xl shadow-2xl border border-[#e8e7e2] p-3 animate-in fade-in zoom-in-95 duration-100"
          style={{ filter: "drop-shadow(0 15px 30px rgba(17, 21, 34, 0.16))" }}
        >
          {/* 1. Bouton Automatique (Défaut Bleu Nuit) */}
          <button
            type="button"
            onClick={() => handleSelectColor("#111522")}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#f2f0e8] text-xs font-bold text-[#111522] transition text-left cursor-pointer"
          >
            <span className="w-4 h-4 rounded border border-[#111522] bg-[#111522] shrink-0" />
            <span>Automatique (Bleu Nuit)</span>
            {value.toUpperCase() === "#111522" && (
              <span className="ml-auto text-[#a18400] text-[11px] font-bold">✓</span>
            )}
          </button>

          {/* Séparateur */}
          <div className="h-px bg-[#edece6] my-2" />

          {/* 2. COULEURS DU THÈME */}
          <div className="mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#697080] block mb-1.5 px-1">
              Couleurs du thème
            </span>

            {/* Rangée des bases */}
            <div className="grid grid-cols-10 gap-1 px-1 mb-1">
              {THEME_COLUMNS.map((col, idx) => (
                <button
                  key={`base-${idx}`}
                  type="button"
                  onClick={() => handleSelectColor(col.base)}
                  className={`w-5 h-5 rounded-xs transition-transform hover:scale-110 border ${
                    value.toLowerCase() === col.base.toLowerCase()
                      ? "ring-2 ring-[#ffdc45] border-[#111522]"
                      : "border-[#e4e2d9]"
                  }`}
                  style={{ backgroundColor: col.base }}
                  title={col.base}
                />
              ))}
            </div>

            {/* Nuances (shades) empilées en 5 lignes */}
            <div className="space-y-0.5 px-1">
              {[0, 1, 2, 3, 4].map((shadeIdx) => (
                <div key={`row-${shadeIdx}`} className="grid grid-cols-10 gap-1">
                  {THEME_COLUMNS.map((col, colIdx) => {
                    const shade = col.shades[shadeIdx];
                    const isSelected = value.toLowerCase() === shade.toLowerCase();
                    return (
                      <button
                        key={`shade-${colIdx}-${shadeIdx}`}
                        type="button"
                        onClick={() => handleSelectColor(shade)}
                        className={`w-5 h-4 rounded-xs transition-transform hover:scale-110 border ${
                          isSelected
                            ? "ring-2 ring-[#ffdc45] border-[#111522]"
                            : "border-[#edece6]"
                        }`}
                        style={{ backgroundColor: shade }}
                        title={shade}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 3. COULEURS STANDARD */}
          <div className="mb-3 pt-2 border-t border-[#edece6]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#697080] block mb-1.5 px-1">
              Couleurs standard
            </span>
            <div className="grid grid-cols-10 gap-1 px-1">
              {STANDARD_COLORS.map((std) => (
                <button
                  key={std.hex}
                  type="button"
                  onClick={() => handleSelectColor(std.hex)}
                  className={`w-5 h-5 rounded-xs transition-transform hover:scale-110 border ${
                    value.toLowerCase() === std.hex.toLowerCase()
                      ? "ring-2 ring-[#ffdc45] border-[#111522]"
                      : "border-[#e4e2d9]"
                  }`}
                  style={{ backgroundColor: std.hex }}
                  title={std.name}
                />
              ))}
            </div>
          </div>

          {/* 4. AUTRES COULEURS / MIXER LIBRE */}
          <div className="pt-2 border-t border-[#edece6]">
            <div className="flex items-center justify-between gap-2 px-1">
              <button
                type="button"
                onClick={() => nativeInputRef.current?.click()}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#f2f0e8] text-xs font-bold text-[#111522] transition cursor-pointer flex-1"
              >
                {/* Icône roue chromatique */}
                <span className="text-sm">🎨</span>
                <span>Autres couleurs...</span>
              </button>

              {/* Pipette native cachée */}
              <input
                ref={nativeInputRef}
                type="color"
                value={value.startsWith("#") ? value : "#111522"}
                onChange={(e) => handleSelectColor(e.target.value)}
                className="sr-only"
              />

              {/* Champ Hex interactif direct */}
              <input
                type="text"
                value={customHex}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomHex(val);
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    onChange(val);
                  }
                }}
                placeholder="#111522"
                className="w-20 px-2 py-1 font-mono text-[11px] font-bold text-[#111522] bg-[#f8f7f3] border border-[#e4e2d9] rounded-md uppercase text-center focus:bg-white focus:outline-none focus:border-[#111522]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

