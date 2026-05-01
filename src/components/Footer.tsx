export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto max-w-3xl px-8 py-12 text-center">
        <p className="font-display text-2xl italic text-foreground/80">MindHaven</p>
        <p className="mt-3 smallcaps text-muted-foreground">A quiet place to keep your thoughts</p>
        <p className="mt-8 text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} — Made slowly, with care.
        </p>
      </div>
    </footer>
  );
}
