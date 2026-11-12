"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import GlobeLanguageSelector from "./GlobeLanguageSelector";

interface AuthPageProps {
  onAuthenticated?: () => void;
}

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
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
      return "Un compte existe déjà avec cet email. Cliquez sur « Se connecter ».";
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
    <div className="min-h-screen w-full bg-[#F8FAFC] relative flex flex-col justify-between overflow-x-hidden font-sans">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[360px] rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[320px] rounded-full bg-sky-100/50 blur-3xl" />
      </div>

      <header className="relative z-10 w-full max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/15">
            <svg
              className="w-5 h-5 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15l2 2 4-4" />
            </svg>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            iziFACTURE
          </span>
        </div>

        <GlobeLanguageSelector />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-[0_16px_50px_-12px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {mode === "login"
                ? "Bon retour sur iziFACTURE"
                : mode === "signup"
                ? "Créer votre espace entreprise"
                : "Réinitialiser le mot de passe"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {mode === "login"
                ? "Connectez-vous pour gérer vos factures et vos clients en temps réel."
                : mode === "signup"
                ? "Démarrez avec un compte vierge et vos propres données réelles."
                : "Saisissez votre email pour recevoir un lien de réinitialisation."}
            </p>
          </div>

          {mode !== "forgot" && (
            <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                }}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 active:scale-95 ${
                  mode === "login"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 active:scale-95 ${
                  mode === "signup"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Créer un compte
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 leading-relaxed">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 space-y-2 leading-relaxed">
              <p>{infoMsg}</p>
              {pendingConfirmEmail && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={loading}
                  className="underline font-bold text-emerald-900 hover:text-emerald-700"
                >
                  Renvoyer l&apos;email de confirmation
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Votre nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Aichatou Moussa"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nom de votre entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Groupe Horizon SARL"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Adresse email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Mot de passe *
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrorMsg(null);
                        setInfoMsg(null);
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
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
                    placeholder="Minimum 6 caractères"
                    className="w-full px-4 pr-16 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 px-1.5 py-1"
                  >
                    {showPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirmer le mot de passe *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ressaisissez le mot de passe"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-bold shadow-lg shadow-slate-900/15 transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Connexion en cours...</span>
              ) : mode === "login" ? (
                <span>Se connecter à mon espace</span>
              ) : mode === "signup" ? (
                <span>Créer mon compte gratuitement</span>
              ) : (
                <span>Envoyer le lien</span>
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
                className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                ← Retour à la connexion
              </button>
            )}
          </form>
        </div>
      </main>

      <footer className="relative z-10 py-4 text-center text-xs text-slate-400">
        iziFACTURE · Plateforme de facturation professionnelle sécurisée
      </footer>
    </div>
  );
}

