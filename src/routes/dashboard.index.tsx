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
  note: string | null;
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
  const [showRecs, setShowRecs] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("Profiles").select("name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName(data?.name ?? ""));
    Promise.all([
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("mood_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([j, m]) => setStats({ entries: j.count ?? 0, moods: m.count ?? 0 }));

    supabase.from("journal_entries").select("text, created_at").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setLastEntry(data));
    supabase.from("mood_logs").select("mood_level, note, created_at").eq("user_id", user.id)
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

  const links: Array<{ to: string; label: string; sub: string; icon: string }> = [
    { to: "/dashboard/journal", label: "Open Journal", sub: "Write your thoughts freely", icon: "✍️" },
    { to: "/dashboard/mood", label: "Log Mood", sub: "Check in with how you feel", icon: "🌤️" },
    { to: "/dashboard/surveys", label: "Reflections", sub: "Gentle self-assessment", icon: "💭" },
  ];

  return (
    <div className="space-y-16">
      {/* Welcome */}
      <section className="animate-rise">
        <p className="smallcaps text-muted-foreground/50 mb-2">{today}</p>
        <h1 className="font-display text-5xl text-ink sm:text-6xl leading-[1.1]">
          Welcome back{name ? ", " : ""}
          {name && <span className="gradient-text">{name}</span>}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground/60">
          Take a moment. You're in your space now.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 animate-slow">
        <StatCard label="Journal Entries" value={stats.entries} />
        <StatCard label="Mood Logs" value={stats.moods} />
        <StatCard label="Last Mood" value={lastMood ? MOODS[lastMood.mood_level ?? 0] ?? "—" : "—"} />
        <StatCard label="Suggestions" value={recs.length} />
      </section>

      {/* Recommendations — expandable */}
      {recs.length > 0 && (
        <section className="animate-slow">
          <button
            onClick={() => setShowRecs(!showRecs)}
            className="glass-card w-full text-left transition-all duration-300 hover:shadow-glow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="smallcaps text-lamp/60 mb-2">Gentle Suggestions</p>
                <p className="font-display text-xl text-ink/80">
                  You have {recs.length} suggestion{recs.length > 1 ? "s" : ""} waiting
                </p>
              </div>
              <span className="text-2xl text-muted-foreground/40 transition-transform duration-300" style={{ transform: showRecs ? "rotate(180deg)" : "rotate(0)" }}>
                ↓
              </span>
            </div>
          </button>
          {showRecs && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {recs.map((rec, i) => (
                <div key={i} className="glass-card">
                  <p className="text-foreground/80" style={{ lineHeight: "1.7" }}>"{rec.message}"</p>
                  <p className="mt-3 text-xs text-muted-foreground/40">
                    {rec.type === "journal-sentiment" ? "From your journal" : "From your mood"} · {new Date(rec.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recent activity */}
      {(lastEntry || lastMood) && (
        <section className="grid gap-4 sm:grid-cols-2 animate-slow">
          {lastEntry && (
            <div className="glass-card">
              <p className="smallcaps text-teal/60 mb-3">Latest Journal</p>
              <p className="text-foreground/70" style={{ lineHeight: "1.7" }}>
                {(lastEntry.text ?? "").slice(0, 140)}{(lastEntry.text ?? "").length > 140 ? "…" : ""}
              </p>
              <p className="mt-3 text-xs text-muted-foreground/30">
                {new Date(lastEntry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            </div>
          )}
          {lastMood && (
            <div className="glass-card">
              <p className="smallcaps text-lamp/60 mb-3">Latest Mood</p>
              <p className="font-display text-2xl text-ink/80">
                {MOODS[lastMood.mood_level ?? 0] ?? "—"}
              </p>
              {lastMood.note && (
                <p className="mt-2 text-sm text-foreground/50">{lastMood.note}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground/30">
                {new Date(lastMood.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Quick links */}
      <section className="grid gap-4 sm:grid-cols-3 animate-slow">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to as "/dashboard"}
            className="glass-card group transition-all duration-300 hover:shadow-glow"
          >
            <p className="text-3xl mb-4">{l.icon}</p>
            <p className="font-display text-xl text-ink transition-colors duration-300 group-hover:gradient-text">
              {l.label}
            </p>
            <p className="mt-2 text-sm text-muted-foreground/50">{l.sub}</p>
          </Link>
        ))}
      </section>

      {/* Insights preview */}
      <section className="glass-card animate-slow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="smallcaps text-teal/60 mb-1">Insights</p>
            <p className="font-display text-2xl text-ink">Explore helpful articles</p>
          </div>
          <Link to="/insights" className="smallcaps text-lamp/60 transition-colors duration-300 hover:text-lamp">
            View All →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Managing Stress", desc: "Simple techniques for daily calm" },
            { title: "Benefits of Journaling", desc: "Why writing helps your mind" },
          ].map((item) => (
            <Link key={item.title} to="/insights" className="group rounded-xl p-4 transition-all duration-300" style={{ background: "var(--glass)" }}>
              <p className="font-display text-lg text-ink/80 transition-colors duration-300 group-hover:text-lamp">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground/40">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass-card text-center">
      <p className="font-display text-3xl text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground/50">{label}</p>
    </div>
  );
}
