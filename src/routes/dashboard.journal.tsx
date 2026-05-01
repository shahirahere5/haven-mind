import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Textarea } from "@/components/ui/textarea";
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
    const { error } = await supabase
      .from("journal_entries")
      .insert({ user_id: user.id, text: text.trim(), emotion: emotion || null });
    if (error) setError(error.message);
    else {
      setText(""); setEmotion("");
      setSuccess(true); setTimeout(() => setSuccess(false), 2400);
      await load();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-24">
      <header className="animate-rise">
        <p className="smallcaps text-muted-foreground">The journal</p>
        <h1 className="mt-5 font-display text-5xl italic text-ink">A page kept for you.</h1>
        <p className="mt-4 max-w-xl text-base italic text-muted-foreground">
          Your thoughts remain yours. No one else will see this.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-8 animate-slow">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write what you couldn't say out loud."
          rows={12}
          required
          maxLength={5000}
          className="prose-journal w-full resize-none border-0 border-b border-border bg-transparent px-0 py-4 placeholder:italic placeholder:text-muted-foreground/60 focus-visible:border-b-foreground/50 focus-visible:ring-0 focus-visible:outline-none shadow-none"
          style={{ minHeight: "16rem" }}
        />

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <p className="smallcaps text-muted-foreground">A word for it</p>
          {EMOTIONS.map((em) => (
            <button
              key={em.value}
              type="button"
              onClick={() => setEmotion(emotion === em.value ? "" : em.value)}
              className={`font-display text-base italic transition-colors ${
                emotion === em.value
                  ? "text-lamp underline decoration-lamp/40 underline-offset-4"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {em.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border/40 pt-6">
          <p className="text-xs italic text-muted-foreground/70">{text.length} / 5000</p>
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="smallcaps text-foreground transition-colors hover:text-lamp disabled:cursor-not-allowed disabled:text-muted-foreground/40"
          >
            {submitting ? "Keeping…" : "Keep this entry"}
          </button>
        </div>

        {error && <p className="text-sm italic text-destructive/80 animate-fade-in">{error}</p>}
        {success && (
          <p className="border-l-2 border-primary/40 pl-4 text-sm italic text-foreground/80 animate-fade-in">
            Kept. Thank you for trusting the page.
          </p>
        )}
      </form>

      <section className="space-y-12">
        <div className="flex items-baseline justify-between border-b border-border/40 pb-4">
          <h2 className="font-display text-3xl italic text-ink">Earlier pages</h2>
          <p className="smallcaps text-muted-foreground">{entries.length} kept</p>
        </div>

        {loading ? (
          <InlineLoader />
        ) : entries.length === 0 ? (
          <p className="py-12 text-center text-sm italic text-muted-foreground">
            Nothing yet. You may begin when ready.
          </p>
        ) : (
          <div className="space-y-16">
            {entries.map((entry, i) => {
              const tone = sentimentLabel(entry.sentiment_score);
              return (
                <article
                  key={entry.id}
                  className="animate-rise"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-baseline justify-between border-b border-border/30 pb-3">
                    <p className="font-display text-lg italic text-foreground/80">
                      {formatDate(entry.created_at)}
                    </p>
                    <p className="smallcaps text-muted-foreground">{formatTime(entry.created_at)}</p>
                  </div>
                  <p className="prose-journal mt-6 whitespace-pre-wrap text-foreground/90">{entry.text}</p>
                  {(entry.emotion || tone) && (
                    <div className="mt-6 flex items-center gap-6 text-xs italic text-muted-foreground">
                      {entry.emotion && (
                        <span>
                          A word — <span className="text-foreground/70">{EMOTIONS.find(e => e.value === entry.emotion)?.label ?? entry.emotion}</span>
                        </span>
                      )}
                      {tone && (
                        <span>
                          Tone — <span className="text-foreground/70">{tone}</span>
                          {entry.sentiment_score !== null && (
                            <span className="ml-1 text-muted-foreground/60">({entry.sentiment_score.toFixed(2)})</span>
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
