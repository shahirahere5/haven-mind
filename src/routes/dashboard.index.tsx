import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

interface RecentEntry {
  text: string | null;
  created_at: string;
}
interface RecentMood {
  mood_level: number | null;
  created_at: string;
}
interface Recommendation {
  message: string;
  type: string;
  created_at: string;
}

function DashboardHome() {
  const { user } = useAuth();
  const [name, setName] = useState<string>("");
  const [stats, setStats] = useState({ entries: 0, moods: 0 });
  const [lastEntry, setLastEntry] = useState<RecentEntry | null>(null);
  const [lastMood, setLastMood] = useState<RecentMood | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("Profiles").select("name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName(data?.name ?? ""));
    Promise.all([
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("mood_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([j, m]) => setStats({ entries: j.count ?? 0, moods: m.count ?? 0 }));

    // Recent activity
    supabase.from("journal_entries").select("text, created_at").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setLastEntry(data));
    supabase.from("mood_logs").select("mood_level, created_at").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setLastMood(data));
    supabase.from("recommendations").select("message, type, created_at").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setRecs(data ?? []));
  }, [user]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  const MOODS: Record<number, string> = { 1: "Low", 2: "Quiet", 3: "Balanced", 4: "Light", 5: "Clear" };

  const links: Array<{ to: string; label: string; sub: string }> = [
    { to: "/dashboard/journal", label: "Open the journal", sub: "Write what you couldn't say out loud." },
    { to: "/dashboard/mood", label: "Notice the mood", sub: "A small pause to see how you are." },
    { to: "/dashboard/surveys", label: "Sit with a reflection", sub: "Five gentle ways of asking." },
  ];

  return (
    <div className="space-y-24">
      <section className="animate-rise text-center">
        <p className="smallcaps text-muted-foreground/50">{today}</p>
        <h1 className="mt-8 font-display text-6xl italic text-ink sm:text-7xl leading-[1.08]">
          Welcome back{name ? `,` : "."}<br />
          {name && <span className="text-lamp/80">{name}.</span>}
        </h1>
        <p className="mx-auto mt-8 max-w-md text-lg italic text-muted-foreground/60" style={{ lineHeight: "1.9" }}>
          Take a moment. You're here now.
        </p>
      </section>

      <section className="flex justify-center gap-20 animate-slow">
        <Stat label="Entries" value={stats.entries} />
        <Stat label="Moods" value={stats.moods} />
      </section>

      {/* Recommendations */}
      {recs.length > 0 && (
        <>
          <div className="rule" />
          <section className="animate-slow space-y-10">
            <p className="smallcaps text-muted-foreground/40 text-center mb-6">Gentle notes</p>
            {recs.map((rec, i) => (
              <div key={i} className="text-center">
                <p className="mx-auto max-w-lg font-display text-2xl italic text-ink/80" style={{ lineHeight: "1.7" }}>
                  "{rec.message}"
                </p>
                <p className="mt-3 text-xs italic text-muted-foreground/30">
                  {rec.type === "journal-sentiment" ? "From your journal" : "From your mood"} · {new Date(rec.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                </p>
              </div>
            ))}
          </section>
        </>
      )}

      {/* Recent activity */}
      {(lastEntry || lastMood) && (
        <>
          <div className="rule" />
          <section className="animate-slow space-y-10">
            <p className="smallcaps text-muted-foreground/40">Recent</p>
            {lastEntry && (
              <div>
                <p className="text-xs smallcaps text-muted-foreground/30 mb-2">Last journal entry</p>
                <p className="text-sm italic text-foreground/60" style={{ lineHeight: "1.8" }}>
                  {(lastEntry.text ?? "").slice(0, 160)}{(lastEntry.text ?? "").length > 160 ? "…" : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/25">
                  {new Date(lastEntry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
            )}
            {lastMood && (
              <div>
                <p className="text-xs smallcaps text-muted-foreground/30 mb-2">Last mood</p>
                <p className="font-display text-xl italic text-ink/70">
                  {MOODS[lastMood.mood_level ?? 0] ?? "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/25">
                  {new Date(lastMood.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
            )}
          </section>
        </>
      )}

      <div className="rule" />

      <section className="space-y-0 animate-slow">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to as "/dashboard"}
            className="group block py-10 transition-all duration-500"
          >
            <p className="font-display text-3xl italic text-ink/80 transition-all duration-500 group-hover:text-lamp sm:text-4xl">
              {l.label}
              <span className="ml-2 inline-block text-muted-foreground/30 transition-all duration-500 group-hover:translate-x-2 group-hover:text-lamp/50">→</span>
            </p>
            <p className="mt-3 text-sm italic text-muted-foreground/40">{l.sub}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-display text-5xl italic text-ink">{value}</p>
      <p className="mt-2 smallcaps text-muted-foreground/40">{label}</p>
    </div>
  );
}
