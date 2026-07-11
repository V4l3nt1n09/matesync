import styles from "./AppPreview.module.css";

function PhoneChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.phone}>
      <div className={styles.screen}>
        <div className={styles.notch} />
        <div className={styles.statusbar}>
          <span>9:41</span>
          <span>●●●● Wi-Fi</span>
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.homeIndicator} />
      </div>
    </div>
  );
}

function ProfileScreen() {
  return (
    <>
      <div className={styles.stepTag}>Étape 1</div>
      <h4 className={styles.screenTitle}>Quelle console as-tu ?</h4>
      <div className={`${styles.optionRow}`}>
        <span>Switch (originale)</span>
        <span className={styles.check} />
      </div>
      <div className={`${styles.optionRow} ${styles.selected}`}>
        <span>Switch 2</span>
        <span className={`${styles.check} ${styles.on}`} />
      </div>
      <div className={styles.optionRow}>
        <span>Les deux</span>
        <span className={styles.check} />
      </div>
      <div className={styles.btn}>Continuer</div>
    </>
  );
}

function DiscoveryScreen() {
  return (
    <>
      <div className={styles.stepTag}>Étape 2</div>
      <h4 className={styles.screenTitle}>Des joueurs compatibles</h4>
      <div className={styles.card}>
        <div className={styles.onlineTag}>En ligne</div>
        <div className={styles.avatar}>LN</div>
        <div className={styles.cardName}>Léa</div>
        <div className={styles.badgeRow}>
          <span className={styles.badge}>Switch 2</span>
          <span className={styles.badge}>3 jeux en commun</span>
          <span className={styles.badge}>Dispo ce soir</span>
        </div>
      </div>
    </>
  );
}

function SessionScreen() {
  return (
    <>
      <div className={styles.stepTag}>Étape 3</div>
      <h4 className={styles.screenTitle}>Planifie une session</h4>
      <div className={styles.chatHead}>
        <div className={styles.avatar} style={{ width: 30, height: 30, fontSize: 11 }}>
          LN
        </div>
        <span className={styles.chatWho}>Léa</span>
      </div>
      <div className={`${styles.chatBubble} ${styles.them}`}>
        Dispo pour une partie ce soir ?
      </div>
      <div className={`${styles.chatBubble} ${styles.me}`}>
        Grave, vers 20h ça te va ?
      </div>
      <div className={styles.sessionCard}>
        <div className={styles.sessionLabel}>Session proposée</div>
        <div className={styles.sessionTitle}>Splatoon 3</div>
        <div className={styles.sessionMeta}>Aujourd&apos;hui · 20h00</div>
      </div>
    </>
  );
}

const screens = [
  { key: "profile", title: "Crée ton profil", Component: ProfileScreen },
  { key: "discovery", title: "Sois mis en relation", Component: DiscoveryScreen },
  { key: "session", title: "Planifie une session", Component: SessionScreen },
];

export default function AppPreview() {
  return (
    <section id="apercu" className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            À quoi ça ressemblera
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Un aperçu de l&apos;application
          </h2>
          <p className="mt-4 text-lg text-muted">
            Le site n&apos;est que la première étape. Voici une direction de
            design pour l&apos;app mobile, encore en cours de construction.
          </p>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-10">
          {screens.map(({ key, title, Component }) => (
            <div key={key} className="flex flex-col items-center">
              <PhoneChrome>
                <Component />
              </PhoneChrome>
              <p className="mt-4 text-sm font-medium text-muted">{title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
