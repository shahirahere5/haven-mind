export function Footer() {
  return (
    <footer className="mt-32">
      <div className="mx-auto max-w-3xl px-8 py-16 text-center">
        <p className="font-display text-2xl italic text-foreground/40">MindHaven</p>
        <p className="mt-4 smallcaps text-muted-foreground/30">A quiet place to keep your thoughts</p>
        <p className="mt-10 text-xs text-muted-foreground/20">
          © {new Date().getFullYear()} — Made slowly, with care.
        </p>
      </div>
    </footer>
  );
}
