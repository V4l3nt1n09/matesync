import Image from "next/image";
import styles from "./AppPreview.module.css";

function PhoneChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.phone}>
      <div className={styles.screen}>
        <div className={styles.notch} />
        <div className={styles.body}>{children}</div>
        <div className={styles.homeIndicator} />
      </div>
    </div>
  );
}

function Screenshot({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="240px"
      className={styles.screenshotImg}
    />
  );
}

const screens = [
  {
    key: "home",
    title: "Ton accueil",
    src: "/app-preview/home.png",
    alt: "Écran d'accueil de l'app MateSync avec activité récente",
  },
  {
    key: "annonces",
    title: "Des annonces variées",
    src: "/app-preview/annonces.png",
    alt: "Annonces de sessions sur plusieurs jeux différents dans MateSync",
  },
  {
    key: "chat",
    title: "Le côté social",
    src: "/app-preview/chat.png",
    alt: "Conversations de session et d'amis dans l'app MateSync",
  },
  {
    key: "profil",
    title: "Ton profil",
    src: "/app-preview/profil.png",
    alt: "Profil joueur personnalisé dans l'app MateSync",
  },
];

export default function AppPreview() {
  return (
    <section id="apercu" className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            À quoi ça ressemble
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Un aperçu de l&apos;application
          </h2>
          <p className="mt-4 text-lg text-muted">
            De vraies captures de l&apos;app mobile MateSync, encore en cours
            de construction.
          </p>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-10">
          {screens.map(({ key, title, src, alt }) => (
            <div key={key} className="flex flex-col items-center">
              <PhoneChrome>
                <Screenshot src={src} alt={alt} />
              </PhoneChrome>
              <p className="mt-4 text-sm font-medium text-muted">{title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
