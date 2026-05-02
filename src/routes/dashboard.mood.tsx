import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { InlineLoader } from "@/components/PageLoader";

export const Route = createFileRoute("/dashboard/mood")({
  component: MoodPage,
});

interface MoodLog {
  id: string;
  mood_level: number | null;
  note: string | null;
  created_at: string;
}

const MOODS = [
  { level: 1, label: "Low" },
  { level: 2, label: "Quiet" },
  { level: 3, label: "Balanced" },
  { level: 4, label: "Light" },
  { level: 5, label: "Clear" },
];

function moodLabel(level: number | null) {
  return MOODS.find((m) => m.level === level)?.label ?? "—";
}

function MoodPage() {
  const { user } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mood_logs")
      .select("id, mood_level, note, created_at")
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) setError(error.message);
    else setLogs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mood === null || !user) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase
      .from("mood_logs")
      .insert({ user_id: user.id, mood_level: mood, note: note.trim() || null });
    if (error) setError(error.message);
    else {
      setMood(null); setNote("");
      setSuccess(true); setTimeout(() => setSuccess(false), 2800);
      await load();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-28">
      <header className="animate-rise text-center">
        <p className="smallcaps text-muted-foreground/50">A pause</p>
        <h1 className="mt-6 font-display text-6xl italic text-ink leading-[1.1] sm:text-7xl">
          How is the air<br />today?
        </h1>
        <p className="mx-auto mt-6 max-w-md italic text-muted-foreground/60" style={{ lineHeight: "1.9" }}>
          There is no wrong answer here. Only the one that is true.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-14 animate-slow">
        <div className="flex flex-wrap items-baseline justify-center gap-x-12 gap-y-5">
          {MOODS.map((m) => (
            <button
              key={m.level}
              type="button"
              onClick={() => setMood(m.level)}
              className={`font-display text-3xl italic transition-all duration-500 ${
                mood === m.level
                  ? "text-lamp underline decoration-lamp/30 underline-offset-8"
                  : "text-muted-foreground/50 hover:text-foreground/70"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div>
          <p className="smallcaps text-center text-muted-foreground/40 mb-4">A note, if you wish</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What is shaping the day?"
            rows={3}
            maxLength={500}
            className="prose-journal w-full resize-none border-0 bg-transparent px-0 py-2 text-foreground/85 placeholder:italic placeholder:text-muted-foreground/35 focus:outline-none focus:ring-0"
            style={{ lineHeight: "2", caretColor: "var(--lamp)" }}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs italic text-muted-foreground/30">{note.length} / 500</p>
          <button
            type="submit"
            disabled={submitting || mood === null}
            className="smallcaps text-foreground/70 transition-all duration-500 hover:text-lamp disabled:cursor-not-allowed disabled:text-muted-foreground/25"
          >
            {submitting ? "Keeping…" : "Note this moment"}
          </button>
        </div>

        {error && <p className="text-sm italic text-destructive/60 animate-fade-in">{error}</p>}
        {success && (
          <p className="text-center text-sm italic text-foreground/50 animate-fade-in">
            Noted.
          </p>
        )}
      </form>

      <div className="rule" />

      <section className="space-y-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-4xl italic text-ink">Recent</h2>
          <p className="smallcaps text-muted-foreground/40">{logs.length} noticed</p>
        </div>

        {loading ? (
          <InlineLoader />
        ) : logs.length === 0 ? (
          <p className="py-16 text-center font-display text-lg italic text-muted-foreground/40">
            Nothing yet. Begin when you wish.
          </p>
        ) : (
          <div className="space-y-0 mt-8">
            {logs.map((log, i) => (
              <div
                key={log.id}
                className="flex items-baseline justify-between py-6 animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <p className="font-display text-xl italic text-ink/80 w-28">{moodLabel(log.mood_level)}</p>
                <p className="flex-1 text-sm italic text-foreground/50 px-6">
                  {log.note ?? <span className="text-muted-foreground/25">—</span>}
                </p>
                <p className="smallcaps text-muted-foreground/35">
                  {new Date(log.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
