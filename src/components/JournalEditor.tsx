import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  FileText,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Tag,
  Smile,
  RefreshCw,
  Share2,
  PlusCircle,
  Save,
} from "lucide-react";
import { Interaction, ChatMessage, ReflectionMode } from "../types";
import { saveUserInteraction } from "../lib/firebase";

interface JournalEditorProps {
  userId: string;
  currentInteraction: Interaction | null;
  onInteractionChange: (interaction: Interaction) => void;
  onNewSession: () => void;
  onSaveSuccess: () => void;
}

const MODE_CONFIG: Record<
  ReflectionMode,
  { label: string; icon: string; promptPlaceholder: string; description: string }
> = {
  reflection: {
    label: "Deep Reflection",
    icon: "🌟",
    promptPlaceholder: "What's on your mind today? Write candidly about an experience, decision, or feeling...",
    description: "Introspective inquiry, philosophical framing, and emotional exploration.",
  },
  brainstorming: {
    label: "Brainstorming",
    icon: "💡",
    promptPlaceholder: "Describe a challenge, goal, or creative spark you want to explore new solutions for...",
    description: "Generate innovative ideas, structured branches, and actionable next steps.",
  },
  summary: {
    label: "Synthesis & Action",
    icon: "📝",
    promptPlaceholder: "Paste or describe your chaotic notes, journal thoughts, or project state...",
    description: "Distill the essential themes, core tensions, and clear priorities.",
  },
  gratitude: {
    label: "Gratitude & Calm",
    icon: "🌿",
    promptPlaceholder: "What brought peace, curiosity, or appreciation to your day, however subtle?...",
    description: "Anchor in resilience, positive psychology, and mindful appreciation.",
  },
};

