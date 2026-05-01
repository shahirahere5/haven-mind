import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  const links: Array<{ to: string; label: string; sub: string }> = [
    { to: "/dashboard/journal", label: "Open the journal", sub: "Write what you couldn't say out loud." },
    { to: "/dashboard/mood", label: "Notice the mood", sub: "A small pause to see how you are." },
    { to: "/dashboard/surveys", label: "Sit with a reflection", sub: "Five gentle ways of asking." },
  ];

  return (
    <div className="space-y-20">
      <section className="animate-rise">
        <p className="smallcaps text-muted-foreground">{today}</p>
        <h1 className="mt-6 font-display text-5xl italic text-ink sm:text-6xl">
          Welcome back{name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-6 max-w-xl text-lg italic text-muted-foreground">
          Take a moment. You're here now.
        </p>
      </section>

      <div className="rule" />

      <section className="grid gap-12 sm:grid-cols-3 animate-slow">
        <Stat label="Entries written" value={stats.entries} />
        <Stat label="Moods noticed" value={stats.moods} />
        <Stat label="Days kept" value={Math.max(stats.entries, stats.moods)} />
      </section>

      <div className="rule" />

      <section className="space-y-8 animate-slow">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to as "/dashboard"}
            className="group block border-b border-border/40 pb-8 transition-colors hover:border-foreground/40"
          >
            <p className="font-display text-3xl italic text-ink transition-colors group-hover:text-lamp">
              {l.label} <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground">{l.sub}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="smallcaps text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-5xl italic text-ink">{value}</p>
    </div>
  );
}
