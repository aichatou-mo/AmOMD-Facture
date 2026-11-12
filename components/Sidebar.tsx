"use client";

import React from "react";
import {
  IconDashboard,
  IconInvoices,
  IconClients,
  IconSettings,
  IconHelp,
  IconLogout,
  IconClose,
  IconWhatsApp,
} from "./Icons";
import { useTranslation } from "@/lib/i18n";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenNewInvoice?: () => void;
  invoicesCount?: number;
  clientsCount?: number;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: string;
  badge?: string;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen,
  invoicesCount = 0,
  clientsCount = 0,
  userName = "Utilisateur",
  userEmail = "",
  onLogout,
}: SidebarProps) {
  const { t } = useTranslation();

  const mainNav: NavItem[] = [
    { id: "dashboard", label: t.dashboard || "Tableau de bord", icon: IconDashboard },
    { id: "invoices", label: t.invoices || "Factures", icon: IconInvoices, count: String(invoicesCount) },
    { id: "clients", label: t.clients || "Clients", icon: IconClients, count: String(clientsCount) },
  ];

  const configNav: NavItem[] = [
    { id: "settings", label: t.settings || "Paramètres", icon: IconSettings },
    { id: "help", label: t.help || "Aide & Support", icon: IconHelp },
  ];

  const [showHelpModal, setShowHelpModal] = React.useState<boolean>(false);

  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "IZ";

  const sidebarContent = (
    <div className="flex flex-col h-full max-h-screen bg-white text-slate-700 select-none shadow-xl lg:shadow-none border-r border-slate-200/70">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 pb-3.5 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform">
            <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15l2 2 4-4" />
            </svg>
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900">iziFACTURE</span>
        </div>

        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all"
            aria-label="Fermer le menu"
          >
            <IconClose className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar">
        <div>
          <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t.dailyManagement || "Menu"}
          </p>
          <div className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-[0.97] ${isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${isActive ? "text-emerald-400" : "text-slate-400"
                        }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && Number(item.count) > 0 && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${isActive
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t.configuration || "Utilitaires"}
          </p>
          <div className="space-y-1">
            {configNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "help") {
                      setShowHelpModal(true);
                    } else {
                      setCurrentTab(item.id);
                    }
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-[0.97] ${isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${isActive ? "text-emerald-400" : "text-slate-400"
                      }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 font-bold text-xs flex items-center justify-center shadow-xs">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
              {userEmail && (
                <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
              )}
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title={t.logout || "Se déconnecter"}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl active:scale-90 transition-all shrink-0 cursor-pointer"
            >
              <IconLogout className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 fixed top-0 bottom-0 left-0 h-screen max-h-screen border-r border-slate-200/70 z-30">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-[80vw] shadow-2xl z-50 animate-drawer-in">
            {sidebarContent}
          </div>
        </div>
      )}

      {showHelpModal && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200/90 space-y-6 animate-scale-up text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer en haut à droite */}
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
              aria-label="Fermer"
            >
              <IconClose className="w-5 h-5" />
            </button>

            {/* En-tête avec avatar support centré (conforme à la capture d'écran utilisateur) */}
            <div className="text-center pt-2">
              <div className="w-16 h-16 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-700/20 border-2 border-emerald-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 11a9 9 0 0118 0" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3.5">
                Bonjour, {userName && userName !== "Utilisateur" ? userName : "moussa Ousmane"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Que pouvons-nous faire pour vous ?
              </p>
            </div>

            {/* Liste des options de contact (inspirée fidèlement de la capture utilisateur) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {/* 1. WhatsApp */}
              <a
                href="https://wa.me/22777063837?text=Bonjour%20Support%20iziFACTURE"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50/80 transition active:scale-[0.99] group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0 group-hover:bg-emerald-100 transition">
                    <IconWhatsApp className="w-5 h-5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm sm:text-base text-slate-900 font-mono tracking-tight">
                      +227 77 06 38 37
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Discuter sur WhatsApp
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-slate-700 text-lg font-bold group-hover:translate-x-0.5 transition shrink-0 ml-2">
                  ›
                </span>
              </a>

              {/* 2. Appel Téléphonique */}
              <a
                href="tel:+22777063837"
                className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50/80 transition active:scale-[0.99] group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0 group-hover:bg-emerald-100 transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm sm:text-base text-slate-900 font-mono tracking-tight">
                      +227 77 06 38 37
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Appeler le support
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-slate-700 text-lg font-bold group-hover:translate-x-0.5 transition shrink-0 ml-2">
                  ›
                </span>
              </a>

              {/* 3. Email Direct */}
              <a
                href="mailto:moussaousmaneaicha@gmail.com?subject=Assistance%20iziFACTURE"
                className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50/80 transition active:scale-[0.99] group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0 group-hover:bg-emerald-100 transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs sm:text-sm text-slate-900 font-mono tracking-tight break-all">
                      moussaousmaneaicha@gmail.com
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Envoyer un email
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-slate-700 text-lg font-bold group-hover:translate-x-0.5 transition shrink-0 ml-2">
                  ›
                </span>
              </a>

              {/* 4. Centre d'Aide & Documentation */}
              <a
                href="#guide"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Guide rapide iziFACTURE :\n\n1. Création : Cliquez sur '+ Nouvelle facture' puis choisissez Doit, Avoir ou Proforma.\n2. TVA : Taux personnalisable sur chaque ligne et calcul OHADA instantané.\n3. Téléchargement : Export PDF officiel A4 ou partage direct sur WhatsApp.\n4. Support : Joignable 7j/7 au +227 77 06 38 37.");
                }}
                className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50/80 transition active:scale-[0.99] group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0 group-hover:bg-emerald-100 transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                      www.izifacture.com/aide
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Visiter le site d&apos;aide & FAQ
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-slate-700 text-lg font-bold group-hover:translate-x-0.5 transition shrink-0 ml-2">
                  ›
                </span>
              </a>
            </div>

            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold transition active:scale-95 shadow-md cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
