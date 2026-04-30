export function PageLoader({ label = "Loading your safe space" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-haven">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full gradient-primary opacity-30 animate-breathe" />
        <div className="absolute inset-3 rounded-full gradient-primary opacity-60 animate-breathe" style={{ animationDelay: "0.4s" }} />
        <div className="relative h-10 w-10 rounded-full gradient-primary shadow-glow animate-breathe" style={{ animationDelay: "0.8s" }} />
      </div>
      <div className="text-center">
        <p className="font-display text-xl text-foreground">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">Take a deep breath…</p>
      </div>
    </div>
  );
}

export function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
    </div>
  );
}
