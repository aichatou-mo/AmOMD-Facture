"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "./Icons";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop sombre avec flou d'arrière-plan */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Carte modale parfaitement centrée verticalement et horizontalement */}
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-200/90 p-5 sm:p-6 text-center animate-scale-up space-y-4 z-10 my-auto">
        {/* Bouton fermer en haut à droite */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95"
          aria-label="Fermer"
        >
          <IconClose className="w-4 h-4" />
        </button>

        {/* Icône d'avertissement */}
        <div
          className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-xl shadow-xs ${
            isDestructive
              ? "bg-rose-50 text-rose-600 border border-rose-200/80"
              : "bg-emerald-50 text-emerald-600 border border-emerald-200/80"
          }`}
        >
          {isDestructive ? "⚠️" : "ℹ️"}
        </div>

        {/* Titre & Message simple et clair */}
        <div className="space-y-1.5 px-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Boutons d'action équilibrés avec rebond tactile */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all duration-150 active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-3 rounded-xl text-white text-xs font-bold shadow-md transition-all duration-150 active:scale-95 ${
              isDestructive
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                : "bg-slate-900 hover:bg-slate-800 shadow-slate-900/25"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
