import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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

const MOODS: Array<{ level: number; emoji: string; label: string; color: string }> = [
  { level: 1, emoji: "😢", label: "Low", color: "from-[oklch(0.9_0.06_260)] to-[oklch(0.94_0.04_280)]" },
  { level: 2, emoji: "😕", label: "Down", color: "from-[oklch(0.92_0.06_220)] to-[oklch(0.95_0.04_240)]" },
  { level: 3, emoji: "😐", label: "Okay", color: "from-[oklch(0.93_0.05_165)] to-[oklch(0.95_0.04_180)]" },
  { level: 4, emoji: "🙂", label: "Good", color: "from-[oklch(0.93_0.07_80)] to-[oklch(0.95_0.05_60)]" },
  { level: 5, emoji: "😄", label: "Great", color: "from-[oklch(0.92_0.08_50)] to-[oklch(0.94_0.06_30)]" },
];

function meta(level: number | null) {
  return MOODS.find((m) => m.level === level);
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
      .limit(30);
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
    <div className="space-y-10">
      <div className="animate-rise">
        <h2 className="font-display text-4xl font-semibold tracking-tight">Mood check-in</h2>
        <p className="mt-2 text-muted-foreground">A small pause to notice how you feel.</p>
      </div>

      <Card className="border-0 glass shadow-soft animate-rise">
        <CardHeader>
          <CardTitle className="font-display text-2xl">How are you feeling today?</CardTitle>
          <CardDescription>There's no wrong answer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Pick a mood</Label>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {MOODS.map((m) => (
                  <button
                    key={m.level}
                    type="button"
                    onClick={() => setMood(m.level)}
                    className={`group flex flex-col items-center gap-1.5 rounded-2xl border bg-gradient-to-br ${m.color} px-2 py-4 transition-all hover:-translate-y-1 hover:shadow-soft ${
                      mood === m.level ? "border-primary scale-105 shadow-glow" : "border-transparent"
                    }`}
                    aria-label={m.label}
                  >
                    <span className="text-3xl sm:text-4xl transition-transform group-hover:scale-110">{m.emoji}</span>
                    <span className="text-xs font-medium text-foreground/80">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="note" className="text-sm font-medium">Want to add a note? <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's contributing to this feeling?"
                rows={3}
                maxLength={500}
                className="resize-none rounded-2xl bg-background/70 transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              <p className="text-right text-xs text-muted-foreground">{note.length}/500</p>
            </div>

            {error && <p className="text-sm text-destructive animate-fade-in">{error}</p>}
            {success && <p className="rounded-lg bg-primary/10 p-3 text-sm text-foreground animate-fade-in">Logged 💛</p>}

            <Button
              type="submit"
              disabled={submitting || mood === null}
              className="w-full gradient-primary shadow-soft transition-transform hover:scale-[1.01] active:scale-[0.99] sm:w-auto"
              size="lg"
            >
              {submitting ? "Saving…" : "Log mood"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section>
        <h3 className="mb-5 font-display text-2xl font-semibold">Recent moods</h3>
        {loading ? (
          <InlineLoader />
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-10 text-center text-muted-foreground">
            No moods logged yet 🌷
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {logs.map((log, i) => {
              const m = meta(log.mood_level);
              return (
                <Card key={log.id} className={`border-0 bg-gradient-to-br ${m?.color ?? ""} shadow-soft animate-rise`} style={{ animationDelay: `${i * 30}ms` }}>
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="text-5xl">{m?.emoji ?? "—"}</div>
                    <div className="flex-1">
                      <p className="font-display text-lg font-semibold">{m?.label ?? "Unknown"}</p>
                      {log.note && <p className="mt-1 text-sm leading-snug text-foreground/80">{log.note}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
