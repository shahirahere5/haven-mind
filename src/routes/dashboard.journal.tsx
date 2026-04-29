import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      await load();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting || !text.trim()}>
              {submitting ? "Saving…" : "Save entry"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Past entries</h3>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground">No entries yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-4">
                  <p className="whitespace-pre-wrap">{entry.text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
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
