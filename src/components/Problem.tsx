const pains = [
  {
    title: "T'as acheté la Switch 2, tes potes non",
    text: "Les jeux en local prennent la poussière parce que t'es le seul de ton entourage à avoir la console.",
  },
  {
    title: "Le matchmaking en ligne, c'est la loterie",
    text: "Lobbies anonymes, personne qui parle, parties qui se terminent sans jamais rejouer ensemble.",
  },
  {
    title: "Les serveurs Discord sont trop généralistes",
    text: "Des milliers de membres, zéro filtre par console, et personne de dispo au bon moment.",
  },
  {
    title: "Tes horaires ne collent avec personne",
    text: "Tu joues le soir en semaine, tes amis le week-end. Trouver le bon créneau relève du miracle.",
  },
];

export default function Problem() {
  return (
    <section id="probleme" className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Jouer seul, ce n&apos;est pas ce que tu voulais
          </h2>
          <p className="mt-4 text-lg text-muted">
            La Switch est faite pour jouer à plusieurs. Dans la vraie vie,
            trouver quelqu&apos;un de dispo, motivé et compatible est plus
            difficile qu&apos;il n&apos;y paraît.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {pains.map((pain) => (
            <div
              key={pain.title}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <h3 className="text-lg font-semibold">{pain.title}</h3>
              <p className="mt-2 text-muted">{pain.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
