import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { InsightForm } from "@/components/admin/InsightForm";

export const Route = createFileRoute("/admin/insights/create")({
  component: CreateInsightPage,
});

function CreateInsightPage() {
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>;

  return <InsightForm adminId={user.id} />;
}
