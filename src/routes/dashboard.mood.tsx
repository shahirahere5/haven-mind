import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/mood")({
  component: MoodPage,
});

interface MoodLog {
  id: string;
  mood_level: number | null;
  note: string | null;
  created_at: string;
}

const MOODS: Array<{ level: number; emoji: string; label: string }> = [
  { level: 1, emoji: "😢", label: "Low" },
  { level: 2, emoji: "😕", label: "Down" },
  { level: 3, emoji: "😐", label: "Okay" },
  { level: 4, emoji: "🙂", label: "Good" },
  { level: 5, emoji: "😄", label: "Great" },
];

function emojiFor(level: number | null) {
  return MOODS.find((m) => m.level === level)?.emoji ?? "—";
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
      .limit(20);
    if (error) setError(error.message);
    else setLogs(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mood === null || !user) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase
      .from("mood_logs")
      .insert({ user_id: user.id, mood_level: mood, note: note.trim() || null });
    if (error) {
      setError(error.message);
    } else {
      setMood(null);
      setNote("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      await load();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <Card className="border-0 bg-card/70 backdrop-blur-sm shadow-soft animate-rise">
        <CardHeader>
          <CardTitle>How are you feeling today?</CardTitle>
          <CardDescription>There's no wrong answer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="flex flex-wrap gap-3">
              {MOODS.map((m) => (
                <button
                  key={m.level}
                  type="button"
                  onClick={() => setMood(m.level)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-soft ${
                    mood === m.level
                      ? "border-primary bg-primary/15 scale-105 shadow-soft"
                      : "border-border/60 bg-background/60"
                  }`}
                  aria-label={m.label}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </button>
              ))}
            </div>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="rounded-xl bg-background/70"
            />
            {error && <p className="text-sm text-destructive animate-fade-in">{error}</p>}
            {success && <p className="text-sm text-primary animate-fade-in">Logged 💛</p>}
            <Button
              type="submit"
              disabled={submitting || mood === null}
              className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? "Saving…" : "Log mood"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Recent moods</h3>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="text-muted-foreground">No moods logged yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {logs.map((log, i) => (
              <Card
                key={log.id}
                className="border-0 bg-card/70 backdrop-blur-sm shadow-soft animate-rise"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <CardContent className="flex items-center gap-4 pt-5">
                  <div className="text-4xl">{emojiFor(log.mood_level)}</div>
                  <div className="flex-1">
                    {log.note && <p className="leading-snug">{log.note}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
