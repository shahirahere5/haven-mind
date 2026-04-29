import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/journal")({
  component: JournalPage,
});

interface Entry {
  id: string;
  text: string | null;
  created_at: string;
}

function JournalPage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("journal_entries")
      .select("id, text, created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setEntries(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase
      .from("journal_entries")
      .insert({ user_id: user.id, text: text.trim() });
    if (error) {
      setError(error.message);
    } else {
      setText("");
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
          <CardTitle>What's on your mind?</CardTitle>
          <CardDescription>Take your time. Your thoughts are safe here.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write freely…"
              rows={6}
              required
              className="resize-none rounded-xl bg-background/70 transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            {error && <p className="text-sm text-destructive animate-fade-in">{error}</p>}
            {success && (
              <p className="text-sm text-primary animate-fade-in">Saved 💛</p>
            )}
            <Button
              type="submit"
              disabled={submitting || !text.trim()}
              className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? "Saving…" : "Save entry"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Past entries</h3>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground">No entries yet. Start when you're ready.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <Card
                key={entry.id}
                className="border-0 bg-card/70 backdrop-blur-sm shadow-soft animate-rise"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <CardContent className="pt-5">
                  <p className="whitespace-pre-wrap leading-relaxed">{entry.text}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
