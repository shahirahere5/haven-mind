import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user } = useAuth();
  const [name, setName] = useState<string>("");
  const [stats, setStats] = useState({ entries: 0, moods: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("Profiles").select("name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName(data?.name ?? ""));
    Promise.all([
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("mood_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([j, m]) => setStats({ entries: j.count ?? 0, moods: m.count ?? 0 }));
  }, [user]);

  const tiles = [
    { to: "/dashboard/journal", title: "Journal", desc: "Write what's on your mind. Your thoughts are safe here.", emoji: "📓", tint: "from-[oklch(0.92_0.07_295)] to-[oklch(0.95_0.05_265)]" },
    { to: "/dashboard/mood", title: "Mood Log", desc: "How are you feeling today? Take your time.", emoji: "💗", tint: "from-[oklch(0.93_0.07_25)] to-[oklch(0.95_0.05_50)]" },
    { to: "/dashboard/surveys", title: "Surveys", desc: "Reflect with gentle questions.", emoji: "📋", tint: "from-[oklch(0.92_0.07_165)] to-[oklch(0.95_0.05_200)]" },
    { to: "/dashboard/chatbot", title: "Chatbot", desc: "Coming soon.", emoji: "💬", tint: "from-[oklch(0.92_0.07_220)] to-[oklch(0.95_0.05_295)]" },
  ] as const;

  return (
    <div className="space-y-12">
      <div className="animate-rise">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h2 className="mt-3 font-display text-5xl font-semibold tracking-tight">
          Welcome back{name ? <>, <span className="text-gradient">{name}</span></> : ""} 💛
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">A gentle space for your day. How are you, really?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl glass shadow-soft p-6 animate-rise">
          <p className="text-sm text-muted-foreground">Journal entries</p>
          <p className="mt-1 font-display text-4xl font-semibold text-gradient">{stats.entries}</p>
        </div>
        <div className="rounded-2xl glass shadow-soft p-6 animate-rise" style={{ animationDelay: "60ms" }}>
          <p className="text-sm text-muted-foreground">Moods logged</p>
          <p className="mt-1 font-display text-4xl font-semibold text-gradient">{stats.moods}</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {tiles.map((t, i) => (
          <Link key={t.to} to={t.to} style={{ animationDelay: `${i * 70}ms` }} className="animate-rise group">
            <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${t.tint} shadow-soft transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-glow`}>
              <div className="absolute -right-6 -top-6 text-7xl opacity-20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">{t.emoji}</div>
              <CardHeader className="relative">
                <CardTitle className="font-display text-2xl font-semibold">{t.title}</CardTitle>
                <CardDescription className="text-foreground/70">{t.desc}</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <span className="text-sm font-medium text-foreground/80 transition-colors group-hover:text-foreground">Open →</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
