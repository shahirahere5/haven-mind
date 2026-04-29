import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { session, loading, signOut, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const navItems: Array<{ to: string; label: string; exact?: boolean }> = [
    { to: "/dashboard", label: "Home", exact: true },
    { to: "/dashboard/journal", label: "Journal" },
    { to: "/dashboard/mood", label: "Mood Log" },
    { to: "/dashboard/surveys", label: "Surveys" },
    { to: "/dashboard/chatbot", label: "Chatbot" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Mindful</h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/dashboard"}
              activeOptions={{ exact: item.exact ?? false }}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
