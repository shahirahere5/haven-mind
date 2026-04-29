import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/mood")({
  component: MoodPage,
});

interface MoodLog {
  id: string;
  mood_level: number | null;
  note: string | null;
  created_at: string;
}

const MOOD_LABELS: Record<number, string> = {
  1: "😢",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

function MoodPage() {
  const { user } = useAuth();
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await load();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>How are you feeling?</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMood(n)}
                  className={`flex h-14 w-14 items-center justify-center rounded-md border text-2xl transition-colors ${
                    mood === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                  aria-label={`Mood ${n}`}
                >
                  {MOOD_LABELS[n]}
                </button>
              ))}
            </div>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting || mood === null}>
              {submitting ? "Saving…" : "Log mood"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Recent moods</h3>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="text-muted-foreground">No mood logs yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="flex items-center gap-4 pt-4">
                  <div className="text-3xl">
                    {log.mood_level ? MOOD_LABELS[log.mood_level] : "—"}
                  </div>
                  <div className="flex-1">
                    {log.note && <p>{log.note}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
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
