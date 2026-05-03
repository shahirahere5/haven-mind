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
  sentiment_score: number | null;
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

function sentimentLabel(score: number | null) {
  if (score === null) return null;
  if (score >= 0.4) return "Light";
  if (score >= 0.1) return "Soft";
  if (score > -0.1) return "Even";
  if (score > -0.4) return "Tender";
  return "Heavy";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
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
      .select("id, text, emotion, created_at, sentiment_score")
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
      // Generate recommendation based on sentiment score
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
    <div className="space-y-28">
      {/* Header — editorial, quiet */}
      <header className="animate-rise text-center">
        <p className="smallcaps text-muted-foreground/60">The journal</p>
        <h1 className="mt-6 font-display text-6xl italic text-ink leading-[1.1] sm:text-7xl">
          A page kept<br />for you.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base italic text-muted-foreground/70" style={{ lineHeight: "1.9" }}>
          Your thoughts remain yours. No one else will see this.
        </p>
      </header>

      {/* Writing canvas — no borders, no box, just text */}
      <form onSubmit={submit} className="animate-slow">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write what you couldn't say out loud…"
          rows={16}
          required
          maxLength={5000}
          className="prose-journal w-full resize-none border-0 bg-transparent px-0 py-0 text-foreground/90 placeholder:italic placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0"
          style={{
            minHeight: "22rem",
            caretColor: "var(--lamp)",
            lineHeight: "2.1",
            letterSpacing: "0.01em",
          }}
        />

        <div className="mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-3">
          <p className="smallcaps text-muted-foreground/50">A word for it</p>
          {EMOTIONS.map((em) => (
            <button
              key={em.value}
              type="button"
              onClick={() => setEmotion(emotion === em.value ? "" : em.value)}
              className={`font-display text-base italic transition-all duration-500 ${
                emotion === em.value
                  ? "text-lamp underline decoration-lamp/30 underline-offset-4"
                  : "text-muted-foreground/60 hover:text-foreground/80"
              }`}
            >
              {em.label}
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-xs italic text-muted-foreground/40">{text.length} / 5 000</p>
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="smallcaps text-foreground/80 transition-all duration-500 hover:text-lamp disabled:cursor-not-allowed disabled:text-muted-foreground/30"
          >
            {submitting ? "Keeping…" : "Keep this"}
          </button>
        </div>

        {error && <p className="mt-6 text-sm italic text-destructive/70 animate-fade-in">{error}</p>}
        {success && (
          <p className="mt-6 text-sm italic text-foreground/60 animate-fade-in">
            Kept. Thank you for trusting the page.
          </p>
        )}
      </form>

      {/* Divider */}
      <div className="rule" />

      {/* Earlier entries — flowing text, not cards */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-4xl italic text-ink">Earlier pages</h2>
          <p className="smallcaps text-muted-foreground/50">{entries.length} kept</p>
        </div>

        {loading ? (
          <InlineLoader />
        ) : entries.length === 0 ? (
          <p className="py-16 text-center font-display text-lg italic text-muted-foreground/50">
            Nothing yet. You may begin when ready.
          </p>
        ) : (
          <div className="space-y-20 mt-12">
            {entries.map((entry, i) => {
              const tone = sentimentLabel(entry.sentiment_score);
              return (
                <article
                  key={entry.id}
                  className="animate-rise"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-baseline justify-between mb-6">
                    <p className="font-display text-lg italic text-foreground/50">
                      {formatDate(entry.created_at)}
                    </p>
                    <p className="smallcaps text-muted-foreground/40">{formatTime(entry.created_at)}</p>
                  </div>
                  <p
                    className="prose-journal whitespace-pre-wrap text-foreground/85"
                    style={{ lineHeight: "2.1", letterSpacing: "0.01em" }}
                  >
                    {entry.text}
                  </p>
                  {(entry.emotion || tone) && (
                    <div className="mt-8 flex items-center gap-8 text-xs italic text-muted-foreground/50">
                      {entry.emotion && (
                        <span>
                          {EMOTIONS.find(e => e.value === entry.emotion)?.label ?? entry.emotion}
                        </span>
                      )}
                      {tone && (
                        <span>
                          {tone}
                          {entry.sentiment_score !== null && (
                            <span className="ml-1 text-muted-foreground/30">({entry.sentiment_score.toFixed(2)})</span>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
