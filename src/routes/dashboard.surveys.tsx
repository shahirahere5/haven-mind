import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { InlineLoader } from "@/components/PageLoader";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/dashboard/surveys")({
  component: SurveysPage,
});

interface Survey {
  id: string;
  title: string | null;
  description: string | null;
}
interface Question {
  id: string;
  survey_id: string;
  question_type: string;
  question_text: string;
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
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: surveysData } = await supabase.from("surveys").select("id, title, description");
      const { data: qData } = await supabase
        .from("survey_questions")
        .select("id, survey_id, question_type, question_text");
      const grouped: Record<string, Question[]> = {};
      (qData ?? []).forEach((q) => {
        if (!grouped[q.survey_id]) grouped[q.survey_id] = [];
        grouped[q.survey_id].push(q as Question);
      });
      setSurveys(surveysData ?? []);
      setQuestions(grouped);

      if (user) {
        const { data: resp } = await supabase
          .from("survey_responses")
          .select("survery_id")
          .eq("user_id", user.id);
        setCompleted(new Set((resp ?? []).map((r: any) => r.survery_id)));
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
    const allAnswered = qs.every((q) => answers[q.id] !== undefined && answers[q.id] !== "");
    if (!allAnswered) {
      setMessage("Some questions are still waiting for you.");
      return;
    }
    setSubmitting(true);
    const scaleAnswers = qs
      .filter((q) => q.question_type === "scale")
      .map((q) => Number(answers[q.id] ?? 0));
    const score =
      scaleAnswers.length > 0
        ? Math.round(scaleAnswers.reduce((a, b) => a + b, 0))
        : null;

    const payload = qs.map((q) => ({
      question_id: q.id,
      question_text: q.question_text,
      type: q.question_type,
      answer: answers[q.id],
    }));

    const { error } = await supabase.from("survey_responses").insert({
      user_id: user.id,
      survery_id: survey.id,
      answers: payload,
      score,
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Thank you for sitting with this.");
      setCompleted(new Set([...completed, survey.id]));
      setTimeout(() => {
        setOpenId(null);
        setMessage(null);
      }, 1600);
    }
    setSubmitting(false);
  };

  if (loading) return <InlineLoader />;

  const openSurvey = surveys.find((s) => s.id === openId);

  if (openSurvey) {
    const qs = questions[openSurvey.id] ?? [];
    return (
      <div className="space-y-16 animate-fade-in">
        <header>
          <button
            onClick={() => setOpenId(null)}
            className="smallcaps text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to reflections
          </button>
          <h1 className="mt-8 font-display text-5xl italic text-ink">{openSurvey.title}</h1>
          {openSurvey.description && (
            <p className="mt-4 max-w-xl italic text-muted-foreground">{openSurvey.description}</p>
          )}
        </header>

        <div className="space-y-16">
          {qs.map((q, i) => (
            <div key={q.id} className="space-y-5 animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-baseline gap-4">
                <span className="smallcaps text-muted-foreground/70">{String(i + 1).padStart(2, "0")}</span>
                <p className="font-display text-2xl italic text-ink">{q.question_text}</p>
              </div>
              {q.question_type === "scale" ? (
                <div className="ml-10 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                  {SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                      className={`font-display italic transition-colors ${
                        answers[q.id] === opt.value
                          ? "text-lamp underline decoration-lamp/40 underline-offset-8"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <Textarea
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  rows={4}
                  placeholder="Take your time…"
                  className="prose-journal ml-10 w-[calc(100%-2.5rem)] resize-none border-0 border-b border-border bg-transparent px-0 py-2 text-base placeholder:italic placeholder:text-muted-foreground/60 focus-visible:border-b-foreground/50 focus-visible:ring-0 focus-visible:outline-none shadow-none"
                />
              )}
            </div>
          ))}
        </div>

        {message && (
          <p className="border-l-2 border-primary/40 pl-4 text-sm italic text-foreground/80 animate-fade-in">
            {message}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border/40 pt-6">
          <button
            onClick={() => setOpenId(null)}
            className="smallcaps text-muted-foreground transition-colors hover:text-foreground"
          >
            Not now
          </button>
          <button
            onClick={() => submit(openSurvey)}
            disabled={submitting}
            className="smallcaps text-foreground transition-colors hover:text-lamp disabled:text-muted-foreground/40"
          >
            {submitting ? "Keeping…" : "Keep my answers"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-20">
      <header className="animate-rise">
        <p className="smallcaps text-muted-foreground">Reflections</p>
        <h1 className="mt-5 font-display text-5xl italic text-ink">Five careful questions.</h1>
        <p className="mt-4 max-w-xl italic text-muted-foreground">
          Each one is a quiet way of asking how you really are.
        </p>
      </header>

      <div className="space-y-2 animate-slow">
        {surveys.map((s, i) => {
          const done = completed.has(s.id);
          const count = (questions[s.id] ?? []).length;
          return (
            <button
              key={s.id}
              onClick={() => open(s.id)}
              className="group block w-full border-b border-border/40 py-8 text-left transition-colors hover:border-foreground/40"
            >
              <div className="flex items-baseline justify-between gap-6">
                <div>
                  <div className="flex items-baseline gap-4">
                    <span className="smallcaps text-muted-foreground/70">{String(i + 1).padStart(2, "0")}</span>
                    <p className="font-display text-3xl italic text-ink transition-colors group-hover:text-lamp">
                      {s.title}
                    </p>
                  </div>
                  {s.description && (
                    <p className="mt-2 max-w-xl pl-12 text-sm italic text-muted-foreground">{s.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="smallcaps text-muted-foreground">
                    {done ? "Kept" : `${count} questions`}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
