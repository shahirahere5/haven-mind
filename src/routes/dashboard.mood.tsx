import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Textarea } from "@/components/ui/textarea";
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
      setSuccess(true); setTimeout(() => setSuccess(false), 2200);
      await load();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-24">
      <header className="animate-rise">
        <p className="smallcaps text-muted-foreground">A pause</p>
        <h1 className="mt-5 font-display text-5xl italic text-ink">How is the air today?</h1>
        <p className="mt-4 max-w-xl italic text-muted-foreground">
          There is no wrong answer here. Only the one that is true.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-12 animate-slow">
        <div className="space-y-5">
          <p className="smallcaps text-muted-foreground">Choose what fits</p>
          <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
            {MOODS.map((m) => (
              <button
                key={m.level}
                type="button"
                onClick={() => setMood(m.level)}
                className={`font-display text-2xl italic transition-colors ${
                  mood === m.level
                    ? "text-lamp underline decoration-lamp/40 underline-offset-8"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="smallcaps text-muted-foreground">A note, if you wish</p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What is shaping the day?"
            rows={3}
            maxLength={500}
            className="prose-journal w-full resize-none border-0 border-b border-border bg-transparent px-0 py-3 text-base placeholder:italic placeholder:text-muted-foreground/60 focus-visible:border-b-foreground/50 focus-visible:ring-0 focus-visible:outline-none shadow-none"
          />
        </div>

        <div className="flex items-center justify-between border-t border-border/40 pt-6">
          <p className="text-xs italic text-muted-foreground/70">{note.length} / 500</p>
          <button
            type="submit"
            disabled={submitting || mood === null}
            className="smallcaps text-foreground transition-colors hover:text-lamp disabled:cursor-not-allowed disabled:text-muted-foreground/40"
          >
            {submitting ? "Keeping…" : "Note this moment"}
          </button>
        </div>

        {error && <p className="text-sm italic text-destructive/80 animate-fade-in">{error}</p>}
        {success && (
          <p className="border-l-2 border-primary/40 pl-4 text-sm italic text-foreground/80 animate-fade-in">
            Noted.
          </p>
        )}
      </form>

      <section className="space-y-8">
        <div className="flex items-baseline justify-between border-b border-border/40 pb-4">
          <h2 className="font-display text-3xl italic text-ink">Recent</h2>
          <p className="smallcaps text-muted-foreground">{logs.length} noticed</p>
        </div>

        {loading ? (
          <InlineLoader />
        ) : logs.length === 0 ? (
          <p className="py-12 text-center text-sm italic text-muted-foreground">
            Nothing yet. Begin when you wish.
          </p>
        ) : (
          <div className="divide-y divide-border/30">
            {logs.map((log, i) => (
              <div
                key={log.id}
                className="grid grid-cols-[auto_1fr_auto] items-baseline gap-6 py-5 animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <p className="font-display text-xl italic text-ink w-28">{moodLabel(log.mood_level)}</p>
                <p className="text-sm italic text-foreground/70">{log.note ?? <span className="text-muted-foreground/60">—</span>}</p>
                <p className="smallcaps text-muted-foreground">
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
