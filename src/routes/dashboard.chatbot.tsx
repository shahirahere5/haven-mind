import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/chatbot")({
  component: () => (
    <div className="space-y-10 animate-rise">
      <header>
        <p className="smallcaps text-muted-foreground">A companion</p>
        <h1 className="mt-5 font-display text-5xl italic text-ink">Coming, slowly.</h1>
      </header>
      <div className="rule" />
      <p className="max-w-xl text-base italic text-muted-foreground">
        A quiet voice to listen, when you'd like one. We are taking our time
        to make it gentle and trustworthy. It will arrive when ready.
      </p>
    </div>
  ),
});
