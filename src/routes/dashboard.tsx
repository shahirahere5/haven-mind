import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
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
    { to: "/dashboard/surveys", label: "Reflections" },
    { to: "/dashboard/chatbot", label: "Companion" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-8 py-7">
          <Link to="/dashboard" className="font-display text-2xl italic text-ink">
            MindHaven
          </Link>
          <div className="flex items-center gap-6">
            <span className="hidden text-xs italic text-muted-foreground sm:inline">
              {name ? name : user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="smallcaps text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-8 overflow-x-auto px-8 pb-5">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/dashboard"}
              activeOptions={{ exact: item.exact ?? false }}
              className="smallcaps text-muted-foreground/70 transition-colors hover:text-foreground data-[status=active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-16 animate-fade-in">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
