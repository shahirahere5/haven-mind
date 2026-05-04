import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { InlineLoader } from "@/components/PageLoader";

export const Route = createFileRoute("/dashboard/journal")({
  component: JournalPage,
});

interface Entry {
  id: string;
  text: string | null;
  emotion: string | null;
  created_at: string;
}

const EMOTIONS = [
  { value: "joyful", label: "Light" },
  { value: "calm", label: "Quiet" },
  { value: "grateful", label: "Grateful" },
  { value: "anxious", label: "Restless" },
  { value: "sad", label: "Heavy" },
  { value: "angry", label: "Sharp" },
  { value: "tired", label: "Tired" },
  { value: "hopeful", label: "Hopeful" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function JournalPage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [emotion, setEmotion] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, text, emotion, created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setEntries(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSubmitting(true);
    setError(null);
    const { data: inserted, error } = await supabase
      .from("journal_entries")
      .insert({ user_id: user.id, text: text.trim(), emotion: emotion || null })
      .select("sentiment_score")
      .single();
    if (error) setError(error.message);
    else {
      const score = inserted?.sentiment_score ?? 0;
      let recMessage = "";
      if (score <= -0.4) {
        recMessage = "Your words carry weight today. Consider reaching out to someone you trust, or simply rest.";
      } else if (score <= -0.1) {
        recMessage = "There's a tenderness in what you wrote. A walk or a few minutes of stillness may help.";
      } else if (score <= 0.1) {
        recMessage = "You seem to be in a reflective space. That's a good place to be.";
      } else if (score <= 0.4) {
        recMessage = "There's warmth in your words. Hold onto what brought you here.";
      } else {
        recMessage = "Your writing radiates lightness today. Carry this feeling forward.";
      }
      await supabase.from("recommendations").insert({
        user_id: user.id,
        message: recMessage,
        type: "journal-sentiment",
      });

      setText(""); setEmotion("");
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
      await load();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-16">
      <header className="animate-rise">
        <p className="smallcaps text-lamp/60 mb-4">Journal</p>
        <h1 className="font-display text-5xl text-ink sm:text-6xl leading-[1.1]">
          Write freely
        </h1>
        <p className="mt-4 text-muted-foreground/60" style={{ lineHeight: "1.8" }}>
          Your thoughts remain yours. No one else will see this.
        </p>
      </header>

      <form onSubmit={submit} className="glass-card animate-slow">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind today…"
          rows={12}
          required
          maxLength={5000}
          className="w-full resize-none border-0 bg-transparent px-0 py-0 font-display text-lg text-foreground/90 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0"
          style={{
            minHeight: "16rem",
            caretColor: "var(--lamp)",
            lineHeight: "2",
          }}
        />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground/40 mr-2">Feeling:</p>
          {EMOTIONS.map((em) => (
            <button
              key={em.value}
              type="button"
              onClick={() => setEmotion(emotion === em.value ? "" : em.value)}
              className={`rounded-full px-4 py-1.5 text-sm transition-all duration-300 ${
                emotion === em.value
                  ? "text-primary-foreground"
                  : "text-muted-foreground/60 hover:text-foreground/80"
              }`}
              style={emotion === em.value ? { background: "var(--gradient-primary)" } : { background: "var(--glass)" }}
            >
              {em.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground/30">{text.length} / 5,000</p>
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="rounded-xl px-6 py-2.5 font-medium text-primary-foreground transition-all duration-300 disabled:opacity-30"
            style={{ background: "var(--gradient-primary)" }}
          >
            {submitting ? "Saving…" : "Save Entry"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-destructive/70 animate-fade-in">{error}</p>}
        {success && (
          <p className="mt-4 text-sm text-teal/70 animate-fade-in">
            Saved. Thank you for sharing with yourself.
          </p>
        )}
      </form>

      <div className="rule" />

      <section className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl text-ink">Previous Entries</h2>
          <p className="text-sm text-muted-foreground/40">{entries.length} entries</p>
        </div>

        {loading ? (
          <InlineLoader />
        ) : entries.length === 0 ? (
          <div className="glass-card text-center py-12">
            <p className="font-display text-xl text-muted-foreground/40">
              No entries yet. Start writing when you're ready.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, i) => (
              <article
                key={entry.id}
                className="glass-card animate-rise"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground/50">{formatDate(entry.created_at)}</p>
                  <p className="text-xs text-muted-foreground/30">{formatTime(entry.created_at)}</p>
                </div>
                <p className="text-foreground/80 whitespace-pre-wrap" style={{ lineHeight: "1.8" }}>
                  {entry.text}
                </p>
                {entry.emotion && (
                  <div className="mt-4">
                    <span className="rounded-full px-3 py-1 text-xs" style={{ background: "var(--glass)" }}>
                      {EMOTIONS.find(e => e.value === entry.emotion)?.label ?? entry.emotion}
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
