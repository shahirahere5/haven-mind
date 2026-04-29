import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/surveys")({
  component: () => (
    <Card>
      <CardHeader>
        <CardTitle>Surveys</CardTitle>
        <CardDescription>Coming soon.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Surveys will be available in a future update.</p>
      </CardContent>
    </Card>
  ),
});
