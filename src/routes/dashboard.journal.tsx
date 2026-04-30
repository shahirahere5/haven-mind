import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  { value: "joyful", emoji: "😊", label: "Joyful" },
  { value: "calm", emoji: "🌿", label: "Calm" },
  { value: "grateful", emoji: "🙏", label: "Grateful" },
  { value: "anxious", emoji: "😰", label: "Anxious" },
  { value: "sad", emoji: "😢", label: "Sad" },
  { value: "angry", emoji: "😠", label: "Angry" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "hopeful", emoji: "✨", label: "Hopeful" },
];

function emotionMeta(value: string | null) {
  return EMOTIONS.find((e) => e.value === value);
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
    if (!text.trim() || !user || !emotion) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase
      .from("journal_entries")
      .insert({ user_id: user.id, text: text.trim(), emotion });
    if (error) setError(error.message);
    else {
      setText(""); setEmotion("");
      setSuccess(true); setTimeout(() => setSuccess(false), 2200);
      await load();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-10">
      <div className="animate-rise">
        <h2 className="font-display text-4xl font-semibold tracking-tight">Your journal</h2>
        <p className="mt-2 text-muted-foreground">Pour out what's inside. No one else will see this.</p>
      </div>

      <Card className="border-0 glass shadow-soft animate-rise">
        <CardHeader>
          <CardTitle className="font-display text-2xl">What's on your mind?</CardTitle>
          <CardDescription>Take your time. There's no right or wrong.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">How does this entry feel?</Label>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((em) => (
                  <button
                    key={em.value}
                    type="button"
                    onClick={() => setEmotion(em.value)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all hover:-translate-y-0.5 ${
                      emotion === em.value
                        ? "border-primary bg-primary/15 text-foreground shadow-soft"
                        : "border-border/60 bg-background/60 text-muted-foreground"
                    }`}
                  >
                    <span className="text-base">{em.emoji}</span>
                    {em.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="entry" className="text-sm font-medium">Your thoughts</Label>
              <Textarea
                id="entry"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Today I feel…"
                rows={8}
                required
                maxLength={5000}
                className="resize-none rounded-2xl bg-background/70 text-base leading-relaxed transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
              />
              <p className="text-right text-xs text-muted-foreground">{text.length}/5000</p>
            </div>

            {error && <p className="text-sm text-destructive animate-fade-in">{error}</p>}
            {success && <p className="rounded-lg bg-primary/10 p-3 text-sm text-foreground animate-fade-in">Saved 💛 Thank you for sharing.</p>}

            <Button
              type="submit"
              disabled={submitting || !text.trim() || !emotion}
              className="w-full gradient-primary shadow-soft transition-transform hover:scale-[1.01] active:scale-[0.99] sm:w-auto"
              size="lg"
            >
              {submitting ? "Saving…" : "Save entry"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section>
        <h3 className="mb-5 font-display text-2xl font-semibold">Past entries</h3>
        {loading ? (
          <InlineLoader />
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-10 text-center text-muted-foreground">
            No entries yet. Start when you're ready 🌱
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, i) => {
              const em = emotionMeta(entry.emotion);
              return (
                <Card key={entry.id} className="border-0 glass shadow-soft animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
                  <CardContent className="pt-6">
                    <div className="mb-3 flex items-center justify-between">
                      {em ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
                          <span>{em.emoji}</span> {em.label}
                        </span>
                      ) : <span />}
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{entry.text}</p>
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
