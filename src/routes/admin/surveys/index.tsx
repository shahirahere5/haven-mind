import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { InlineLoader } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Settings } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/surveys/")({
  component: AdminSurveysPage,
});

interface Survey {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  question_count?: number;
  response_count?: number;
}

function AdminSurveysPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchSurveys();
  }, [user]);

  const fetchSurveys = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("surveys")
        .select("*")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        // Fetch question and response counts
        const surveysWithCounts = await Promise.all(
          (data as any[]).map(async (survey) => {
            const { count: qCount } = await supabase
              .from("survey_questions")
              .select("id", { count: "exact", head: true })
              .eq("survey_id", survey.id);

            const { count: rCount } = await supabase
              .from("survey_responses")
              .select("id", { count: "exact", head: true })
              .eq("survey_id", survey.id);

            return {
              ...survey,
              question_count: qCount || 0,
              response_count: rCount || 0,
            };
          })
        );
        setSurveys(surveysWithCounts);
      }
    } catch (error) {
      console.error("[v0] Error fetching surveys:", error);
      toast.error("Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  const deleteSurvey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this survey?")) return;

    setDeleting(id);
    try {
      const { error } = await supabase.from("surveys").delete().eq("id", id);
      if (error) throw error;
      setSurveys(surveys.filter((s) => s.id !== id));
      toast.success("Survey deleted");
    } catch (error) {
      console.error("[v0] Error deleting survey:", error);
      toast.error("Failed to delete survey");
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (survey: Survey) => {
    try {
      const { error } = await supabase
        .from("surveys")
        .update({ is_active: !survey.is_active })
        .eq("id", survey.id);

      if (error) throw error;
      setSurveys(
        surveys.map((s) =>
          s.id === survey.id ? { ...s, is_active: !s.is_active } : s
        )
      );
      toast.success(
        survey.is_active ? "Survey deactivated" : "Survey activated"
      );
    } catch (error) {
      console.error("[v0] Error updating survey:", error);
      toast.error("Failed to update survey");
    }
  };

  if (loading) return <InlineLoader />;

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="font-display text-5xl text-ink sm:text-6xl leading-[1.1]">
            Manage Surveys
          </h1>
          <p className="mt-4 text-muted-foreground/60">
            Create, edit, and manage your surveys.
          </p>
        </header>
        <Link to="/admin/surveys/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Survey</span>
          </Button>
        </Link>
      </div>

      {surveys.length === 0 ? (
        <Card className="glass-card p-8 text-center">
          <p className="text-muted-foreground/60 mb-4">
            No surveys yet. Create your first survey to get started.
          </p>
          <Link to="/admin/surveys/create">
            <Button>Create First Survey</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey) => (
            <Card key={survey.id} className="glass-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-xl text-ink">{survey.title}</h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        survey.is_active
                          ? "bg-teal/20 text-teal/80"
                          : "bg-muted/20 text-muted-foreground/50"
                      }`}
                    >
                      {survey.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {survey.description && (
                    <p className="text-sm text-muted-foreground/50 mb-3">
                      {survey.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground/40">
                    <span>{survey.question_count} questions</span>
                    <span>•</span>
                    <span>{survey.response_count} responses</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => toggleActive(survey)}
                    className="px-3 py-1.5 rounded-lg bg-glass hover:bg-glass/80 transition-colors text-sm text-muted-foreground/60 hover:text-lamp flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {survey.is_active ? "Hide" : "Show"}
                    </span>
                  </button>
                  <Link to={`/admin/surveys/${survey.id}/scoring`}>
                    <button className="px-3 py-1.5 rounded-lg bg-glass hover:bg-glass/80 transition-colors text-sm text-muted-foreground/60 hover:text-lamp flex items-center gap-1">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Config</span>
                    </button>
                  </Link>
                  <Link to={`/admin/surveys/${survey.id}/edit`}>
                    <button className="px-3 py-1.5 rounded-lg bg-glass hover:bg-glass/80 transition-colors text-sm text-muted-foreground/60 hover:text-lamp flex items-center gap-1">
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  </Link>
                  <button
                    onClick={() => deleteSurvey(survey.id)}
                    disabled={deleting === survey.id}
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
