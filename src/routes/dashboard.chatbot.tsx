import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/chatbot")({
  component: () => (
    <div className="space-y-12 animate-rise text-center">
      <header>
        <p className="smallcaps text-muted-foreground/50">A companion</p>
        <h1 className="mt-6 font-display text-6xl italic text-ink leading-[1.1]">Coming, slowly.</h1>
      </header>
      <p className="mx-auto max-w-md font-display text-lg italic text-muted-foreground/50" style={{ lineHeight: "2" }}>
        A quiet voice to listen, when you'd like one. We are taking our time
        to make it gentle and trustworthy. It will arrive when ready.
      </p>
    </div>
  ),
});
