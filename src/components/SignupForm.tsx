"use client";

import { useEffect, useState } from "react";
import { supabase, type Console, type Frequency } from "@/lib/supabase";

const CONSOLE_OPTIONS: { value: Console; label: string }[] = [
  { value: "switch1", label: "Switch (originale)" },
  { value: "switch2", label: "Switch 2" },
  { value: "both", label: "Les deux" },
];

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Tous les jours" },
  { value: "weekly", label: "Chaque semaine" },
  { value: "occasionally", label: "De temps en temps" },
  { value: "rarely", label: "Rarement, mais ça m'arrive" },
];

const MOTIVATION_OPTIONS = [
  "Trouver des partenaires pour jouer en coop",
  "Trouver des adversaires pour du versus / compétitif",
  "Construire un groupe de jeu régulier",
  "Autre",
];

type Status = "idle" | "submitting" | "success" | "error";

export default function SignupForm() {
  const [count, setCount] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [consoleType, setConsoleType] = useState<Console | null>(null);
  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const [motivations, setMotivations] = useState<string[]>([]);
  const [favoriteGames, setFavoriteGames] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    supabase
      .rpc("get_signups_count")
      .then(({ data, error }) => {
        if (!error && typeof data === "number") setCount(data);
      });
  }, []);

  function toggleMotivation(option: string) {
    setMotivations((prev) =>
      prev.includes(option)
        ? prev.filter((m) => m !== option)
        : [...prev, option],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!consoleType || !frequency) {
      setErrorMessage("Merci de répondre à toutes les questions obligatoires.");
      return;
    }

    if (!consent) {
      setErrorMessage("Merci de cocher la case de consentement pour continuer.");
      return;
    }

    setStatus("submitting");

    const { error } = await supabase.from("signups").insert({
      email: email.trim().toLowerCase(),
      console: consoleType,
      frequency,
      motivations,
      favorite_games: favoriteGames.trim() || null,
      comment: comment.trim() || null,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.code === "23505"
          ? "Cet email est déjà inscrit — merci pour ton intérêt !"
          : "Une erreur est survenue, réessaie dans un instant.",
      );
      return;
    }

    setStatus("success");
    setCount((prev) => (prev !== null ? prev + 1 : prev));
  }

  if (status === "success") {
    return (
      <section id="rejoindre" className="border-t border-border">
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-2xl">
            ✓
          </div>
          <h2 className="mt-6 text-3xl font-bold">C&apos;est noté !</h2>
          <p className="mt-3 text-lg text-muted">
            Merci d&apos;avoir rejoint la liste d&apos;attente. On te
            préviendra dès que MateSync sera prêt à jouer.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="rejoindre" className="border-t border-border">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Rejoins la liste d&apos;attente
          </h2>
          <p className="mt-3 text-lg text-muted">
            Réponds à quelques questions pour nous aider à construire une app
            qui correspond vraiment à tes besoins.
          </p>
          {count !== null && (
            <p className="mt-4 inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted">
              🎮 <span className="font-semibold text-foreground">{count}</span>{" "}
              joueur{count > 1 ? "s" : ""} déjà inscrit{count > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-12 flex flex-col gap-8">
          <fieldset>
            <legend className="font-semibold">
              Quelle console possèdes-tu ? *
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {CONSOLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm transition ${
                    consoleType === opt.value
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-surface text-muted hover:border-accent/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="console"
                    value={opt.value}
                    className="sr-only"
                    checked={consoleType === opt.value}
                    onChange={() => setConsoleType(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-semibold">
              À quelle fréquence te manque-t-il quelqu&apos;un avec qui jouer ? *
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition ${
                    frequency === opt.value
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-surface text-muted hover:border-accent/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={opt.value}
                    className="sr-only"
                    checked={frequency === opt.value}
                    onChange={() => setFrequency(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-semibold">
              Qu&apos;est-ce qui t&apos;intéresse le plus ? (plusieurs choix possibles)
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {MOTIVATION_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition ${
                    motivations.includes(opt)
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-surface text-muted hover:border-accent/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={motivations.includes(opt)}
                    onChange={() => toggleMotivation(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-2">
            <span className="font-semibold">
              Tes jeux favoris en multi ?{" "}
              <span className="font-normal text-muted">(optionnel)</span>
            </span>
            <input
              type="text"
              value={favoriteGames}
              onChange={(e) => setFavoriteGames(e.target.value)}
              placeholder="Mario Kart, Splatoon, Animal Crossing..."
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-semibold">
              Une idée ou une remarque à nous partager ?{" "}
              <span className="font-normal text-muted">(optionnel)</span>
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-semibold">Ton email *</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              type="checkbox"
              id="consent-checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-accent"
            />
            <span>
              J&apos;accepte que MateSync utilise mon email et mes réponses
              uniquement pour me recontacter à propos du lancement de
              l&apos;app. Aucune donnée n&apos;est vendue ni partagée avec
              des tiers. Je peux demander la suppression de mes données à
              tout moment à{" "}
              <a
                href="mailto:contact@matesync.fr"
                className="text-foreground underline underline-offset-2"
              >
                contact@matesync.fr
              </a>
              .
            </span>
          </label>

          {errorMessage && (
            <p className="text-sm text-accent-2">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-full bg-gradient-to-r from-accent to-accent-2 px-7 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {status === "submitting" ? "Envoi en cours..." : "Je rejoins la liste"}
          </button>
        </form>
      </div>
    </section>
  );
}
