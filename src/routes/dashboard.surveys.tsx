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
      }, 2000);
    }
    setSubmitting(false);
  };

  if (loading) return <InlineLoader />;

  const openSurvey = surveys.find((s) => s.id === openId);

  if (openSurvey) {
    const qs = questions[openSurvey.id] ?? [];
    return (
      <div className="space-y-20 animate-fade-in">
        <header className="text-center">
          <button
            onClick={() => setOpenId(null)}
            className="smallcaps text-muted-foreground/40 transition-all duration-500 hover:text-foreground/70"
          >
            ← Back
          </button>
          <h1 className="mt-10 font-display text-6xl italic text-ink leading-[1.1]">{openSurvey.title}</h1>
          {openSurvey.description && (
            <p className="mx-auto mt-6 max-w-lg italic text-muted-foreground/50" style={{ lineHeight: "1.9" }}>
              {openSurvey.description}
            </p>
          )}
        </header>

        <div className="space-y-20">
          {qs.map((q, i) => (
            <div key={q.id} className="animate-rise" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-baseline gap-5 mb-6">
                <span className="smallcaps text-muted-foreground/30">{String(i + 1).padStart(2, "0")}</span>
                <p className="font-display text-2xl italic text-ink/90" style={{ lineHeight: "1.5" }}>{q.question_text}</p>
              </div>
              {q.question_type === "scale" ? (
                <div className="ml-12 flex flex-wrap items-baseline gap-x-10 gap-y-4">
                  {SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                      className={`font-display italic transition-all duration-500 ${
                        answers[q.id] === opt.value
                          ? "text-lamp underline decoration-lamp/30 underline-offset-8"
                          : "text-muted-foreground/50 hover:text-foreground/70"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  rows={4}
                  placeholder="Take your time…"
                  className="prose-journal ml-12 w-[calc(100%-3rem)] resize-none border-0 bg-transparent px-0 py-2 text-foreground/85 placeholder:italic placeholder:text-muted-foreground/35 focus:outline-none focus:ring-0"
                  style={{ lineHeight: "2", caretColor: "var(--lamp)" }}
                />
              )}
            </div>
          ))}
        </div>

        {message && (
          <p className="text-center text-sm italic text-foreground/50 animate-fade-in">
            {message}
          </p>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setOpenId(null)}
            className="smallcaps text-muted-foreground/40 transition-all duration-500 hover:text-foreground/70"
          >
            Not now
          </button>
          <button
            onClick={() => submit(openSurvey)}
            disabled={submitting}
            className="smallcaps text-foreground/70 transition-all duration-500 hover:text-lamp disabled:text-muted-foreground/25"
          >
            {submitting ? "Keeping…" : "Keep my answers"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-24">
      <header className="animate-rise text-center">
        <p className="smallcaps text-muted-foreground/50">Reflections</p>
        <h1 className="mt-6 font-display text-6xl italic text-ink leading-[1.1] sm:text-7xl">
          Five careful<br />questions.
        </h1>
        <p className="mx-auto mt-6 max-w-md italic text-muted-foreground/50" style={{ lineHeight: "1.9" }}>
          Each one is a quiet way of asking how you really are.
        </p>
      </header>

      <div className="space-y-0 animate-slow">
        {surveys.map((s, i) => {
          const done = completed.has(s.id);
          const count = (questions[s.id] ?? []).length;
          return (
            <button
              key={s.id}
              onClick={() => open(s.id)}
              className="group block w-full py-10 text-left transition-all duration-500"
            >
              <div className="flex items-baseline justify-between gap-6">
                <div>
                  <div className="flex items-baseline gap-5">
                    <span className="smallcaps text-muted-foreground/30">{String(i + 1).padStart(2, "0")}</span>
                    <p className="font-display text-3xl italic text-ink/80 transition-all duration-500 group-hover:text-lamp sm:text-4xl">
                      {s.title}
                    </p>
                  </div>
                  {s.description && (
                    <p className="mt-3 max-w-xl pl-12 text-sm italic text-muted-foreground/40">{s.description}</p>
                  )}
                </div>
                <p className="smallcaps text-muted-foreground/30">
                  {done ? "Kept" : `${count} questions`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
