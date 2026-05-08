import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { InlineLoader } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/insights/")({
  component: AdminInsightsPage,
});

interface Insight {
  id: string;
  title: string;
  content: string;
  category: string | null;
  published: boolean;
  created_at: string;
}

function AdminInsightsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchInsights();
  }, [user]);

  const fetchInsights = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("admin_insights")
        .select("*")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false });

      setInsights((data as Insight[]) || []);
    } catch (error) {
      console.error("[v0] Error fetching insights:", error);
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  const deleteInsight = async (id: string) => {
    if (!confirm("Are you sure you want to delete this insight?")) return;

    setDeleting(id);
    try {
      const { error } = await supabase
        .from("admin_insights")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setInsights(insights.filter((i) => i.id !== id));
      toast.success("Insight deleted");
    } catch (error) {
      console.error("[v0] Error deleting insight:", error);
      toast.error("Failed to delete insight");
    } finally {
      setDeleting(null);
    }
  };

  const togglePublished = async (insight: Insight) => {
    try {
      const { error } = await supabase
        .from("admin_insights")
        .update({ published: !insight.published })
        .eq("id", insight.id);

      if (error) throw error;
      setInsights(
        insights.map((i) =>
          i.id === insight.id ? { ...i, published: !i.published } : i
        )
      );
      toast.success(
        insight.published ? "Insight unpublished" : "Insight published"
      );
    } catch (error) {
      console.error("[v0] Error updating insight:", error);
      toast.error("Failed to update insight");
    }
  };

  if (loading) return <InlineLoader />;

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="font-display text-5xl text-ink sm:text-6xl leading-[1.1]">
            Manage Insights
          </h1>
          <p className="mt-4 text-muted-foreground/60">
            Create and manage articles and insights for your users.
          </p>
        </header>
        <Link to="/admin/insights/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Insight</span>
          </Button>
        </Link>
      </div>

      {insights.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <p className="text-muted-foreground/60 mb-4">
            No insights yet. Create your first insight to get started.
          </p>
          <Link to="/admin/insights/create">
            <Button>Create First Insight</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id} className="glass-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-xl text-ink">{insight.title}</h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        insight.published
                          ? "bg-teal/20 text-teal/80"
                          : "bg-muted/20 text-muted-foreground/50"
                      }`}
                    >
                      {insight.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  {insight.category && (
                    <p className="text-sm text-muted-foreground/50 mb-3">
                      Category: {insight.category}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground/60 line-clamp-2">
                    {insight.content}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => togglePublished(insight)}
                    className="px-3 py-1.5 rounded-lg bg-glass hover:bg-glass/80 transition-colors text-sm text-muted-foreground/60 hover:text-lamp flex items-center gap-1"
                  >
                    {insight.published ? (
                      <>
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Published</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span className="hidden sm:inline">Draft</span>
                      </>
                    )}
                  </button>
                  <Link to={`/admin/insights/${insight.id}/edit`}>
                    <button className="px-3 py-1.5 rounded-lg bg-glass hover:bg-glass/80 transition-colors text-sm text-muted-foreground/60 hover:text-lamp flex items-center gap-1">
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  </Link>
                  <button
                    onClick={() => deleteInsight(insight.id)}
                    disabled={deleting === insight.id}
                    className="px-3 py-1.5 rounded-lg bg-glass hover:bg-glass/80 transition-colors text-sm text-muted-foreground/60 hover:text-red-400 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
