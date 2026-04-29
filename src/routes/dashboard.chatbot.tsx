import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/chatbot")({
  component: () => (
    <Card>
      <CardHeader>
        <CardTitle>Chatbot</CardTitle>
        <CardDescription>Coming soon.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">An AI companion will be available in a future update.</p>
      </CardContent>
    </Card>
  ),
});
