import React, { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import {
  subscribeToAuth,
  signInWithGoogle,
  signInAsGuest,
  logOut,
  fetchUserInteractions,
  deleteUserInteraction,
} from "./lib/firebase";
import { Interaction } from "./types";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { JournalEditor } from "./components/JournalEditor";
import { EntryHistory } from "./components/EntryHistory";
import { SecurityPanel } from "./components/SecurityPanel";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"editor" | "history" | "security">("editor");
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [currentInteraction, setCurrentInteraction] = useState<Interaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auth State Subscription with timeout guarantee
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 1500);

    const unsubscribe = subscribeToAuth((currentUser) => {
      clearTimeout(safetyTimer);
      setUser(currentUser);
      setAuthLoading(false);
      setAuthError(null);
    });
    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  // Load interactions when user changes
  const loadInteractions = useCallback(async (uid: string) => {
    try {
      const list = await fetchUserInteractions(uid);
      setInteractions(list);
    } catch (err) {
      console.error("Failed to load user interactions:", err);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      loadInteractions(user.uid);
    } else {
      setInteractions([]);
      setCurrentInteraction(null);
    }
  }, [user?.uid, loadInteractions]);

  // Auth Handlers
  const handleSignInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
      showToast("Signed in successfully with Google");
    } catch (err: any) {
      console.warn("Google Auth notice:", err);
      // If popup is closed or blocked by iframe
      if (err?.code === "auth/popup-blocked" || err?.code === "auth/cancelled-popup-request") {
        setAuthError(
          "The login popup was blocked by your browser or iframe sandbox. You can click 'Guest Preview Mode' below or open the app in a new browser tab."
        );
      } else {
        setAuthError(err?.message || "Failed to sign in with Google.");
      }
    }
  };

  const handleSignInAsGuest = async () => {
    setAuthError(null);
    try {
      await signInAsGuest();
      showToast("Signed in as Guest Explorer (Isolated session)");
    } catch (err: any) {
      setAuthError(err?.message || "Guest authentication failed.");
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentInteraction(null);
      setInteractions([]);
      setActiveTab("editor");
      showToast("Signed out securely");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Interaction handlers
  const handleNewSession = () => {
    setCurrentInteraction(null);
    setActiveTab("editor");
  };

  const handleSelectInteraction = (interaction: Interaction) => {
    setCurrentInteraction(interaction);
    setActiveTab("editor");
  };

  const handleDeleteInteraction = async (id: string) => {
    if (!user?.uid) return;
    try {
      await deleteUserInteraction(user.uid, id);
      setInteractions((prev) => prev.filter((item) => item.id !== id));
      if (currentInteraction?.id === id) {
        setCurrentInteraction(null);
      }
      showToast("Reflection permanently deleted from vault");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete reflection from Firestore");
    }
  };

  const handleInteractionChange = (updated: Interaction) => {
    setCurrentInteraction(updated);
    setInteractions((prev) => {
      const exists = prev.some((item) => item.id === updated.id);
      if (exists) {
        return prev.map((item) => (item.id === updated.id ? updated : item));
      } else {
        return [updated, ...prev];
      }
    });
  };

  const handleSaveSuccess = () => {
    if (user?.uid) {
      loadInteractions(user.uid);
    }
  };

  // Initial Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#14120f] flex items-center justify-center text-stone-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="font-serif text-sm text-stone-400">
            Initializing ReflectAI secure environment...
          </span>
        </div>
      </div>
    );
  }

  // Not authenticated: Show Landing Page
  if (!user) {
    return (
      <LandingPage
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignInAsGuest={handleSignInAsGuest}
        isLoading={authLoading}
        errorMessage={authError}
      />
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-[#14120f] text-stone-200 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Header
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={handleSignOut}
        entryCount={interactions.length}
      />

      <main className="flex-1">
        {activeTab === "editor" && (
          <JournalEditor
            userId={user.uid}
            currentInteraction={currentInteraction}
            onInteractionChange={handleInteractionChange}
            onNewSession={handleNewSession}
            onSaveSuccess={handleSaveSuccess}
          />
        )}

        {activeTab === "history" && (
          <EntryHistory
            interactions={interactions}
            onSelectInteraction={handleSelectInteraction}
            onDeleteInteraction={handleDeleteInteraction}
            onNewEntry={handleNewSession}
          />
        )}

        {activeTab === "security" && <SecurityPanel />}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 border border-stone-700 text-stone-200 px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xl animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
