import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { InlineLoader } from "@/components/PageLoader";
import { ScorePopup } from "@/components/ScorePopup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { History, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard/surveys")({
  component: SurveysPage,
});

interface Survey {
  id: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
}

interface Question {
  id: string;
  survey_id: string;
  question_type: string;
  question_text: string;
  is_optional: boolean;
}

interface SurveyHistory {
  id: string;
  survey_id: string;
  total_score: number;
  survey_date: string;
  recommendations: string;
  survey?: { title: string };
}

interface ScoringConfig {
  min_score: number;
  max_score: number;
  recommendation_text: string;
}

const SCALE_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Rarely" },
  { value: 2, label: "Sometimes" },
  { value: 3, label: "Often" },
  { value: 4, label: "Nearly always" },
];

function SurveysPage() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [questions, setQuestions] = useState<Record<string, Question[]>>({});
  const [scoring, setScoring] = useState<Record<string, ScoringConfig>>({});
  const [history, setHistory] = useState<SurveyHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [lastScore, setLastScore] = useState({ score: 0, max: 0, recommendation: "", survey: "" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: surveysData } = await supabase
        .from("surveys")
        .select("id, title, description, is_active")
        .eq("is_active", true);

      const { data: qData } = await supabase
        .from("survey_questions")
        .select("id, survey_id, question_type, question_text, is_optional");

      const { data: scoringData } = await supabase
        .from("survey_scoring_config")
        .select("survey_id, min_score, max_score, recommendation_text");

      const grouped: Record<string, Question[]> = {};
      const scoringMap: Record<string, ScoringConfig> = {};

      (qData ?? []).forEach((q) => {
        if (!grouped[q.survey_id]) grouped[q.survey_id] = [];
        grouped[q.survey_id].push(q as Question);
      });

      (scoringData ?? []).forEach((s) => {
        scoringMap[s.survey_id] = {
          min_score: s.min_score,
          max_score: s.max_score,
          recommendation_text: s.recommendation_text,
        };
      });

      setSurveys((surveysData as Survey[]) ?? []);
      setQuestions(grouped);
      setScoring(scoringMap);

      if (user) {
        const { data: historyData } = await supabase
          .from("survey_history")
          .select("id, survey_id, total_score, survey_date, recommendations")
          .eq("user_id", user.id)
          .order("survey_date", { ascending: false });

        setHistory((historyData as SurveyHistory[]) ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  const open = (id: string) => {
    setOpenId(id);
    setAnswers({});
    setMessage(null);
  };

  const submit = async (survey: Survey) => {
    if (!user) return;
    const qs = questions[survey.id] ?? [];
    const requiredQuestions = qs.filter((q) => !q.is_optional);
    const allAnswered = requiredQuestions.every(
      (q) => answers[q.id] !== undefined && answers[q.id] !== ""
    );

    if (!allAnswered) {
      setMessage("Please answer all required questions.");
      return;
    }

    setSubmitting(true);
    try {
      const scaleAnswers = qs
        .filter((q) => q.question_type === "scale")
        .map((q) => Number(answers[q.id] ?? 0));

      const score = scaleAnswers.length > 0
        ? Math.round(scaleAnswers.reduce((a, b) => a + b, 0))
        : 0;

      const scoringConfig = scoring[survey.id];
      const maxScore = scoringConfig?.max_score || 100;

      const payload = qs.map((q) => ({
        question_id: q.id,
        question_text: q.question_text,
        type: q.question_type,
        answer: answers[q.id],
      }));

      // Save response
      const { error: responseError } = await supabase
        .from("survey_responses")
        .insert({
          user_id: user.id,
          survey_id: survey.id,
          response_data: payload,
        });

      if (responseError) throw responseError;

      // Save to history with recommendations
      const recommendation =
        scoringConfig?.recommendation_text ||
        "Thank you for completing this survey.";

      const { error: historyError } = await supabase
        .from("survey_history")
        .insert({
          user_id: user.id,
          survey_id: survey.id,
          total_score: score,
          recommendations: recommendation,
        });

      if (historyError) throw historyError;

      // Update local history
      setHistory([
        {
          id: `temp_${Date.now()}`,
          survey_id: survey.id,
          total_score: score,
          survey_date: new Date().toISOString(),
          recommendations: recommendation,
        },
        ...history,
      ]);

      // Show score popup
      setLastScore({
        score,
        max: maxScore,
        recommendation,
        survey: survey.title || "Survey",
      });
      setShowScorePopup(true);

      setTimeout(() => {
        setOpenId(null);
        setAnswers({});
      }, 3000);
    } catch (error) {
      console.error("[v0] Error submitting survey:", error);
      setMessage("Failed to save response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <InlineLoader />;

  const openSurvey = surveys.find((s) => s.id === openId);

  if (openSurvey) {
    const qs = questions[openSurvey.id] ?? [];
    return (
      <div className="space-y-12 animate-fade-in">
        <header>
          <button
            onClick={() => setOpenId(null)}
            className="text-sm text-muted-foreground/40 transition-colors duration-300 hover:text-lamp mb-6"
          >
            ← Back
          </button>
          <h1 className="font-display text-4xl text-ink sm:text-5xl">{openSurvey.title}</h1>
          {openSurvey.description && (
            <p className="mt-4 text-muted-foreground/50" style={{ lineHeight: "1.8" }}>
              {openSurvey.description}
            </p>
          )}
        </header>

        <div className="space-y-6">
          {qs.map((q, i) => (
            <div key={q.id} className="glass-card animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start gap-4 mb-4">
                <span className="text-sm font-medium text-lamp/60">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1">
                  <p className="font-display text-xl text-ink/90" style={{ lineHeight: "1.5" }}>
                    {q.question_text}
                  </p>
                  {q.is_optional && (
                    <p className="text-xs text-muted-foreground/50 mt-1">Optional</p>
                  )}
                </div>
              </div>
              {q.question_type === "scale" ? (
                <div className="ml-8 flex flex-wrap gap-3">
                  {SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                      className={`rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                        answers[q.id] === opt.value
                          ? "text-primary-foreground"
                          : "text-muted-foreground/60 hover:text-foreground/80"
                      }`}
                      style={answers[q.id] === opt.value ? { background: "var(--gradient-primary)" } : { background: "var(--glass)" }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  rows={3}
                  placeholder="Share your thoughts…"
                  className="ml-8 w-[calc(100%-2rem)] resize-none rounded-xl border-0 px-4 py-3 text-foreground/85 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0"
                  style={{ background: "var(--glass)", caretColor: "var(--lamp)", lineHeight: "1.8" }}
                />
              )}
            </div>
          ))}
        </div>

        {message && (
          <p className="text-center text-sm text-amber-600 animate-fade-in">{message}</p>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setOpenId(null)}
            className="text-sm text-muted-foreground/40 transition-colors duration-300 hover:text-lamp"
          >
            Cancel
          </button>
          <button
            onClick={() => submit(openSurvey)}
            disabled={submitting}
            className="rounded-xl px-6 py-2.5 font-medium text-primary-foreground transition-all duration-300 disabled:opacity-30"
            style={{ background: "var(--gradient-primary)" }}
          >
            {submitting ? "Saving…" : "Submit"}
          </button>
        </div>

        <ScorePopup
          open={showScorePopup}
          onOpenChange={setShowScorePopup}
          score={lastScore.score}
          maxScore={lastScore.max}
          recommendation={lastScore.recommendation}
          surveyTitle={lastScore.survey}
        />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <header className="animate-rise">
        <p className="smallcaps text-lamp/60 mb-4">Self-Reflection</p>
        <h1 className="font-display text-5xl text-ink sm:text-6xl leading-[1.1]">
          Reflections
        </h1>
        <p className="mt-4 text-muted-foreground/60" style={{ lineHeight: "1.8" }}>
          Gentle assessments to help you understand yourself better.
        </p>
      </header>

      <Tabs defaultValue="surveys" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-glass border border-glass-border/30">
          <TabsTrigger value="surveys">Available</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="surveys" className="space-y-4 animate-slow mt-6">
          {surveys.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <p className="text-muted-foreground/60">No surveys available yet.</p>
            </Card>
          ) : (
            surveys.map((s, i) => {
              const count = (questions[s.id] ?? []).length;
              return (
                <button
                  key={s.id}
                  onClick={() => open(s.id)}
                  className="glass-card group block w-full text-left transition-all duration-300 hover:shadow-glow"
                >
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <p className="font-display text-2xl text-ink/80 transition-colors duration-300 group-hover:gradient-text sm:text-3xl">
                        {s.title}
                      </p>
                      {s.description && (
                        <p className="mt-2 text-sm text-muted-foreground/40">{s.description}</p>
                      )}
                    </div>
                    <span className="smallcaps whitespace-nowrap text-muted-foreground/30">
                      {count} Q{count !== 1 ? "&apos;s" : ""}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 animate-slow mt-6">
          {history.length === 0 ? (
            <Card className="glass-card p-8 text-center">
              <p className="text-muted-foreground/60">
                No survey history yet. Complete a survey to see your results here.
              </p>
            </Card>
          ) : (
            history.map((item) => {
              const survey = surveys.find((s) => s.id === item.survey_id);
              const date = new Date(item.survey_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <Card key={item.id} className="glass-card p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-display text-lg text-ink">
                          {survey?.title || "Survey"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground/50 mt-1">
                          <Clock className="h-4 w-4" />
                          <span>{date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl text-lamp">
                          {item.total_score}
                        </p>
                      </div>
                    </div>
                    <div className="bg-lamp/5 border border-lamp/10 rounded-lg p-3">
                      <p className="text-xs font-medium text-ink/70 mb-1">
                        Recommendation
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        {item.recommendations}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