const SUGGESTED_PROMPTS = [
  "I'm feeling conflicted about an important decision and want to explore both sides objectively.",
  "Unpack an unexpected challenge I encountered today and find the hidden lessons.",
  "Brainstorm 4 creative angles to overcome creative burnout this week.",
  "Reflect on what energized me today and how to build more space for it.",
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  currentInteraction,
  onInteractionChange,
  onNewSession,
  onSaveSuccess,
}) => {
  const [mode, setMode] = useState<ReflectionMode>(
    currentInteraction?.type || "reflection"
  );
  const [title, setTitle] = useState(
    currentInteraction?.title || "Untitled Reflection"
  );
  const [promptText, setPromptText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = currentInteraction?.messages || [];

  useEffect(() => {
    if (currentInteraction) {
      setTitle(currentInteraction.title);
      setMode(currentInteraction.type);
    }
  }, [currentInteraction?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleModeSelect = (newMode: ReflectionMode) => {
    setMode(newMode);
    if (currentInteraction) {
      const updated: Interaction = {
        ...currentInteraction,
        type: newMode,
      };
      onInteractionChange(updated);
      saveUserInteraction(userId, updated).catch(console.error);
    }
  };

  // Submit Prompt to Gemini & Guaranteed Transaction Verification to Firestore
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt || isLoading) return;

    setSaveError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: "msg-" + Date.now() + "-user",
      role: "user",
      content: cleanPrompt,
      timestamp: new Date().toISOString(),
    };

    // Prepare draft interaction
    const interactionId = currentInteraction?.id || "inter-" + Date.now();
    const derivedTitle =
      title === "Untitled Reflection" || !title.trim()
        ? cleanPrompt.slice(0, 45) + (cleanPrompt.length > 45 ? "..." : "")
        : title;

    const currentMessages = currentInteraction ? [...currentInteraction.messages] : [];
    const optimisticMessages = [...currentMessages, userMessage];

    try {
      // 1. Call server-side Gemini reflection endpoint
      const response = await fetch("/api/gemini/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages,
          prompt: cleanPrompt,
          mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Gemini request failed (${response.status})`);
      }

      const data = await response.json();
      const modelMessage: ChatMessage = {
        id: "msg-" + Date.now() + "-gemini",
        role: "model",
        content: data.reply,
        timestamp: data.timestamp || new Date().toISOString(),
        modelUsed: data.modelUsed,
      };

      const updatedInteraction: Interaction = {
        id: interactionId,
        userId,
        title: derivedTitle,
        type: mode,
        createdAt: currentInteraction?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [...optimisticMessages, modelMessage],
        summary: currentInteraction?.summary,
        keyTakeaways: currentInteraction?.keyTakeaways,
        tags: currentInteraction?.tags,
        mood: currentInteraction?.mood,
      };

      // Update parent state and clear prompt input immediately so reflection is visible
      onInteractionChange(updatedInteraction);
      setTitle(derivedTitle);
      setPromptText("");

      // 2. Guaranteed Transaction Verification: Save to Cloud Firestore
      setIsSaving(true);
      try {
        await saveUserInteraction(userId, updatedInteraction);
        onSaveSuccess();
      } catch (saveErr: any) {
        console.error("Firestore persistence error:", saveErr);
        setSaveError("Cloud Firestore sync encountered an issue: " + (saveErr?.message || "Check network"));
      } finally {
        setIsSaving(false);
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      // Explicit error escalation: Never discard user prompt if it failed
      setSaveError(
        err?.message || "Encountered an issue communicating with Gemini."
      );
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  // Generate Summarization & Insights for current session
  const handleGenerateSummary = async () => {
    if (!currentInteraction || currentInteraction.messages.length === 0 || isSummarizing) {
      return;
    }

    setIsSummarizing(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dialogue: currentInteraction.messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary with Gemini.");
      }

      const summaryData = await response.json();

      const updated: Interaction = {
        ...currentInteraction,
        title: summaryData.title || currentInteraction.title,
        summary: summaryData.summary,
        keyTakeaways: summaryData.keyTakeaways || [],
        tags: summaryData.tags || [],
        mood: summaryData.mood,
        updatedAt: new Date().toISOString(),
      };

      await saveUserInteraction(userId, updated);
      onInteractionChange(updated);
      setTitle(updated.title);
      onSaveSuccess();
    } catch (err: any) {
      console.error("Summary error:", err);
      setSaveError(err?.message || "Failed to generate summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Retry saving interaction if it failed
  const handleRetrySave = async () => {
    if (!currentInteraction) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await saveUserInteraction(userId, currentInteraction);
      onSaveSuccess();
    } catch (err: any) {
      setSaveError("Retry failed: " + (err?.message || "Check network connection."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Top Bar: Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div className="flex-1">
          <input
            id="interaction-title-input"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (currentInteraction) {
                const updated = { ...currentInteraction, title: e.target.value };
                onInteractionChange(updated);
                saveUserInteraction(userId, updated).catch(console.error);
              }
            }}
            placeholder="Name this journal reflection..."
            className="w-full bg-transparent font-serif text-xl sm:text-2xl font-semibold text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-0 border-b border-transparent hover:border-stone-800 focus:border-amber-500/50 transition-colors"
          />
          <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
            <span>{MODE_CONFIG[mode].label}</span>
            <span>&bull;</span>
            <span>{messages.length} exchanges</span>
            {isSaving && (
              <>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              id="generate-summary-btn"
              onClick={handleGenerateSummary}
              disabled={isSummarizing || isLoading}
              className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Distill session takeaways and tags with Gemini"
            >
              {isSummarizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Distill &amp; Summarize</span>
            </button>
          )}

          <button
            id="new-reflection-btn"
            onClick={onNewSession}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(MODE_CONFIG) as ReflectionMode[]).map((m) => {
          const cfg = MODE_CONFIG[m];
          const isSelected = mode === m;
          return (
            <button
              key={m}
              id={`mode-${m}-btn`}
              onClick={() => handleModeSelect(m)}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? "bg-stone-900 border-amber-500/50 shadow-sm"
                  : "bg-stone-950/40 border-stone-800/80 hover:bg-stone-900/50 hover:border-stone-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">{cfg.icon}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                )}
              </div>
              <div
                className={`text-xs font-medium ${
                  isSelected ? "text-amber-300" : "text-stone-300"
                }`}
              >
                {cfg.label}
              </div>
              <div className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                {cfg.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Error Banner with Retry */}
      {saveError && (
        <div
          id="persistence-error-banner"
          className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/70 text-rose-200 text-xs flex items-center justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button
            onClick={handleRetrySave}
            disabled={isSaving}
            className="px-3 py-1 rounded bg-rose-800 hover:bg-rose-700 text-white font-medium text-xs flex items-center gap-1 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry Save</span>
          </button>
        </div>
      )}

      {/* Summary Box if generated */}
      {currentInteraction?.summary && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-stone-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Gemini Synthesis &amp; Takeaways
              </span>
            </div>
            {currentInteraction.mood && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs">
                <Smile className="w-3 h-3" />
                Mood: {currentInteraction.mood}
              </span>
            )}
          </div>
          <p className="text-sm text-stone-300 leading-relaxed font-sans mb-3">
            {currentInteraction.summary}
          </p>

          {currentInteraction.keyTakeaways && currentInteraction.keyTakeaways.length > 0 && (
            <div className="mt-2 pt-2 border-t border-amber-500/15">
              <p className="text-xs font-medium text-amber-200 mb-1.5">Actionable Takeaways:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-stone-300">
                {currentInteraction.keyTakeaways.map((takeaway, i) => (
                  <li key={i}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}

          {currentInteraction.tags && currentInteraction.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {currentInteraction.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-stone-900/80 text-stone-400 border border-stone-800"
                >
                  <Tag className="w-2.5 h-2.5 text-stone-400" />
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Multi-turn Dialogue Stream */}
      <div className="flex flex-col gap-4 min-h-[220px]">
        {messages.length === 0 ? (
          <div className="p-8 rounded-2xl bg-stone-950/40 border border-dashed border-stone-800 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-base text-stone-200 mb-1">
              Your reflection canvas is open.
            </h4>
            <p className="text-xs text-stone-400 max-w-md mb-6">
              Write anything candidly below, or click a guided starter to begin your multi-turn conversation with Gemini 3.6 Flash.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl text-left">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPromptText(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="p-2.5 rounded-xl bg-stone-900/70 hover:bg-stone-900 border border-stone-800/80 hover:border-amber-500/30 text-xs text-stone-300 transition-all text-left cursor-pointer"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px] text-stone-400 font-mono">
                  <span>{isUser ? "You" : "Gemini 3.6 Flash"}</span>
                  <span>&bull;</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.modelUsed && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                      {msg.modelUsed}
                    </span>
                  )}
                </div>

                <div
                  className={`group relative max-w-3xl rounded-2xl p-4 text-sm leading-relaxed transition-all ${
                    isUser
                      ? "bg-amber-500/10 border border-amber-500/20 text-stone-100"
                      : "bg-stone-900/80 border border-stone-800 text-stone-200"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1.5 rounded-lg bg-stone-800/90 text-stone-400 hover:text-stone-200 transition-colors"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-stone-400 font-mono">
              <span>Gemini 3.6 Flash</span>
              <span>&bull;</span>
              <span>Reflecting...</span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center gap-3 text-xs text-stone-400">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Synthesizing reflection with resilient fallback model ladder...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="sticky bottom-4 z-20 mt-4">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-stone-900/95 backdrop-blur-md border border-stone-700/80 shadow-2xl p-2.5 flex flex-col gap-2"
        >
          <textarea
            id="journal-input-textarea"
            ref={textareaRef}
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={MODE_CONFIG[mode].promptPlaceholder}
            className="w-full bg-transparent text-sm text-stone-100 placeholder-stone-500 focus:outline-none resize-none px-2 py-1 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 px-2">
            <div className="text-[11px] text-stone-400 hidden sm:block">
              Press <kbd className="font-mono bg-stone-800 px-1 py-0.5 rounded text-stone-300">Ctrl/Cmd + Enter</kbd> to reflect
            </div>

            <button
              id="submit-reflection-btn"
              type="submit"
              disabled={isLoading || !promptText.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Reflect with Gemini</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
