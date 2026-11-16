"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import GlobeLanguageSelector from "./GlobeLanguageSelector";

interface AuthPageProps {
  onAuthenticated?: () => void;
  initialMode?: "login" | "signup";
  onBack?: () => void;
}

export default function AuthPage({
  onAuthenticated,
  initialMode = "login",
  onBack,
}: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);

  const translateAuthError = (raw: string): string => {
    const lower = raw.toLowerCase();
    if (lower.includes("invalid login credentials")) {
      return "Email ou mot de passe incorrect. Vérifiez vos identifiants ou créez un compte.";
    }
    if (lower.includes("email not confirmed")) {
      return "Votre adresse email n'est pas encore confirmée. Ouvrez l'email envoyé par Supabase et cliquez sur le lien d'activation.";
    }
    if (lower.includes("user already registered")) {
      return "Un compte existe déjà avec cet email. Cliquez sur « Connexion ».";
    }
    if (lower.includes("password should be at least")) {
      return "Le mot de passe doit contenir au moins 6 caractères.";
    }
    if (lower.includes("rate limit")) {
      return "Trop de demandes d'envoi d'email en peu de temps. Patientez quelques minutes ou connectez-vous avec un compte existant.";
    }
    return raw;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        });
        if (error) {
          setErrorMsg(translateAuthError(error.message));
        } else {
          setInfoMsg(`Un lien de réinitialisation a été envoyé à ${cleanEmail}.`);
        }
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        if (password.length < 6) {
          setErrorMsg("Le mot de passe doit contenir au moins 6 caractères.");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg("Les mots de passe ne correspondent pas. Veuillez confirmer à l'identique.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? window.location.origin : undefined,
            data: {
              full_name: fullName.trim() || cleanEmail.split("@")[0],
              company_name: companyName.trim() || "Mon Entreprise",
            },
          },
        });

        if (error) {
          setErrorMsg(translateAuthError(error.message));
          setLoading(false);
          return;
        }

        if (data.session) {
          onAuthenticated?.();
          return;
        }

        setPendingConfirmEmail(cleanEmail);
        setInfoMsg(
          `Compte créé avec succès ! Un lien d'activation a été envoyé à ${cleanEmail}. Cliquez sur ce lien dans votre boîte mail puis connectez-vous.`
        );
        setMode("login");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setErrorMsg(translateAuthError(error.message));
        setLoading(false);
        return;
      }

      if (data.session) {
        onAuthenticated?.();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!pendingConfirmEmail) return;
    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingConfirmEmail,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setLoading(false);
    if (error) {
      setErrorMsg(translateAuthError(error.message));
    } else {
      setInfoMsg(`Email de confirmation renvoyé à ${pendingConfirmEmail}.`);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden font-sans bg-[#f6f7fb] text-slate-800">
      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all active:scale-95 cursor-pointer"
            title="Retour à l'accueil"
          >
            <span>←</span>
            <span>Retour à l&apos;accueil</span>
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <GlobeLanguageSelector />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:py-12">
        <div className="w-full max-w-[400px] bg-white rounded-[28px] sm:rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(15,23,42,0.06)] p-6 sm:p-9 space-y-5 sm:space-y-6">
          
          {/* Header: Official AMOMD Facture Logo & Subtitle */}
          <div className="text-center space-y-2.5">
            <div className="flex justify-center">
              <img
                src="/logo-amomd.png"
                alt="AMOMD Facture — Facturez, Optimisez, Rentabilisez"
                className="h-16 sm:h-20 w-auto max-w-full object-contain"
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Gérez vos factures en toute simplicité.
            </p>
          </div>

          {/* Segmented Switch Tabs [Connexion | Inscription] */}
          {mode !== "forgot" && (
            <div className="p-1 bg-[#f1f3f7] rounded-2xl flex items-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 flex-1 text-center cursor-pointer ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 flex-1 text-center cursor-pointer ${
                  mode === "signup"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Inscription
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Info / Success Message */}
          {infoMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 space-y-2 leading-relaxed">
              <p>{infoMsg}</p>
              {pendingConfirmEmail && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={loading}
                  className="underline font-bold text-emerald-950 hover:opacity-80 cursor-pointer"
                >
                  Renvoyer l&apos;email de confirmation
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Aichatou Moussa"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Nom de votre entreprise
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Sahel Tech SARL"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Mot de passe
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrorMsg(null);
                        setInfoMsg(null);
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 pr-16 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 px-1 py-1 cursor-pointer"
                  >
                    {showPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>
            )}

            {/* Rounded Pill CTA button matching screenshot */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-full bg-[#111522] hover:bg-black disabled:opacity-60 text-white text-sm font-bold shadow-md shadow-slate-900/10 transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span>Chargement...</span>
              ) : mode === "login" ? (
                <span>Se connecter</span>
              ) : mode === "signup" ? (
                <span>S&apos;inscrire</span>
              ) : (
                <span>Envoyer le lien de réinitialisation</span>
              )}
            </button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer text-center"
              >
                ← Retour à la connexion
              </button>
            )}
          </form>

          {/* Mobile-first bottom return link */}
          {onBack && (
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1"
              >
                <span>←</span>
                <span>Retourner sur la page d&apos;accueil</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Discreet footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-400">
        AMOMD facture · Plateforme de facturation professionnelle
      </footer>
    </div>
  );
}
