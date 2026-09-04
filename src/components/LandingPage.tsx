import React, { useState } from "react";
import { Sparkles, Shield, Lock, Cpu, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

interface LandingPageProps {
  onSignInWithGoogle: () => Promise<void>;
  onSignInAsGuest: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignInWithGoogle,
  onSignInAsGuest,
  isLoading,
  errorMessage,
}) => {
  const [authMethod, setAuthMethod] = useState<string | null>(null);

  const handleGoogle = async () => {
    setAuthMethod("google");
    try {
      await onSignInWithGoogle();
    } finally {
      setAuthMethod(null);
    }
  };

  const handleGuest = async () => {
    setAuthMethod("guest");
    try {
      await onSignInAsGuest();
    } finally {
      setAuthMethod(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#14120f] text-stone-200 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Banner */}
      <div className="border-b border-stone-800/80 bg-stone-950/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-base text-stone-100 tracking-tight">
              ReflectAI
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cloud Run &amp; Firestore Ready</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs text-stone-300 mb-6">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Trust User Data Isolation</span>
          <span className="text-stone-600">|</span>
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span>Gemini 3.6 Flash Engine</span>
        </div>

        {/* Title */}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-stone-100 leading-[1.15] mb-6">
          Introspective journaling with an empathetic AI partner.
        </h1>

        <p className="text-stone-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
          Write unfiltered reflections, explore complex decisions, and receive constructive guidance.
          Every thought and conversation is cryptographically isolated to your authenticated account in Cloud Firestore.
        </p>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs text-left flex flex-col gap-2.5 shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-100">Notice for Preview Iframe</p>
                <p className="mt-0.5 text-rose-200/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={handleGuest}
              className="mt-1 w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Launch Instant Guest Mode (Full Access)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Auth Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto mb-12">
          <button
            id="google-signin-btn"
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {authMethod === "google" && isLoading ? (
              <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <button
            id="guest-signin-btn"
            onClick={handleGuest}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 font-medium text-sm border border-stone-700/80 hover:border-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {authMethod === "guest" && isLoading ? (
              <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <ArrowRight className="w-4 h-4 text-amber-400" />
            )}
            <span>Instant Guest Access</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono border border-amber-500/30">
              No Popup
            </span>
          </button>
        </div>

        {/* Value Matrix Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="p-5 rounded-2xl bg-stone-900/50 border border-stone-800/80 hover:border-stone-700/80 transition-all">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-base font-medium text-stone-200 mb-1.5">
              Multi-Turn Conversational Journal
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Don't just write and let thoughts collect dust. Converse with Gemini 3.6 to unpack emotional layers and brainstorm tangible next steps.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/50 border border-stone-800/80 hover:border-stone-700/80 transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-base font-medium text-stone-200 mb-1.5">
              Strict User-Bound Isolation
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Every document is strictly scoped to <code className="text-emerald-400 font-mono text-[11px]">/users/&#123;uid&#125;/interactions</code> with zero insecure default rules.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/50 border border-stone-800/80 hover:border-stone-700/80 transition-all">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-base font-medium text-stone-200 mb-1.5">
              Zero Raw Passwords Stored
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Delegates authentication safely to Google Identity Services through Firebase Auth. No plain credentials or password tables.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900 py-6 text-center text-xs text-stone-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ReflectAI &bull; Google AI Studio &amp; Cloud Run Deployment Ready</span>
          <div className="flex items-center gap-4 text-stone-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              OWASP Top 10 Hardened
            </span>
            <span>&bull;</span>
            <span>Google Cloud Secret Manager</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
