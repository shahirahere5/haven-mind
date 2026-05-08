import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/surveys/create")({
  component: CreateSurveyPage,
});

interface Question {
  id: string;
  text: string;
  type: "text" | "scale" | "multiple_choice";
  isOptional: boolean;
  order: number;
}

function CreateSurveyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp_${Date.now()}`,
      text: "",
      type: "text",
      isOptional: false,
      order: questions.length + 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    const filtered = questions.filter((q) => q.id !== id);
    setQuestions(
      filtered.map((q, i) => ({
        ...q,
        order: i + 1,
      }))
    );
  };

  const updateQuestion = (
    id: string,
    field: keyof Question,
    value: any
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const saveSurvey = async () => {
    if (!user || !title.trim()) {
      toast.error("Please enter a survey title");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    if (questions.some((q) => !q.text.trim())) {
      toast.error("Please fill in all question texts");
      return;
    }

    setSaving(true);
    try {
      // Create survey
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .insert({
          admin_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Create questions
      const questionPayloads = questions.map((q) => ({
        survey_id: surveyData.id,
        question_text: q.text,
        question_type: q.type,
        question_order: q.order,
        is_optional: q.isOptional,
      }));

      const { error: questionsError } = await supabase
        .from("survey_questions")
        .insert(questionPayloads);

      if (questionsError) throw questionsError;

      // Create default scoring config
      await supabase.from("survey_scoring_config").insert({
        survey_id: surveyData.id,
        min_score: 0,
        max_score: 100,
        recommendation_text:
          "Thank you for completing this survey. Your responses will help guide your reflection.",
      });

      toast.success("Survey created successfully!");
      navigate({ to: "/admin/surveys" });
    } catch (error) {
      console.error("[v0] Error creating survey:", error);
      toast.error("Failed to create survey");
    } finally {
      setSaving(false);
    }
  };

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
            Create Survey
          </h1>
        </header>
      </div>

      <Card className="glass-card p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-2">
            Survey Title *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Anxiety Assessment"
            className="bg-glass border-glass-border/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-2">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this survey..."
            rows={3}
            className="bg-glass border-glass-border/50"
          />
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Questions</h2>
          <Button
            onClick={addQuestion}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </div>

        {questions.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <p className="text-muted-foreground/60 mb-4">
              No questions yet. Click &ldquo;Add Question&rdquo; to get started.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question, idx) => (
              <Card key={question.id} className="glass-card p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-lamp/60">
                      Question {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={question.isOptional}
                          onChange={(e) =>
                            updateQuestion(
                              question.id,
                              "isOptional",
                              e.target.checked
                            )
                          }
                          className="rounded"
                        />
                        <span className="text-muted-foreground/60">Optional</span>
                      </label>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="p-1.5 hover:bg-glass rounded-lg transition-colors text-red-400/60 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink/70 mb-2">
                      Question Text
                    </label>
                    <Input
                      value={question.text}
                      onChange={(e) =>
                        updateQuestion(question.id, "text", e.target.value)
                      }
                      placeholder="Enter question..."
                      className="bg-glass border-glass-border/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink/70 mb-2">
                      Question Type
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) =>
                        updateQuestion(
                          question.id,
                          "type",
                          e.target.value as Question["type"]
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-glass border border-glass-border/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-lamp/50"
                    >
                      <option value="text">Text Answer</option>
                      <option value="scale">Scale (1-5)</option>
                      <option value="multiple_choice">
                        Multiple Choice
                      </option>
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 pb-8">
        <Link to="/admin/surveys">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={saveSurvey}
          disabled={saving || !title.trim() || questions.length === 0}
          className="flex items-center gap-2"
        >
          {saving ? "Creating…" : "Create Survey"}
        </Button>
      </div>
    </div>
  );
}
