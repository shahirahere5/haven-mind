import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/components/PageLoader";
import { Footer } from "@/components/Footer";
import { LayoutDashboard, ClipboardList, Lightbulb, BarChart3, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin/__layout")({
  component: AdminLayout,
});

interface UserProfile {
  role: string | null;
  name: string;
}

function AdminLayout() {
  const { session, loading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Check auth and admin role
  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth" });
    }
  }, [loading, session, navigate]);

  // Fetch user profile and check if admin
  useEffect(() => {
    if (!user) return;
    
    (async () => {
      const { data, error } = await supabase
        .from("Profiles")
        .select("name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[v0] Error fetching profile:", error);
      }

      const userProfile = data as UserProfile | null;
      setProfile(userProfile);

      // Redirect if not admin
      if (!userProfile || userProfile.role !== "admin") {
        navigate({ to: "/dashboard" });
      }
      setProfileLoading(false);
    })();
  }, [user, navigate]);

  if (loading || profileLoading || !session) {
    return <PageLoader label="Loading admin panel…" minMs={2000} />;
  }

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/surveys", label: "Surveys", icon: ClipboardList, exact: false },
    { to: "/admin/insights", label: "Insights", icon: Lightbulb, exact: false },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass border-b border-glass-border/30 sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <Link to="/admin" className="font-display text-2xl gradient-text">
            MindHaven Admin
          </Link>
          <div className="flex items-center gap-6">
            <span className="hidden text-sm text-muted-foreground/50 sm:inline">
              {profile?.name || user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 smallcaps text-muted-foreground/50 transition-colors duration-300 hover:text-lamp"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-8 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as "/admin"}
                activeOptions={{ exact: item.exact }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm smallcaps text-muted-foreground/40 hover:text-lamp data-[status=active]:bg-glass data-[status=active]:text-lamp"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-16 animate-fade-in">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
