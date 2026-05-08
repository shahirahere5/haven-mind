import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { InsightForm } from "@/components/admin/InsightForm";
import { InlineLoader } from "@/components/PageLoader";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/insights/$insightId/edit")({
  component: EditInsightPage,
});

interface Insight {
  id: string;
  title: string;
  content: string;
  category: string | null;
  published: boolean;
}

function EditInsightPage() {
  const { insightId } = useParams({ from: "/admin/insights/$insightId/edit" });
  const { user } = useAuth();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const { data } = await supabase
          .from("admin_insights")
          .select("*")
          .eq("id", insightId)
          .eq("admin_id", user.id)
          .single();

        if (data) {
          setInsight(data);
        } else {
          toast.error("Insight not found");
        }
      } catch (error) {
        console.error("[v0] Error fetching insight:", error);
        toast.error("Failed to load insight");
      } finally {
        setLoading(false);
      }
    })();
  }, [insightId, user]);

  if (loading) return <InlineLoader />;

  if (!user) return <div>Loading...</div>;

  return <InsightForm insight={insight} adminId={user.id} isLoading={loading} />;
}
