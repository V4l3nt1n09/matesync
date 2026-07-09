export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <a href="#top" className="flex shrink-0 items-center gap-2 text-base font-semibold sm:text-lg">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-white">
            MS
          </span>
          MateSync
        </a>
        <a
          href="#rejoindre"
          className="shrink-0 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
        >
          Rejoindre
        </a>
      </div>
    </header>
  );
}
