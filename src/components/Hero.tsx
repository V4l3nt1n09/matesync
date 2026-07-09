export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]"
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-20 text-center sm:pt-28">
        <span className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted">
          Pour les joueurs Nintendo Switch 1 & 2
        </span>
        <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          T&apos;as une Switch.
          <br />
          <span className="gradient-text">T&apos;as personne avec qui jouer.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          MateSync met en relation les joueurs Switch qui cherchent des
          partenaires de jeu réels — en coop, en versus, en local ou en
          ligne. Pas un réseau social de plus, juste des gens avec qui
          allumer la console.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="#rejoindre"
            className="rounded-full bg-gradient-to-r from-accent to-accent-2 px-7 py-3 text-base font-semibold text-white transition hover:opacity-90"
          >
            Rejoindre la liste d&apos;attente
          </a>
          <a
            href="#probleme"
            className="rounded-full border border-border px-7 py-3 text-base font-semibold text-foreground transition hover:bg-surface"
          >
            Découvrir le problème
          </a>
        </div>
      </div>
    </section>
  );
}
