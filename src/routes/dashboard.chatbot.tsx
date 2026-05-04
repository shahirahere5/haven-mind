import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/chatbot")({
  component: () => (
    <div className="space-y-8 animate-rise text-center py-20">
      <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "var(--glass)" }}>
        🤖
      </div>
      <header>
        <p className="smallcaps text-teal/60 mb-4">AI Companion</p>
        <h1 className="font-display text-5xl text-ink sm:text-6xl">Coming Soon</h1>
      </header>
      <p className="mx-auto max-w-md text-muted-foreground/50" style={{ lineHeight: "1.8" }}>
        An AI companion to listen and support you is being carefully developed.
        It will arrive when it's ready to truly help.
      </p>
    </div>
  ),
});
