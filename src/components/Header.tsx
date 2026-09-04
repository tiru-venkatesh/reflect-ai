import React from "react";
import {
  Sparkles,
  ShieldCheck,
  LogOut,
  BookOpen,
  Clock,
  Lock,
  Brain,
} from "lucide-react";
import { User } from "firebase/auth";

interface HeaderProps {
  user: User | null;
  activeTab: "editor" | "insights" | "history" | "security";
  onTabChange: (tab: "editor" | "insights" | "history" | "security") => void;
  onSignOut: () => void;
  entryCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  onTabChange,
  onSignOut,
  entryCount,
}) => {
  const displayName =
    user?.displayName ||
    (user?.isAnonymous
      ? "Guest Explorer"
      : user?.email?.split("@")[0] || "Authenticated User");

  return (
    <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg tracking-tight">
                ReflectAI
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                Decision Intelligence
              </span>
            </div>
            <p className="text-xs text-stone-400">Your past, turned into signal.</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-stone-950/60 p-1 rounded-xl border border-stone-800/80 overflow-x-auto">
          <button
            id="tab-insights-btn"
            onClick={() => onTabChange("insights")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === "insights"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Insights</span>
          </button>

          <button
            id="tab-editor-btn"
            onClick={() => onTabChange("editor")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === "editor"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Reflect</span>
          </button>

          <button
            id="tab-history-btn"
            onClick={() => onTabChange("history")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === "history"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Vault</span>
            {entryCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] font-mono text-stone-300 border border-stone-700">
                {entryCount}
              </span>
            )}
          </button>

          <button
            id="tab-security-btn"
            onClick={() => onTabChange("security")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === "security"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Security</span>
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-medium text-stone-200 truncate max-w-[140px]">
              {displayName}
            </span>
            <span className="text-[10px] text-stone-400 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-emerald-400" />
              Isolated Space
            </span>
          </div>
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border border-stone-700 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs font-semibold text-amber-400">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            id="sign-out-btn"
            onClick={onSignOut}
            title="Sign Out"
            className="p-2 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
