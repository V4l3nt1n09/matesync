# MateSync — Passation de session (24 juillet 2026)

Document de reprise pour une nouvelle discussion. Pour le détail technique
de l'app mobile (fichiers, choix d'implémentation), voir en premier
`mobile/NEXT_STEPS.md` — ce fichier-ci donne la vue d'ensemble du projet et
de ce qui s'est passé cette session.

## Contexte produit (rappel)

MateSync : app mobile (iOS/Android, Expo/React Native) + site web (Next.js,
matesync.fr) pour aider les joueurs Nintendo Switch 1 & 2 à trouver des
partenaires de jeu.

**Deux principes non négociables, à ne jamais réintroduire par erreur :**
1. Aucune géolocalisation — jamais de distance, ville, "près de toi".
2. Pas de code visuel "app de rencontre" — pas de swipe/cœur, pas de "match"
   romantique. Le seul critère de mise en relation : jeux + disponibilité.

Backend : Supabase, projet `gamesync` (id `bftjufmdxlwbqyhnhoxx`). Site :
Next.js sur Vercel, domaine OVH. Mobile : Expo SDK 54, expo-router.

Une idée d'onglet "Communauté" (mini réseau social : posts/photos/vidéos)
a été envisagée puis **mise de côté** — risque de dérive vers une UX
"dating-app coded" (voir mémoire `matesync_communaute_tab_shelved`). À
reprendre uniquement avec un cadrage strict (contenu lié au jeu, modération
pensée dès le départ) si le sujet revient.

## Ce qui a été fait cette session (dans l'ordre)

### 1. Vercel Web Analytics
`@vercel/analytics` installé et `<Analytics />` ajouté dans
`src/app/layout.tsx` (site Next.js). L'utilisateur doit encore cliquer sur
"Enable" dans l'onglet Analytics de son dashboard Vercel — normalement déjà
fait en cours de session, mais à reconfirmer si les stats restent vides.

### 2. Publication réseaux sociaux (routine hebdomadaire)
Nouveau post publié à la main cette session (pas via le cron du lundi) :
image `public/social/post-3-coop.png` (Overcooked! 2 / It Takes Two /
Pikmin 4), publié sur Instagram
([permalink](https://www.instagram.com/p/DbAKecxDS8Z/)) et X
([tweet](https://x.com/matesync/status/2079072491482321248)). La Story
Instagram associée (`automation/drafts/story-3-coop.png`) n'a **pas** été
publiée automatiquement — l'API Graph pour les Stories n'est pas branchée
dans le flux existant, à poster à la main depuis le téléphone si voulu, ou
à automatiser plus tard.

Rappel important découvert cette session : X, Instagram et Discord sont
**déjà connectés** via `automation/.env` (credentials existantes) et une
routine planifiée `matesync-weekly-content` (tous les lundis, voir
`.claude/scheduled-tasks/matesync-weekly-content/SKILL.md` dans le home
directory utilisateur) — ne pas repartir du principe qu'aucune intégration
n'existe.

### 3. Mode démo web public pour l'app mobile (feature principale)
Objectif : permettre aux visiteurs de matesync.fr de parcourir une version
interactive de l'app mobile, sans backend réel, sur **demo.matesync.fr**.

Implémenté et testé de bout en bout (export statique + serveur local,
zéro requête réseau vers Supabase pendant l'usage) :
- `mobile/lib/demo-mode.ts` (`isDemoMode`, activé via
  `EXPO_PUBLIC_DEMO_MODE=1`) et `mobile/lib/demo-data.ts` (store de données
  factices mutable en mémoire + helpers).
- `mobile/components/DemoBanner.tsx` : bandeau "Mode démo" affiché en haut
  de l'app quand `isDemoMode` est actif.
- Tous les écrans concernés (auth/profil, accueil, annonces, chat,
  session-chat, direct-chat, profil joueur, création d'annonce,
  configuration profil) branchés avec une garde `if (isDemoMode) {...}` qui
  lit/mute le store factice au lieu d'appeler Supabase. Les interactions
  (créer une annonce, accepter une demande, chatter) sont **réellement
  fonctionnelles en local**, juste non persistées (réinitialisées au
  rechargement).
- `mobile/vercel.json` (rewrite catch-all vers `/index.html`, nécessaire
  car l'export Expo Router web est un SPA classique, pas du SSG par route).
- `mobile/package.json` : script `build:web` (`expo export -p web`, sortie
  dans `dist/`).
- `.claude/launch.json` : config `matesync-web-demo` (port 8083,
  `EXPO_PUBLIC_DEMO_MODE=1`) pour tester en local sans toucher au flux
  `matesync-web` existant (port 8082, vraies données).

Tout est commité et poussé sur `main`.

**Étape bloquante restante (nécessite le compte Vercel/OVH de
l'utilisateur, pas faisable par l'agent) :**
1. Nouveau projet Vercel : repo GitHub existant, Root Directory `mobile`,
   Build Command `npm run build:web`, Output Directory `dist`.
2. Variables d'env sur ce projet : `EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (mêmes valeurs que `mobile/.env`),
   `EXPO_PUBLIC_DEMO_MODE=1`.
3. Vercel → Domains : ajouter `demo.matesync.fr`.
4. DNS chez OVH : CNAME `demo` → cible fournie par Vercel
   (généralement `cname.vercel-dns.com`).

L'utilisateur s'est arrêté avant de commencer cette étape 1 — c'est le
point de reprise pour la prochaine session.

### 4. Tunnel Expo Go
Toujours en mode tunnel (`npx expo start --tunnel`, config `matesync-mobile`
dans `.claude/launch.json`). Fonctionne normalement — relancer simplement
la config si besoin, comme documenté dans le handoff précédent.

## Fichiers clés pour reprendre le fil
- **`mobile/NEXT_STEPS.md`** — journal technique détaillé de chaque feature,
  à lire en premier.
- `mobile/lib/theme.ts`, `mobile/lib/supabase.ts` — palette et types
  partagés.
- `mobile/lib/demo-data.ts` / `demo-mode.ts` — mode démo (voir section 3).
- `automation/` — scripts et contexte réseaux sociaux.

## Pistes déjà identifiées pour la suite
- Finir le déploiement Vercel de `demo.matesync.fr` (voir section 3).
- Éventuellement automatiser la publication des Stories Instagram.
- Notifications (pas d'onglet dédié pour l'instant — envisager un badge).
- Planification de session au-delà du système d'annonces actuel.
- Optimisation du comptage de places par annonce si la communauté grandit.
