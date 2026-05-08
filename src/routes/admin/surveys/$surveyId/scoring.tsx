import { createFileRoute, useParams, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InlineLoader } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/surveys/$surveyId/scoring")({
  component: ScoringConfigPage,
});

interface Survey {
  id: string;
  title: string;
}

interface ScoringConfig {
  id: string;
  min_score: number;
  max_score: number;
  recommendation_text: string;
}

function ScoringConfigPage() {
  const { surveyId } = useParams({ from: "/admin/surveys/$surveyId/scoring" });
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [minScore, setMinScore] = useState("0");
  const [maxScore, setMaxScore] = useState("100");
  const [recommendation, setRecommendation] = useState("");

  useEffect(() => {
    fetchData();
  }, [surveyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch survey
      const { data: surveyData } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", surveyId)
        .single();

      if (surveyData) {
        setSurvey(surveyData);
      }

      // Fetch scoring config
      const { data: configData } = await supabase
        .from("survey_scoring_config")
        .select("*")
        .eq("survey_id", surveyId)
        .single();

      if (configData) {
        setConfig(configData);
        setMinScore(String(configData.min_score));
        setMaxScore(String(configData.max_score));
        setRecommendation(configData.recommendation_text || "");
      }
    } catch (error) {
      console.error("[v0] Error fetching data:", error);
      toast.error("Failed to load survey data");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    const min = parseInt(minScore);
    const max = parseInt(maxScore);

    if (isNaN(min) || isNaN(max) || min >= max) {
      toast.error("Min score must be less than max score");
      return;
    }

    if (!recommendation.trim()) {
      toast.error("Please enter a recommendation");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("survey_scoring_config")
        .update({
          min_score: min,
          max_score: max,
          recommendation_text: recommendation.trim(),
        })
        .eq("id", config.id);

      if (error) throw error;
      toast.success("Scoring configuration saved!");
      navigate({ to: "/admin/surveys" });
    } catch (error) {
      console.error("[v0] Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <InlineLoader />;

  if (!survey || !config) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground/60">Survey not found</p>
        <Link to="/admin/surveys">
          <Button className="mt-4">Back to Surveys</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/admin/surveys">
          <button className="text-sm text-muted-foreground/40 hover:text-lamp transition-colors">
            ← Back
          </button>
        </Link>
        <header>
          <h1 className="font-display text-4xl text-ink sm:text-5xl">
            Configure Scoring
          </h1>
          <p className="text-muted-foreground/60 mt-2">{survey.title}</p>
        </header>
      </div>

      <Card className="glass-card p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-2">
              Minimum Score
            </label>
            <Input
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="bg-glass border-glass-border/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-2">
              Maximum Score
            </label>
            <Input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="bg-glass border-glass-border/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-2">
            Recommendation Text *
          </label>
          <p className="text-xs text-muted-foreground/50 mb-2">
            This message is shown to users after they complete the survey
          </p>
          <Textarea
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            placeholder="e.g., Based on your responses, we recommend exploring mindfulness techniques..."
            rows={5}
            className="bg-glass border-glass-border/50"
          />
        </div>

        <div className="bg-lamp/5 border border-lamp/10 rounded-lg p-4">
          <p className="text-sm text-muted-foreground/70">
            <strong>Note:</strong> Advanced scoring with multiple score ranges coming soon. Currently, all users see the same recommendation based on completing the survey.
          </p>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4 pb-8">
        <Link to="/admin/surveys">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? "Saving…" : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
