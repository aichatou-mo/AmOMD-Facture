"use client";

import React, { useEffect, useState } from "react";

interface LandingPageProps {
  onLogin: () => void;
  onGetStarted: () => void;
}

export default function LandingPage({ onLogin, onGetStarted }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [ctaClicked, setCtaClicked] = useState(false);
  const [activeChartBar, setActiveChartBar] = useState<number>(5);
  const [notificationClicked, setNotificationClicked] = useState(false);
  const [stampClicked, setStampClicked] = useState(false);
  const [copiedContact, setCopiedContact] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll(".lp-reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("lp-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lp-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handlePrimaryCtaClick = () => {
    setCtaClicked(true);
    setTimeout(() => {
      setCtaClicked(false);
      onGetStarted();
    }, 220);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  };

  const chartBars = [
    { label: "Lun", height: "35%", amount: "410 000" },
    { label: "Mar", height: "60%", amount: "720 000" },
    { label: "Mer", height: "45%", amount: "540 000" },
    { label: "Jeu", height: "78%", amount: "945 000" },
    { label: "Ven", height: "55%", amount: "680 000" },
    { label: "Sam", height: "92%", amount: "1 245 000" },
    { label: "Dim", height: "70%", amount: "890 000" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#111522] font-sans overflow-x-hidden selection:bg-[#ffdc45] selection:text-[#111522]">
      <style jsx>{`
        .lp-reveal {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.65s ease, transform 0.65s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .lp-reveal.lp-visible {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>

      {/* ==================== TOP STICKY / ANIMATED HEADER ==================== */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 bg-[#111522] border-b border-white/10 shadow-lg py-3 sm:py-3.5 transition-all duration-300"
      >
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => scrollToSection("accueil")}
            className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl tracking-tight group focus:outline-none cursor-pointer"
          >
            <span className="w-8 h-8 rounded-[9px] bg-[#ffdc45] text-[#111522] grid place-items-center font-extrabold text-sm -rotate-6 shadow-[0_4px_15px_rgba(255,220,69,0.45)] group-hover:rotate-0 group-hover:scale-105 transition-transform duration-200">
              A
            </span>
            <span className="tracking-[-0.03em]">AMOMD FACTURE</span>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#c4c7d1]">
            <button
              type="button"
              onClick={() => scrollToSection("fonctionnalites")}
              className="hover:text-[#ffdc45] transition-colors cursor-pointer"
            >
              Fonctionnalités
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("comment")}
              className="hover:text-[#ffdc45] transition-colors cursor-pointer"
            >
              Comment ça marche
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("tarifs")}
              className="hover:text-[#ffdc45] transition-colors cursor-pointer"
            >
              Tarifs
            </button>
          </div>

          {/* Desktop Auth CTAs */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              type="button"
              onClick={onLogin}
              className="px-4 py-2 rounded-full text-[13px] font-semibold text-white/90 hover:text-[#ffdc45] border border-white/20 hover:border-[#ffdc45]/60 bg-white/5 transition-all active:scale-95 cursor-pointer"
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="cta-hero-btn px-4 py-2.5 rounded-full text-[13px] font-bold bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] shadow-[0_8px_24px_rgba(255,220,69,0.3)] flex items-center gap-1.5 cursor-pointer"
            >
              <span>Créer un compte</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>

          {/* Mobile Actions: Connexion + Hamburger Menu */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={onLogin}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-bold text-white border border-white/25 bg-white/10 active:scale-95 transition-transform cursor-pointer"
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Ouvrir le menu de navigation"
              aria-expanded={mobileMenuOpen}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 flex flex-col items-center justify-center gap-1.5 text-white active:scale-95 transition-all cursor-pointer"
            >
              <span
                className={`block w-5 h-0.5 bg-[#ffdc45] rounded-full transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
              />
              <span
                className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? "opacity-0 scale-0" : ""
                  }`}
              />
              <span
                className={`block w-5 h-0.5 bg-[#ffdc45] rounded-full transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* ==================== FLOATING MOBILE MENU MODAL (INSPIRÉ DE LA CAPTURE RÉFÉRENCE 3) ==================== */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-[#0c111d]/75 backdrop-blur-md flex flex-col items-center justify-start p-4 pt-4 sm:pt-6 animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Floating Card (style épuré blanc & noir de la capture 3) */}
          <div
            className="w-full max-w-sm bg-white text-[#111522] rounded-[28px] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-slate-200/80 animate-scale-up space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar of the Card */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-[9px] bg-[#ffdc45] text-[#111522] grid place-items-center font-extrabold text-sm -rotate-6 shadow-sm">
                  A
                </span>
                <span className="font-bold text-base tracking-tight text-[#111522] font-serif">
                  AMOMD FACTURE
                </span>
              </div>
              {/* Bouton fermer rond avec belle animation tactile */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs active:scale-90 transition-all cursor-pointer shadow-xs"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Navigation Links (sans flèches) */}
            <div className="py-1 space-y-1">
              <button
                type="button"
                onClick={() => scrollToSection("fonctionnalites")}
                className="w-full text-left px-3 py-3 rounded-2xl text-[16px] font-bold text-[#111522] hover:bg-slate-100 hover:text-[#0c111d] active:scale-[0.98] transition-all cursor-pointer block"
              >
                Fonctionnalités
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("tarifs")}
                className="w-full text-left px-3 py-3 rounded-2xl text-[16px] font-bold text-[#111522] hover:bg-slate-100 hover:text-[#0c111d] active:scale-[0.98] transition-all cursor-pointer block"
              >
                Tarifs
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("comment")}
                className="w-full text-left px-3 py-3 rounded-2xl text-[16px] font-bold text-[#111522] hover:bg-slate-100 hover:text-[#0c111d] active:scale-[0.98] transition-all cursor-pointer block"
              >
                Comment ça marche
              </button>
            </div>

            {/* Action Buttons : Se connecter + Bouton sombre Essai gratuit */}
            <div className="pt-2 space-y-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogin();
                }}
                className="w-full py-2.5 text-center text-sm font-bold text-slate-700 hover:text-[#111522] transition-colors cursor-pointer block active:scale-95"
              >
                Se connecter
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetStarted();
                }}
                className="w-full py-3.5 rounded-full bg-[#111522] hover:bg-[#1f273d] text-white font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Essai gratuit ↗</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== HERO SECTION ==================== */}
      <header
        id="accueil"
        className="relative overflow-hidden text-white pt-24 sm:pt-32 lg:pt-36 pb-16 sm:pb-20 lg:pb-24 scroll-mt-24"
        style={{
          background:
            "radial-gradient(ellipse at 82% 42%, #1b253d 0%, #111522 48%, #0c111d 100%)",
        }}
      >
        {/* Ambient Night Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-32 w-[520px] h-[520px] rounded-full bg-[#4f619e]/20 blur-3xl"
        />

        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[0.94fr_1.06fr] gap-10 lg:gap-10 items-center">
            {/* Hero Left Copy */}
            <div className="max-w-[560px]">
              <h1 className="font-serif font-medium text-[40px] sm:text-[54px] lg:text-[70px] leading-[1.04] tracking-[-0.03em] mt-2 sm:mt-4 mb-5 text-white">
                Fini les factures
                <br />
                sur Word et <em className="text-[#ffdc45] italic font-medium">Excel.</em>
              </h1>

              <p className="text-[#d0d3dc] text-sm sm:text-[15.5px] leading-[1.75] max-w-[445px]">
                Crée des factures nettes en FCFA, calcule ta TVA sans effort et garde un œil sur
                chaque paiement. Tout au même endroit.
              </p>

              {/* Animated Hero CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mt-8">
                <button
                  type="button"
                  onClick={handlePrimaryCtaClick}
                  className={`cta-hero-btn px-6 py-4 rounded-full bg-[#ffdc45] hover:bg-[#ffe879] text-[#171522] font-black text-sm shadow-[0_10px_28px_rgba(255,220,69,0.3)] inline-flex items-center justify-center gap-3 group cursor-pointer active:scale-95 transition-all ${ctaClicked ? "scale-95 ring-4 ring-[#ffdc45]/40" : ""
                    }`}
                >
                  <span>Créer mon compte gratuitement</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#111522] text-[#ffdc45] text-xs transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:rotate-12">
                    ↗
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection("apercu-outil")}
                  className="px-6 py-4 rounded-full border border-white/25 bg-white/[0.06] hover:bg-white/[0.12] hover:border-[#ffdc45]/60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2.5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 text-[#ffdc45]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                  <span>Découvrir l’outil</span>
                </button>
              </div>

              {/* Tiny Social Proof */}
              <div className="flex items-center gap-3 mt-8 text-xs text-[#a2a8b8]">
                <div className="flex items-center -space-x-2">
                  <span className="w-7 h-7 rounded-full border-2 border-[#111522] bg-[#bbd2bc] text-[#1c3322] font-bold text-[10px] grid place-items-center">
                    A
                  </span>
                  <span className="w-7 h-7 rounded-full border-2 border-[#111522] bg-[#dfb48e] text-[#44342c] font-bold text-[10px] grid place-items-center">
                    M
                  </span>
                  <span className="w-7 h-7 rounded-full border-2 border-[#111522] bg-[#d9b9d1] text-[#3e2538] font-bold text-[10px] grid place-items-center">
                    F
                  </span>
                </div>
                <span>
                  <strong className="text-[#f3f1e9]">Déjà adopté</strong> par des entrepreneurs comme toi
                </span>
              </div>
            </div>

            {/* Hero Right Visual: Pure Code Interactive App Mockup */}
            <div id="apercu-outil" className="relative pt-7 pb-8 sm:pt-8 sm:pb-10 lg:pl-4 scroll-mt-24">
              {/* Floating Notification Card (Noir Nuit & Or avec angle dynamique 5°) */}
              <div
                onClick={() => {
                  setNotificationClicked(true);
                  setTimeout(() => setNotificationClicked(false), 2400);
                }}
                className={`animate-float-gentle relative sm:absolute sm:-right-2 sm:-top-3 z-30 mb-4 sm:mb-0 ml-auto w-[230px] sm:w-[225px] bg-[#111522] text-white rounded-2xl p-4 shadow-[0_24px_55px_rgba(0,0,0,0.65)] border-2 transition-all duration-300 cursor-pointer active:scale-95 select-none transform rotate-[4deg] sm:rotate-[5deg] hover:rotate-0 hover:scale-105 ${notificationClicked
                    ? "border-[#ffdc45] ring-4 ring-[#ffdc45]/30 scale-105 shadow-[0_24px_60px_rgba(255,220,69,0.35)]"
                    : "border-[#ffdc45]/60 hover:border-[#ffdc45]"
                  }`}
                title="Cliquer pour tester la notification client"
              >
                {/* Header de la carte notification */}
                <div className="flex items-center justify-between text-[10px] text-[#ffdc45] font-extrabold uppercase tracking-wider">
                  <span className="inline-flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffdc45] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffdc45]" />
                    </span>
                    <span>Notification facture</span>
                  </span>
                  <span className="font-mono text-[9px] text-[#c4c7d1]">
                    Il y a 2 min
                  </span>
                </div>

                {/* Corps de la carte notification */}
                <div className="flex items-center justify-between mt-2.5 mb-1.5">
                  <div className="min-w-0 pr-2">
                    <b className="text-sm font-extrabold text-white block tracking-tight truncate">
                      Studio Baobab
                    </b>
                    <span className="text-[10px] font-mono font-bold text-[#ffdc45] block truncate">
                      INV-2025-008 · 295 000 FCFA
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-[#111522] bg-[#ffdc45] px-2.5 py-1 rounded-full shadow-sm shrink-0">
                    {notificationClicked ? "WhatsApp ✓" : "Envoyé ✓"}
                  </span>
                </div>

                {/* Footer de la carte notification */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-[#c4c7d1]">
                  <span className="truncate pr-1">
                    {notificationClicked ? "✓ PDF A4 partagé au client" : "Facture reçue par le client"}
                  </span>
                  <span className="text-[#ffdc45] font-bold text-xs shrink-0">💬</span>
                </div>
              </div>

              {/* Main Paper-Style Invoice Dashboard Card */}
              <div className="bg-[#f2f0e8] text-[#111522] rounded-2xl p-4 sm:p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] border border-white/40 lg:-rotate-2 transition-transform duration-500 hover:rotate-0">
                {/* Mockup Topbar */}
                <div className="flex items-center justify-between text-[11px] font-bold pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#ffdc45] text-[#111522] grid place-items-center text-[10px] font-extrabold">
                      A
                    </span>
                    <span>AMOMD FACTURE</span>
                    <small className="hidden sm:inline font-medium text-[#697080]">· Espace entreprise</small>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[10px] font-semibold text-[#697080]">
                    <span className="text-[#111522] underline decoration-[#ffdc45] decoration-2 underline-offset-4">
                      Tableau de bord
                    </span>
                    <span>Clients</span>
                    <span>Factures</span>
                  </div>
                </div>

                {/* Mockup Grid Content */}
                <div className="grid grid-cols-1 sm:grid-cols-[1.12fr_0.88fr] gap-4 pt-2">
                  {/* Left Invoice Summary */}
                  <div className="bg-white/75 rounded-xl p-3.5 sm:p-4 border border-[#e4e2d9]">
                    <div className="text-[9px] uppercase tracking-[1px] text-[#697080] font-bold">
                      Nouvelle facture
                    </div>
                    <div className="font-serif font-medium text-lg sm:text-[21px] text-[#111522] mt-1 mb-3">
                      Facture n° 2025-008
                    </div>
                    <div className="space-y-2 text-[11px] text-[#5f6571]">
                      <div className="flex justify-between">
                        <span>Client</span>
                        <strong className="text-[#111522]">Studio Baobab</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Identité visuelle · 2 jours</span>
                        <strong className="font-mono text-[#111522]">250 000</strong>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span>Sous-total HT</span>
                        <strong className="font-mono text-[#111522]">250 000 FCFA</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA (taux applicable)</span>
                        <strong className="font-mono text-[#111522]">45 000 FCFA</strong>
                      </div>
                    </div>
                    <div className="bg-[#141a2b] text-white p-3.5 rounded-xl mt-4">
                      <small className="text-[10px] text-[#b9bfce] block">Total à payer</small>
                      <strong className="font-serif font-medium text-xl sm:text-2xl text-[#ffdc45] mt-0.5 block">
                        295 000 FCFA
                      </strong>
                    </div>
                  </div>

                  {/* Right Mini Cards & Interactive Bar Chart */}
                  <div className="flex flex-col gap-3">
                    <div className="bg-white rounded-xl p-3.5 border border-[#e7e5df] shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[9px] uppercase tracking-[1px] text-[#697080] font-bold">
                          Dernière facture
                        </div>
                        <span className="bg-[#d9f0df] text-[#285b35] rounded-full px-2 py-0.5 text-[9px] font-bold">
                          PAYÉE
                        </span>
                      </div>
                      <strong className="text-xs font-bold text-[#111522] block mt-1.5 mb-0.5 font-mono">
                        INV-2025-007
                      </strong>
                      <small className="text-[10px] text-[#697080]">Entreprise Kër · 180 000 FCFA</small>
                    </div>

                    <div className="bg-white rounded-xl p-3.5 border border-[#e7e5df] shadow-sm flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[9px] uppercase tracking-[1px] text-[#697080] font-bold">
                          Chiffre encaissé
                        </div>
                        <div className="font-serif font-medium text-lg text-[#111522] mt-1">
                          {chartBars[activeChartBar]?.amount || "1 245 000"}{" "}
                          <span className="text-[11px] font-sans text-[#697080]">FCFA</span>
                        </div>
                      </div>

                      <div className="h-[68px] flex items-end gap-1.5 mt-3 pt-2">
                        {chartBars.map((bar, idx) => (
                          <button
                            key={bar.label}
                            type="button"
                            onMouseEnter={() => setActiveChartBar(idx)}
                            onClick={() => setActiveChartBar(idx)}
                            aria-label={`${bar.label}: ${bar.amount} FCFA`}
                            className={`flex-1 rounded-t-md transition-all duration-200 cursor-pointer ${idx === activeChartBar
                                ? "bg-[#111522] scale-y-105 shadow-sm"
                                : idx % 2 === 1
                                  ? "bg-[#ffdc45] hover:opacity-90"
                                  : "bg-[#c6d1ff] hover:opacity-90"
                              }`}
                            style={{ height: bar.height }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stamp (Interactive on click) */}
              <div
                onClick={() => {
                  setStampClicked(true);
                  setTimeout(() => setStampClicked(false), 1200);
                }}
                className={`animate-float-stamp inline-block sm:absolute sm:bottom-1 sm:left-0 mt-4 sm:mt-0 z-20 bg-[#ffdc45] text-[#111522] font-serif italic text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-[0_12px_28px_rgba(0,0,0,0.3)] border border-[#ffe879] cursor-pointer transition-all duration-200 active:scale-95 select-none ${stampClicked ? "rotate-6 scale-110 shadow-2xl ring-4 ring-[#ffdc45]/50" : "hover:scale-105"
                  }`}
                title="Tampon officiel certifié AMOMD FACTURE (Cliquer pour animer)"
              >
                {stampClicked ? "Tampon apposé avec succès ! 🔏" : "Une facture prête en 2 minutes ✳"}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Bar */}
        <div className="mt-12 sm:mt-16 border-t border-white/10 pt-5">
          <div className="max-w-[1160px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] uppercase tracking-[1px] text-[#858b9a]">
            <span>Conçu pour les entrepreneurs d’ici</span>
            <span>FCFA · TVA · Suivi en temps réel</span>
          </div>
        </div>
      </header>

      <main>
        {/* ==================== PROBLEM SECTION ==================== */}
        <section className="py-20 sm:py-28 bg-[#f8f7f3]">
          <div className="max-w-[1160px] mx-auto px-4 sm:px-6">
            <div className="lp-reveal text-center max-w-[620px] mx-auto mb-12 sm:mb-14">
              <div className="inline-block bg-[#ffe36a] text-[#332900] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.9px]">
                On connaît la galère
              </div>
              <h2 className="font-serif font-medium text-[32px] sm:text-[44px] lg:text-[50px] leading-[1.1] tracking-[-0.03em] text-[#171522] mt-4 mb-4">
                Ton énergie mérite
                <br />
                mieux que la paperasse.
              </h2>
              <p className="text-[#4f5664] text-sm leading-[1.75] max-w-[500px] mx-auto">
                Quand la facturation devient un casse-tête, c’est ton activité qui ralentit. On a
                imaginé AMOMD FACTURE pour que tu puisses te concentrer sur l’essentiel.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              <article className="lp-reveal bg-white rounded-2xl p-6 sm:p-7 shadow-[0_12px_32px_rgba(23,21,34,0.04)] hover:shadow-[0_18px_38px_rgba(23,21,34,0.09)] hover:-translate-y-1 transition-all duration-300 border border-[#e8e7e2]/70">
                <span className="font-serif italic text-[15px] text-[#a18400] block">
                  01 / Chaque facture
                </span>
                <h3 className="text-[17px] font-bold text-[#111522] mt-6 mb-2.5 tracking-tight">
                  Un rendu qui ne fait pas pro
                </h3>
                <p className="text-[13px] leading-[1.75] text-[#697080]">
                  Des modèles bricolés qui ne reflètent pas la qualité de ton travail ni l’image de
                  ton entreprise.
                </p>
              </article>

              <article
                className="lp-reveal bg-white rounded-2xl p-6 sm:p-7 shadow-[0_12px_32px_rgba(23,21,34,0.04)] hover:shadow-[0_18px_38px_rgba(23,21,34,0.09)] hover:-translate-y-1 transition-all duration-300 border border-[#e8e7e2]/70"
                style={{ transitionDelay: "90ms" }}
              >
                <span className="font-serif italic text-[15px] text-[#a18400] block">
                  02 / Chaque calcul
                </span>
                <h3 className="text-[17px] font-bold text-[#111522] mt-6 mb-2.5 tracking-tight">
                  La TVA faite à la main
                </h3>
                <p className="text-[13px] leading-[1.75] text-[#697080]">
                  Calculatrice, vérifications, erreurs… tes totaux devraient tomber juste dès le
                  premier coup.
                </p>
              </article>

              <article
                className="lp-reveal bg-white rounded-2xl p-6 sm:p-7 shadow-[0_12px_32px_rgba(23,21,34,0.04)] hover:shadow-[0_18px_38px_rgba(23,21,34,0.09)] hover:-translate-y-1 transition-all duration-300 border border-[#e8e7e2]/70"
                style={{ transitionDelay: "180ms" }}
              >
                <span className="font-serif italic text-[15px] text-[#a18400] block">
                  03 / Chaque relance
                </span>
                <h3 className="text-[17px] font-bold text-[#111522] mt-6 mb-2.5 tracking-tight">
                  Des paiements dans le flou
                </h3>
                <p className="text-[13px] leading-[1.75] text-[#697080]">
                  Entre les messages et les fichiers éparpillés, difficile de savoir qui a payé et qui
                  relancer.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ==================== FEATURES SECTION WITH CUSTOM SVG ICONS ==================== */}
        <section id="fonctionnalites" className="py-20 sm:py-28 bg-[#edece6] scroll-mt-20 sm:scroll-mt-24">
          <div className="max-w-[1160px] mx-auto px-4 sm:px-6">
            <div className="lp-reveal text-center max-w-[620px] mx-auto mb-12 sm:mb-14">
              <div className="inline-block bg-[#ffe36a] text-[#332900] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.9px]">
                Tout ce qu’il te faut
              </div>
              <h2 className="font-serif font-medium text-[32px] sm:text-[44px] lg:text-[50px] leading-[1.1] tracking-[-0.03em] text-[#171522] mt-4 mb-3">
                Simple à faire.
                <br />
                Facile à suivre.
              </h2>
              <p className="text-[#4f5664] text-sm leading-[1.75] max-w-[440px] mx-auto">
                Les bons outils, sans menu compliqué ni jargon comptable. Tu vas droit au but.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Feature 1 */}
              <article className="lp-reveal group bg-[#f8f7f3] rounded-2xl p-6 shadow-[0_12px_32px_rgba(23,21,34,0.04)] hover:shadow-[0_18px_38px_rgba(23,21,34,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-[#ffedaa] text-[#3b3210] grid place-items-center animate-float-icon group-hover:scale-110 transition-transform shadow-sm">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M8 13h8" />
                    <path d="M8 17h5" />
                    <circle cx="9.5" cy="9" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <h3 className="text-[15px] font-bold text-[#111522] mt-6 mb-2 leading-snug">
                  Factures pro en 2 clics
                </h3>
                <p className="text-xs leading-[1.7] text-[#697080]">
                  Un modèle élégant, tes infos, tes lignes : ta facture est prête à partir.
                </p>
              </article>

              {/* Feature 2 */}
              <article
                className="lp-reveal group bg-[#f8f7f3] rounded-2xl p-6 shadow-[0_12px_32px_rgba(23,21,34,0.04)] hover:shadow-[0_18px_38px_rgba(23,21,34,0.1)] hover:-translate-y-1.5 transition-all duration-300"
                style={{ transitionDelay: "80ms" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl bg-[#dce6ff] text-[#273c75] grid place-items-center animate-float-icon group-hover:scale-110 transition-transform shadow-sm"
                  style={{ animationDelay: "0.4s" }}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="8" y1="6" x2="16" y2="6" />
                    <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h4M16 18h.01" strokeWidth="2.4" />
                  </svg>
                </div>
                <h3 className="text-[15px] font-bold text-[#111522] mt-6 mb-2 leading-snug">
                  TVA calculée toute seule
                </h3>
                <p className="text-xs leading-[1.7] text-[#697080]">
                  Le taux applicable se renseigne facilement et les montants se calculent automatiquement.
                </p>
              </article>

              {/* Feature 3 */}
              <article
                className="lp-reveal group bg-[#f8f7f3] rounded-2xl p-6 shadow-[0_12px_32px_rgba(23,21,34,0.04)] hover:shadow-[0_18px_38px_rgba(23,21,34,0.1)] hover:-translate-y-1.5 transition-all duration-300"
                style={{ transitionDelay: "160ms" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl bg-[#d7f0dc] text-[#285b35] grid place-items-center animate-float-icon group-hover:scale-110 transition-transform shadow-sm"
                  style={{ animationDelay: "0.8s" }}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 17l6-6 4 4 8-8" />
                    <path d="M17 7h4v4" />
                    <circle cx="12" cy="18" r="0.5" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="text-[15px] font-bold text-[#111522] mt-6 mb-2 leading-snug">
                  Paiements en temps réel
                </h3>
                <p className="text-xs leading-[1.7] text-[#697080]">
                  Retrouve les factures payées, en attente et à relancer en un regard.
                </p>
              </article>

              {/* Feature 4 */}
              <article
                className="lp-reveal group bg-[#f8f7f3] rounded-2xl p-6 shadow-[0_12px_32px_rgba(23,21,34,0.04)] hover:shadow-[0_18px_38px_rgba(23,21,34,0.1)] hover:-translate-y-1.5 transition-all duration-300"
                style={{ transitionDelay: "240ms" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl bg-[#f0d9ed] text-[#704266] grid place-items-center animate-float-icon group-hover:scale-110 transition-transform shadow-sm"
                  style={{ animationDelay: "1.2s" }}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="text-[15px] font-bold text-[#111522] mt-6 mb-2 leading-snug">
                  Tes clients, bien rangés
                </h3>
                <p className="text-xs leading-[1.7] text-[#697080]">
                  Coordonnées et historique réunis pour facturer tes clients fidèles plus vite.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ==================== 3 STEPS SECTION ==================== */}
        <section id="comment" className="py-20 sm:py-28 bg-[#f8f7f3] scroll-mt-20 sm:scroll-mt-24">
          <div className="max-w-[1160px] mx-auto px-4 sm:px-6">
            <div className="lp-reveal text-center max-w-[620px] mx-auto mb-12 sm:mb-14">
              <div className="inline-block bg-[#ffe36a] text-[#332900] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.9px]">
                Trois petites étapes
              </div>
              <h2 className="font-serif font-medium text-[32px] sm:text-[44px] lg:text-[50px] leading-[1.1] tracking-[-0.03em] text-[#171522] mt-4 mb-3">
                Et c’est parti.
              </h2>
              <p className="text-[#4f5664] text-sm leading-[1.75] max-w-[460px] mx-auto">
                Pas de formation à prévoir. Tu peux envoyer ta première facture dès aujourd’hui.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <article className="lp-reveal flex md:block items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-[#ffdc45] text-[#111522] font-serif italic text-base font-semibold grid place-items-center shrink-0 md:mb-5 shadow-[0_6px_18px_rgba(255,220,69,0.35)]">
                  01
                </div>
                <div>
                  <h3 className="font-serif font-medium text-[22px] text-[#111522] mb-2">
                    Inscris-toi
                  </h3>
                  <p className="text-[13px] leading-[1.7] text-[#697080] max-w-[290px]">
                    Crée ton espace en quelques instants et ajoute les informations de ton activité.
                  </p>
                </div>
              </article>

              <article
                className="lp-reveal flex md:block items-start gap-4"
                style={{ transitionDelay: "90ms" }}
              >
                <div className="w-11 h-11 rounded-full bg-[#ffdc45] text-[#111522] font-serif italic text-base font-semibold grid place-items-center shrink-0 md:mb-5 shadow-[0_6px_18px_rgba(255,220,69,0.35)]">
                  02
                </div>
                <div>
                  <h3 className="font-serif font-medium text-[22px] text-[#111522] mb-2">
                    Fais ta facture
                  </h3>
                  <p className="text-[13px] leading-[1.7] text-[#697080] max-w-[290px]">
                    Choisis ton client, renseigne la prestation. Le total et la TVA se calculent.
                  </p>
                </div>
              </article>

              <article
                className="lp-reveal flex md:block items-start gap-4"
                style={{ transitionDelay: "180ms" }}
              >
                <div className="w-11 h-11 rounded-full bg-[#ffdc45] text-[#111522] font-serif italic text-base font-semibold grid place-items-center shrink-0 md:mb-5 shadow-[0_6px_18px_rgba(255,220,69,0.35)]">
                  03
                </div>
                <div>
                  <h3 className="font-serif font-medium text-[22px] text-[#111522] mb-2">
                    Envoie et suis
                  </h3>
                  <p className="text-[13px] leading-[1.7] text-[#697080] max-w-[290px]">
                    Partage ta facture, puis suis son statut et tes paiements depuis ton tableau de
                    bord.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ==================== TESTIMONIALS (BLEU NUIT) ==================== */}
        <section className="py-20 sm:py-28 bg-[#111522] text-white relative overflow-hidden">
          <div
            aria-hidden="true"
            className="font-serif text-[320px] sm:text-[420px] text-white/[0.03] leading-none select-none pointer-events-none absolute right-[4%] -top-8"
          >
            “
          </div>

          <div className="max-w-[1160px] mx-auto px-4 sm:px-6 relative z-10">
            <div className="lp-reveal text-center max-w-[620px] mx-auto mb-12 sm:mb-14">
              <div className="inline-block bg-[#ffe36a] text-[#332900] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.9px]">
                Ils s’organisent mieux
              </div>
              <h2 className="font-serif font-medium text-[32px] sm:text-[44px] lg:text-[50px] leading-[1.1] tracking-[-0.03em] text-white mt-4 mb-3">
                Du temps retrouvé,
                <br />
                des clients rassurés.
              </h2>
              <p className="text-[#aeb3c0] text-sm leading-[1.75] max-w-[460px] mx-auto">
                Quelques mots de celles et ceux qui ont adopté une facturation plus simple.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              <article className="lp-reveal bg-[#191f30] border border-white/[0.06] rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="text-[#ffdc45] tracking-[3px] text-xs mb-4">★★★★★</div>
                  <blockquote className="font-serif italic text-[17px] leading-[1.55] text-[#f3f1e9] mb-6">
                    « Mes factures sont enfin à la hauteur de mon travail. Je les prépare entre deux
                    rendez-vous, sans prise de tête. »
                  </blockquote>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#d6b397] text-[#161a25] font-bold text-xs grid place-items-center">
                    AD
                  </span>
                  <div>
                    <b className="text-xs font-bold block text-white">Aminata Diop</b>
                    <small className="text-[11px] text-[#a2a8b5]">Consultante · Dakar, Sénégal</small>
                  </div>
                </div>
              </article>

              <article
                className="lp-reveal bg-[#191f30] border border-white/[0.06] rounded-2xl p-6 flex flex-col justify-between"
                style={{ transitionDelay: "90ms" }}
              >
                <div>
                  <div className="text-[#ffdc45] tracking-[3px] text-xs mb-4">★★★★★</div>
                  <blockquote className="font-serif italic text-[17px] leading-[1.55] text-[#f3f1e9] mb-6">
                    « Je sais en un instant ce qui est payé et ce qui ne l’est pas. Les fins de mois
                    sont beaucoup plus sereines. »
                  </blockquote>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#c2d8c3] text-[#161a25] font-bold text-xs grid place-items-center">
                    YK
                  </span>
                  <div>
                    <b className="text-xs font-bold block text-white">Yao Kouassi</b>
                    <small className="text-[11px] text-[#a2a8b5]">
                      Studio créatif · Abidjan, Côte d’Ivoire
                    </small>
                  </div>
                </div>
              </article>

              <article
                className="lp-reveal bg-[#191f30] border border-white/[0.06] rounded-2xl p-6 flex flex-col justify-between"
                style={{ transitionDelay: "180ms" }}
              >
                <div>
                  <div className="text-[#ffdc45] tracking-[3px] text-xs mb-4">★★★★★</div>
                  <blockquote className="font-serif italic text-[17px] leading-[1.55] text-[#f3f1e9] mb-6">
                    « Le calcul de la TVA est fait automatiquement. Je gagne du temps et je peux me
                    concentrer sur mes clients. »
                  </blockquote>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#d7c0e0] text-[#161a25] font-bold text-xs grid place-items-center">
                    MN
                  </span>
                  <div>
                    <b className="text-xs font-bold block text-white">Marcelle Nguema</b>
                    <small className="text-[11px] text-[#a2a8b5]">
                      Agence conseil · Douala, Cameroun
                    </small>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ==================== PRICING SECTION ==================== */}
        <section id="tarifs" className="py-20 sm:py-28 bg-[#f1f0eb] scroll-mt-20 sm:scroll-mt-24">
          <div className="max-w-[1160px] mx-auto px-4 sm:px-6">
            <div className="lp-reveal text-center max-w-[620px] mx-auto mb-12 sm:mb-14">
              <div className="inline-block bg-[#ffe36a] text-[#332900] px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.9px]">
                Des tarifs clairs et sans surprise
              </div>
              <h2 className="font-serif font-medium text-[32px] sm:text-[44px] lg:text-[50px] leading-[1.1] tracking-[-0.03em] text-[#171522] mt-4 mb-3">
                Grandis à ton rythme.
              </h2>
              <p className="text-[#4f5664] text-sm leading-[1.75] max-w-[460px] mx-auto">
                Création de compte 100% gratuite. Choisis la formule qui correspond à ton volume de facturation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[1080px] mx-auto items-stretch">
              {/* Plan 1 : Starter 0 FCFA */}
              <article
                className="lp-reveal bg-[#f8f7f3] text-[#111522] rounded-2xl p-6 sm:p-7 shadow-[0_12px_32px_rgba(23,21,34,0.06)] border border-[#e4e2d9] flex flex-col justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-[#747a87] uppercase tracking-wider">Starter</div>
                  <div className="font-serif font-medium text-[34px] sm:text-[38px] tracking-tight mt-3 mb-1">
                    0 <small className="font-sans text-xs font-bold text-[#838896]">FCFA / mois</small>
                  </div>
                  <p className="text-xs text-[#697080] mb-5">
                    Pour tester et démarrer vos premières factures.
                  </p>
                  <div className="h-px bg-[#e6e4dd] mb-5" />
                  <ul className="space-y-3 text-xs text-[#505766] mb-7">
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#285b35] font-bold">✓</span>
                      5 factures / mois
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#285b35] font-bold">✓</span>
                      1 utilisateur
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#285b35] font-bold">✓</span>
                      Devis &amp; Proformas OHADA
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#285b35] font-bold">✓</span>
                      Calcul automatique de la TVA
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#285b35] font-bold">✓</span>
                      Support par email
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onGetStarted}
                  className="w-full py-3.5 rounded-full bg-[#111522] hover:bg-[#1b253d] text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  Commencer gratuitement ↗
                </button>
              </article>

              {/* Plan 2 : Recommandé 5 000 FCFA */}
              <article className="lp-reveal relative bg-[#111522] text-white rounded-2xl p-6 sm:p-7 shadow-[0_22px_55px_rgba(17,21,34,0.22)] md:-translate-y-2 flex flex-col justify-between border-2 border-[#ffdc45]/60">
                <div>
                  <span className="absolute right-4 top-4 bg-[#ffdc45] text-[#211d0d] text-[10px] font-extrabold tracking-[0.7px] uppercase px-3 py-1 rounded-full shadow-sm">
                    ✦ Recommandé
                  </span>
                  <div className="text-sm font-bold text-[#ffdc45] uppercase tracking-wider">Illimité</div>
                  <div className="font-serif font-medium text-[34px] sm:text-[38px] tracking-tight mt-3 mb-1">
                    5 000 <small className="font-sans text-xs font-medium text-[#9aa0b0]">FCFA / mois</small>
                  </div>
                  <p className="text-xs text-[#b5bac7] mb-5">
                    Tout ce qu’il faut pour travailler sereinement.
                  </p>
                  <div className="h-px bg-white/15 mb-5" />
                  <ul className="space-y-3 text-xs text-[#e3e5eb] mb-7">
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#ffdc45] font-bold">✓</span>
                      Factures &amp; devis illimités
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#ffdc45] font-bold">✓</span>
                      3 utilisateurs inclus
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#ffdc45] font-bold">✓</span>
                      Relances clients automatiques
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#ffdc45] font-bold">✓</span>
                      Logo &amp; vrai tampon officiel
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#ffdc45] font-bold">✓</span>
                      Support WhatsApp direct 7j/7
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onGetStarted}
                  className="cta-hero-btn w-full py-3.5 rounded-full bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] font-black text-xs shadow-[0_8px_22px_rgba(255,220,69,0.28)] transition active:scale-95 cursor-pointer"
                >
                  Choisir l’offre Illimitée ↗
                </button>
              </article>

              {/* Plan 3 : Business 15 000 FCFA */}
              <article
                className="lp-reveal bg-[#f8f7f3] text-[#111522] rounded-2xl p-6 sm:p-7 shadow-[0_12px_32px_rgba(23,21,34,0.06)] border border-[#e4e2d9] flex flex-col justify-between"
                style={{ transitionDelay: "90ms" }}
              >
                <div>
                  <div className="text-sm font-bold text-[#747a87] uppercase tracking-wider">Business</div>
                  <div className="font-serif font-medium text-[34px] sm:text-[38px] tracking-tight mt-3 mb-1">
                    15 000 <small className="font-sans text-xs font-medium text-[#838896]">FCFA / mois</small>
                  </div>
                  <p className="text-xs text-[#697080] mb-5">
                    Pour les équipes et organisations en croissance.
                  </p>
                  <div className="h-px bg-[#e6e4dd] mb-5" />
                  <ul className="space-y-3 text-xs text-[#505766] mb-7">
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#285b35] font-bold">✓</span>
                      Tout le plan Illimité
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#285b35] font-bold">✓</span>
                      Multi-comptes &amp; équipe complète
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#285b35] font-bold">✓</span>
                      Exports comptables SYSCOHADA
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#285b35] font-bold">✓</span>
                      Gestion centralisée multi-profils
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-[#285b35] font-bold">✓</span>
                      Support VIP prioritaire
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onGetStarted}
                  className="w-full py-3.5 rounded-full bg-[#e9e7df] hover:bg-[#111522] hover:text-white text-[#111522] font-black text-xs transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  Choisir Business ↗
                </button>
              </article>
            </div>

            {/* Note d'éclaircissement sur les tarifs */}
            <div className="text-center mt-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e4e2d9] text-xs font-semibold text-[#374151] shadow-xs">
                <span>💡</span>
                <span>Création de compte 100% gratuite. Facturation accessible dès la souscription à votre formule.</span>
              </span>
            </div>
          </div>
        </section>

        {/* ==================== FINAL CTA BANNER (JAUNE OR) ==================== */}
        <section
          className="py-16 sm:py-20 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(120deg, #ffe76b, #ffd943 58%, #f6ca2d)",
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none select-none absolute left-[6%] top-2 text-[96px] sm:text-[120px] text-[#111522]/[0.06]"
          >
            ✳
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none select-none absolute right-[8%] -bottom-6 text-[96px] sm:text-[120px] text-[#111522]/[0.06]"
          >
            ✳
          </span>

          <div className="max-w-[1160px] mx-auto px-4 sm:px-6 relative z-10 lp-reveal">
            <div className="inline-block bg-[#fff0a6] text-[#393522] px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.9px] mb-4">
              La suite s’écrit maintenant
            </div>
            <h2 className="font-serif font-medium text-[32px] sm:text-[46px] lg:text-[52px] leading-[1.1] tracking-[-0.03em] text-[#111522] max-w-[680px] mx-auto mb-7">
              Rejoins les entrepreneurs qui facturent comme des pros.
            </h2>
            <button
              type="button"
              onClick={onGetStarted}
              className="px-7 py-4 rounded-full bg-[#111522] hover:bg-[#1b253d] text-white font-bold text-sm shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all inline-flex items-center gap-2.5 cursor-pointer"
            >
              <span>Créer mon compte gratuitement</span>
              <span className="text-[#ffdc45]">↗</span>
            </button>
          </div>
        </section>
      </main>

      {/* ==================== FOOTER END (ÉPURÉ, LUXURY & DIRECT) ==================== */}
      <footer className="bg-[#0c111d] text-white border-t border-white/10 pt-14 pb-10">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6">
          {/* 1. Pre-Footer Direct Assistance Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#111522] border border-white/10 shadow-xl mb-12 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffdc45]/15 text-[#ffdc45] text-[11px] font-extrabold uppercase tracking-wider border border-[#ffdc45]/30">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
                <span>Assistance Sahel &amp; UEMOA 7j/7</span>
              </div>
              <h3 className="font-serif font-medium text-lg sm:text-xl text-white tracking-tight">
                Une question ou besoin d&apos;aide pour démarrer vos factures ?
              </h3>
              <p className="text-xs sm:text-sm text-[#a6acba]">
                Notre équipe est à votre écoute directe à Niamey. Échangez instantanément sur WhatsApp ou appelez notre support dédié.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href="https://wa.me/22777063837?text=Bonjour%20AMOMD%20FACTURE,%20je%20souhaite%20des%20informations%20ou%20une%20assistance."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#25D366]/25 transition active:scale-95 cursor-pointer"
              >
                <span className="text-base">💬</span>
                <span>Discuter sur WhatsApp</span>
              </a>
              <a
                href="tel:+22777063837"
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <span>📞</span>
                <span>+227 77 06 38 37</span>
              </a>
            </div>
          </div>

          {/* 2. Main Streamlined Footer : 1 Phrase Simple & Liens Essentiels */}
          <div className="text-center space-y-6 pb-10 border-b border-white/10">
            {/* Logo Marque */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => scrollToSection("accueil")}
                className="inline-flex items-center gap-2.5 text-white font-bold text-xl tracking-tight group focus:outline-none cursor-pointer"
              >
                <span className="w-8 h-8 rounded-[9px] bg-[#ffdc45] text-[#111522] grid place-items-center font-extrabold text-sm -rotate-6 shadow-[0_4px_15px_rgba(255,220,69,0.45)] group-hover:rotate-0 transition-transform">
                  A
                </span>
                <span className="tracking-[-0.03em] font-serif">AMOMD FACTURE</span>
              </button>
            </div>

            {/* LA PHRASE SIMPLE QUI EXPLIQUE TOUT (Informations, Solutions, Paiements) */}
            <p className="text-sm sm:text-[15px] text-[#c4c7d1] max-w-2xl mx-auto leading-relaxed">
              La solution tout-en-un de facturation commerciale conforme (SYSCOHADA &amp; TVA), devis proforma et encaissements sécurisés (Mobile Money &amp; Cartes bancaires) conçue pour les entrepreneurs et entreprises de l&apos;espace Sahel &amp; UEMOA.
            </p>

            {/* Liens de Navigation Rapides (Directs vers les sections de la page & l'authentification) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs sm:text-sm font-semibold text-[#a6acba] pt-2">
              <button
                type="button"
                onClick={() => scrollToSection("fonctionnalites")}
                className="px-3 py-1.5 rounded-full hover:bg-white/5 hover:text-[#ffdc45] transition-all cursor-pointer"
              >
                Fonctionnalités
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("comment")}
                className="px-3 py-1.5 rounded-full hover:bg-white/5 hover:text-[#ffdc45] transition-all cursor-pointer"
              >
                Comment ça marche
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("tarifs")}
                className="px-3 py-1.5 rounded-full hover:bg-white/5 hover:text-[#ffdc45] transition-all cursor-pointer"
              >
                Tarifs
              </button>
              <button
                type="button"
                onClick={onGetStarted}
                className="px-3.5 py-1.5 rounded-full bg-[#ffdc45] text-[#111522] hover:bg-[#ffe879] transition-all cursor-pointer font-bold flex items-center gap-1 shadow-sm active:scale-95"
              >
                <span>Créer un compte</span>
                <span>↗</span>
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="px-3.5 py-1.5 rounded-full border border-white/20 hover:border-white text-white hover:bg-white/10 transition-all cursor-pointer font-semibold active:scale-95"
              >
                Se connecter
              </button>
            </div>

            {/* Coordonnées & Support en ligne (Pills propres sans wrap disgracieux) */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-[#9096a5] pt-2">
              <a
                href="tel:+22777063837"
                className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#ffdc45]/60 hover:text-white transition-all flex items-center gap-1.5"
              >
                <span>📱</span>
                <span className="font-mono text-white/90 font-bold">+227 77 06 38 37</span>
              </a>
              <a
                href="mailto:moussaousmaneaicha@gmail.com"
                className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#ffdc45]/60 hover:text-white transition-all flex items-center gap-1.5"
              >
                <span>✉️</span>
                <span className="text-white/90">moussaousmaneaicha@gmail.com</span>
              </a>
              <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 text-white/80">
                <span>📍</span>
                <span>Niamey, Niger</span>
              </span>
            </div>
          </div>

          {/* 3. Bottom Legal & Copyright Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-[11px] text-[#808392]">
            <div className="flex flex-wrap items-center gap-3">
              <span>© 2025–2026 AMOMD FACTURE. Tous droits réservés.</span>
              <span className="hidden sm:inline text-white/20">|</span>
              <span className="text-[#a6acba]">Plateforme certifiée conforme SYSCOHADA &amp; DGI</span>
            </div>

            <div className="flex items-center gap-4 text-[#a6acba]">
              <span>Fait avec fierté et passion au Sahel 🌍</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
