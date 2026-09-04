import React, { useState } from "react";
import {
  Clock,
  Search,
  Sparkles,
  Trash2,
  ExternalLink,
  Tag,
  Smile,
  Copy,
  Check,
  Calendar,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { Interaction, ReflectionMode } from "../types";

interface EntryHistoryProps {
  interactions: Interaction[];
  onSelectInteraction: (interaction: Interaction) => void;
  onDeleteInteraction: (id: string) => Promise<void>;
  onNewEntry: () => void;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  interactions,
  onSelectInteraction,
  onDeleteInteraction,
  onNewEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredInteractions = interactions.filter((item) => {
    const matchesMode = filterMode === "all" || item.type === filterMode;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesMode;

    const inTitle = item.title?.toLowerCase().includes(query);
    const inSummary = item.summary?.toLowerCase().includes(query);
    const inTags = item.tags?.some((t) => t.toLowerCase().includes(query));
    const inMessages = item.messages?.some((m) =>
      m.content.toLowerCase().includes(query)
    );

    return matchesMode && (inTitle || inSummary || inTags || inMessages);
  });

  const handleCopyTranscript = (item: Interaction, e: React.MouseEvent) => {
    e.stopPropagation();
    const transcript = [
      `# ${item.title}`,
      `Date: ${new Date(item.createdAt).toLocaleString()}`,
      `Mode: ${item.type}`,
      item.summary ? `\nSummary: ${item.summary}\n` : "",
      "--- Dialogue ---",
      ...item.messages.map(
        (m) => `\n[${m.role === "model" ? "Gemini 3.6 Flash" : "You"}]:\n${m.content}\n`
      ),
    ].join("\n");

    navigator.clipboard.writeText(transcript);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Permanently delete this reflection from your isolated Cloud Firestore vault?")) {
      setDeletingId(id);
      try {
        await onDeleteInteraction(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-stone-100 flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Reflection Vault</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Encrypted &amp; user-isolated history stored in Cloud Firestore
          </p>
        </div>

        <button
          id="vault-new-entry-btn"
          onClick={onNewEntry}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Start New Reflection</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-entries-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections, takeaways, or tags..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "reflection", label: "Reflection" },
            { id: "brainstorming", label: "Brainstorm" },
            { id: "summary", label: "Summary" },
            { id: "gratitude", label: "Gratitude" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setFilterMode(mode.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                filterMode === mode.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-stone-900/80 text-stone-400 border border-stone-800 hover:bg-stone-800"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entry Cards List */}
      {filteredInteractions.length === 0 ? (
        <div className="p-12 rounded-2xl bg-stone-950/40 border border-dashed border-stone-800 text-center flex flex-col items-center justify-center">
          <Clock className="w-8 h-8 text-stone-600 mb-3" />
          <h3 className="font-serif text-base text-stone-300 mb-1">
            {searchQuery ? "No matching reflections found" : "No saved entries in your vault yet"}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mb-6">
            {searchQuery
              ? "Try adjusting your search terms or filters."
              : "Reflect on your thoughts, converse with Gemini 3.6, and your private insights will automatically populate here."}
          </p>
          {!searchQuery && (
            <button
              onClick={onNewEntry}
              className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer"
            >
              Write First Reflection
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredInteractions.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectInteraction(item)}
              className="group p-5 rounded-2xl bg-stone-900/60 hover:bg-stone-900 border border-stone-800/80 hover:border-amber-500/40 transition-all cursor-pointer flex flex-col gap-3 relative"
            >
              {/* Top Row: Title, Date, Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-serif text-base font-medium text-stone-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <span className="capitalize text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                    {item.type}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-stone-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-stone-400" />
                    {item.messages.length} turns
                  </span>
                </div>
              </div>

              {/* Summary or latest excerpt */}
              {item.summary ? (
                <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed font-sans bg-amber-950/10 p-2.5 rounded-xl border border-amber-500/15">
                  <strong className="text-amber-300 font-medium mr-1">Summary:</strong>
                  {item.summary}
                </p>
              ) : item.messages.length > 0 ? (
                <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                  {item.messages[0].content}
                </p>
              ) : null}

              {/* Tags & Mood Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.mood && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 border border-stone-700">
                      <Smile className="w-2.5 h-2.5" />
                      {item.mood}
                    </span>
                  )}
                  {item.tags?.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800"
                    >
                      <Tag className="w-2.5 h-2.5 text-stone-400" />
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={(e) => handleCopyTranscript(item, e)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
                    title="Copy full transcript"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    disabled={deletingId === item.id}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-400 transition-colors"
                    title="Delete reflection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1 text-xs text-amber-400 font-medium pl-2">
                    <span>Continue</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
