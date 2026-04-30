export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/40 bg-card/40 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌸</span>
              <span className="font-display text-xl font-semibold text-gradient">MindHaven</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              A safe space for your thoughts. Breathe in. Breathe out. You are here.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Care</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="text-foreground/80">Daily journaling</li>
              <li className="text-foreground/80">Mood tracking</li>
              <li className="text-foreground/80">Mindful surveys</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Need help?</h4>
            <p className="mt-3 text-sm text-muted-foreground">
              If you're in crisis, please reach out to a local helpline. You're not alone.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MindHaven · Made with care 💛
        </div>
      </div>
    </footer>
  );
}
