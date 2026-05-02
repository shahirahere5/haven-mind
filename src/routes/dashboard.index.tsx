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
