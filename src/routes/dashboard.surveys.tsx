import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { InlineLoader } from "@/components/PageLoader";

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
      setMessage("Please answer all questions.");
      return;
    }
    setSubmitting(true);
    const scaleAnswers = qs
      .filter((q) => q.question_type === "scale")
      .map((q) => Number(answers[q.id] ?? 0));
    const score = scaleAnswers.length > 0
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
      setMessage("Thank you for your reflection.");
      setCompleted(new Set([...completed, survey.id]));
      setTimeout(() => {
        setOpenId(null);
        setMessage(null);
      }, 2000);
    }
    setSubmitting(false);
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
                <p className="font-display text-xl text-ink/90" style={{ lineHeight: "1.5" }}>{q.question_text}</p>
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
          <p className="text-center text-sm text-teal/70 animate-fade-in">{message}</p>
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

      <div className="space-y-4 animate-slow">
        {surveys.map((s, i) => {
          const done = completed.has(s.id);
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
                <span className={`smallcaps whitespace-nowrap ${done ? "text-teal/60" : "text-muted-foreground/30"}`}>
                  {done ? "✓ Done" : `${count} Q's`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
