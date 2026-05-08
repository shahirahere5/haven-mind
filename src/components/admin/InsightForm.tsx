import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate, Link } from "@tanstack/react-router";

interface InsightFormProps {
  insight?: {
    id: string;
    title: string;
    content: string;
    category: string | null;
    published: boolean;
  } | null;
  adminId: string;
  isLoading?: boolean;
}

export function InsightForm({ insight, adminId, isLoading: initialLoading }: InsightFormProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(insight?.title || "");
  const [content, setContent] = useState(insight?.content || "");
  const [category, setCategory] = useState(insight?.category || "");
  const [published, setPublished] = useState(insight?.published || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter content");
      return;
    }

    setSaving(true);
    try {
      if (insight) {
        // Update existing insight
        const { error } = await supabase
          .from("admin_insights")
          .update({
            title: title.trim(),
            content: content.trim(),
            category: category.trim() || null,
            published,
          })
          .eq("id", insight.id);

        if (error) throw error;
        toast.success("Insight updated successfully!");
      } else {
        // Create new insight
        const { error } = await supabase.from("admin_insights").insert({
          admin_id: adminId,
          title: title.trim(),
          content: content.trim(),
          category: category.trim() || null,
          published,
        });

        if (error) throw error;
        toast.success("Insight created successfully!");
      }

      navigate({ to: "/admin/insights" });
    } catch (error) {
      console.error("[v0] Error saving insight:", error);
      toast.error("Failed to save insight");
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/admin/insights">
          <button className="text-sm text-muted-foreground/40 hover:text-lamp transition-colors">
            ← Back
          </button>
        </Link>
        <header>
          <h1 className="font-display text-4xl text-ink sm:text-5xl">
            {insight ? "Edit Insight" : "Create Insight"}
          </h1>
        </header>
      </div>

      <Card className="glass-card p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-2">
            Title *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Understanding Anxiety"
            className="bg-glass border-glass-border/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-2">
            Category
          </label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Mental Health, Wellness"
            className="bg-glass border-glass-border/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink/70 mb-2">
            Content *
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your insight here..."
            rows={10}
            className="bg-glass border-glass-border/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="published" className="text-sm text-ink/70">
            Publish this insight (visible to users)
          </label>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4 pb-8">
        <Link to="/admin/insights">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={handleSave}
          disabled={saving || !title.trim() || !content.trim()}
          className="flex items-center gap-2"
        >
          {saving ? "Saving…" : insight ? "Update Insight" : "Create Insight"}
        </Button>
      </div>
    </div>
  );
}
