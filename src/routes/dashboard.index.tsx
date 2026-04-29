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

  useEffect(() => {
    if (!user) return;
    supabase
      .from("Profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setName(data?.name ?? ""));
  }, [user]);

  const tiles = [
    {
      to: "/dashboard/journal",
      title: "Journal",
      desc: "Write what's on your mind. Your thoughts are safe here.",
      emoji: "📓",
    },
    {
      to: "/dashboard/mood",
      title: "Mood Log",
      desc: "How are you feeling today? Take your time.",
      emoji: "💗",
    },
    { to: "/dashboard/surveys", title: "Surveys", desc: "Coming soon.", emoji: "📋" },
    { to: "/dashboard/chatbot", title: "Chatbot", desc: "Coming soon.", emoji: "💬" },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="animate-rise">
        <h2 className="text-3xl font-semibold tracking-tight">
          Welcome back{name ? `, ${name}` : ""} 💛
        </h2>
        <p className="mt-2 text-muted-foreground">A gentle space for your day.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t, i) => (
          <Link key={t.to} to={t.to} style={{ animationDelay: `${i * 60}ms` }} className="animate-rise">
            <Card className="border-0 bg-card/70 backdrop-blur-sm shadow-soft transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span className="text-2xl">{t.emoji}</span>
                  {t.title}
                </CardTitle>
                <CardDescription>{t.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
