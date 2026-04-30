import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageLoader } from "@/components/PageLoader";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader label="Welcome to MindHaven" />;
  return <Navigate to={session ? "/dashboard" : "/auth"} />;
}
