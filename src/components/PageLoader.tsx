export function PageLoader({ label = "A moment" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <div className="h-px w-24 bg-foreground/30 animate-pulse" />
      <p className="font-display text-2xl italic text-foreground/80">{label}</p>
    </div>
  );
}

export function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="smallcaps text-muted-foreground animate-pulse">A moment</p>
    </div>
  );
}
