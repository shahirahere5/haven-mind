import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { InlineLoader } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, ClipboardList, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

interface AdminStats {
  totalUsers: number;
  totalSurveys: number;
  totalResponses: number;
  totalInsights: number;
}

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSurveys: 0,
    totalResponses: 0,
    totalInsights: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        // Get total users
        const { count: usersCount } = await supabase
          .from("Profiles")
          .select("id", { count: "exact", head: true });

        // Get total surveys
        const { count: surveysCount } = await supabase
          .from("surveys")
          .select("id", { count: "exact", head: true })
          .eq("admin_id", user.id);

        // Get total responses
        const { count: responsesCount } = await supabase
          .from("survey_responses")
          .select("id", { count: "exact", head: true });

        // Get total insights
        const { count: insightsCount } = await supabase
          .from("admin_insights")
          .select("id", { count: "exact", head: true })
          .eq("admin_id", user.id);

        setStats({
          totalUsers: usersCount || 0,
          totalSurveys: surveysCount || 0,
          totalResponses: responsesCount || 0,
          totalInsights: insightsCount || 0,
        });
      } catch (error) {
        console.error("[v0] Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <InlineLoader />;

  const StatCard = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: typeof Users;
    label: string;
    value: number;
  }) => (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground/50 mb-2">{label}</p>
          <p className="font-display text-3xl text-ink">{value}</p>
        </div>
        <Icon className="h-12 w-12 text-lamp/30" />
      </div>
    </Card>
  );

  return (
    <div className="space-y-12 animate-fade-in">
      <header>
        <h1 className="font-display text-5xl text-ink sm:text-6xl leading-[1.1]">
          Admin Dashboard
        </h1>
        <p className="mt-4 text-muted-foreground/60">
          Overview of your platform statistics and management tools.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
        <StatCard icon={ClipboardList} label="Total Surveys" value={stats.totalSurveys} />
        <StatCard icon={BarChart3} label="Total Responses" value={stats.totalResponses} />
        <StatCard icon={Lightbulb} label="Total Insights" value={stats.totalInsights} />
      </div>

      <div className="glass-card p-8">
        <h2 className="font-display text-2xl text-ink mb-4">Quick Start</h2>
        <div className="space-y-3 text-muted-foreground/60">
          <p>👉 Start by creating a survey in the &ldquo;Surveys&rdquo; section</p>
          <p>📊 Configure scoring rules for each survey</p>
          <p>💡 Add insights and articles in the &ldquo;Insights&rdquo; section</p>
          <p>📈 Monitor user responses and survey engagement</p>
        </div>
      </div>
    </div>
  );
}
