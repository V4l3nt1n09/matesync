const points = [
  {
    label: "Profil basé sur tes jeux réels",
    text: "Renseigne ta console (Switch 1, Switch 2 ou les deux) et les jeux auxquels tu joues pour être associé aux bonnes personnes.",
  },
  {
    label: "Mise en relation, pas un fil infini",
    text: "MateSync te propose des joueurs compatibles avec tes disponibilités et ton style de jeu — coopératif, compétitif, décontracté.",
  },
  {
    label: "Sessions organisées, pas du hasard",
    text: "Planifie une session directement avec ton nouveau partenaire de jeu, en local ou en ligne.",
  },
];

export default function Solution() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-accent">
              L&apos;idée
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Une app pour trouver de vrais partenaires de jeu Switch
            </h2>
            <p className="mt-4 text-lg text-muted">
              MateSync n&apos;est pas un énième chat de gamers. C&apos;est un
              outil de mise en relation pensé spécifiquement pour
              l&apos;écosystème Nintendo Switch, pour transformer
              &laquo;&nbsp;je n&apos;ai personne avec qui jouer&nbsp;&raquo;
              en &laquo;&nbsp;on lance une partie ce soir&nbsp;?&nbsp;&raquo;
            </p>
          </div>
          <div className="flex flex-col gap-5">
            {points.map((point, i) => (
              <div key={point.label} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{point.label}</h3>
                  <p className="mt-1 text-muted">{point.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
