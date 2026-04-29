import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const tiles = [
    { to: "/dashboard/journal", title: "Journal", desc: "Write your thoughts." },
    { to: "/dashboard/mood", title: "Mood Log", desc: "Log how you're feeling." },
    { to: "/dashboard/surveys", title: "Surveys", desc: "Coming soon." },
    { to: "/dashboard/chatbot", title: "Chatbot", desc: "Coming soon." },
  ] as const;

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Welcome back</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to}>
            <Card className="transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
