import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/components/PageLoader";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { session, loading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("Profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setName(data?.name ?? null));
  }, [user]);

  if (loading || !session) return <PageLoader />;

  const navItems: Array<{ to: string; label: string; exact?: boolean }> = [
    { to: "/dashboard", label: "Home", exact: true },
    { to: "/dashboard/journal", label: "Journal" },
    { to: "/dashboard/mood", label: "Mood" },
    { to: "/dashboard/surveys", label: "Surveys" },
    { to: "/dashboard/chatbot", label: "Chatbot" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/40 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <span className="text-2xl transition-transform group-hover:scale-110">🌸</span>
            <span className="font-display text-2xl font-semibold text-gradient">MindHaven</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {name ? `Hi, ${name}` : user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => signOut()} className="rounded-full">
              Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pb-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/dashboard"}
              activeOptions={{ exact: item.exact ?? false }}
              className="rounded-full px-5 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground data-[status=active]:gradient-primary data-[status=active]:text-primary-foreground data-[status=active]:shadow-soft"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 animate-fade-in">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
