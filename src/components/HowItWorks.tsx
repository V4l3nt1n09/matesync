const steps = [
  {
    step: "01",
    title: "Crée ton profil joueur",
    text: "Console(s), jeux favoris, disponibilités et style de jeu recherché.",
  },
  {
    step: "02",
    title: "Sois mis en relation",
    text: "MateSync te propose des joueurs compatibles avec tes jeux et tes horaires.",
  },
  {
    step: "03",
    title: "Planifie une session",
    text: "Discute, fixe un créneau et lance la partie avec ton nouveau mate.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Comment ça marchera
        </h2>
        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="text-center sm:text-left">
              <span className="text-5xl font-bold text-border">{s.step}</span>
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
