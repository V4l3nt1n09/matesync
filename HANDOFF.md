# MateSync — Passation de session (13 juillet 2026)

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

## Ce qui a été fait cette session (dans l'ordre)

### 1. Réseaux sociaux
- Compte X (**@matesync**) créé, API branchée en OAuth 1.0a
  (`automation/post-to-x.mjs`, gère post texte+image et suppression).
  Premier post publié avec image + hashtags ciblés.
- Bannière X générée (`Images/matesync_x_banner.png`).
- Routine hebdomadaire automatisée `matesync-weekly-content`
  (`.claude/scheduled-tasks/matesync-weekly-content/SKILL.md`) étendue :
  couvre maintenant Discord + Instagram + X + les actus in-app (voir plus
  bas). Toujours soumise à validation avant publication.

### 2. Infrastructure email (bug résolu)
Resend était en mode sandbox (n'autorisait l'envoi qu'à ta propre adresse),
bloquant la création de comptes de test. Domaine `matesync.fr` vérifié chez
Resend (DKIM/SPF/DMARC + MX sur le sous-domaine `send.matesync.fr`, sans
toucher à la config mail existante `contact@matesync.fr`/Zimbra). Adresse
d'expédition Supabase mise à jour vers `contact@matesync.fr`.

### 3. App mobile — refonte majeure
Point de départ : auth par code email + création de profil basique.
Construit cette session, dans l'ordre :

1. **Navigation par onglets** (Accueil / Annonces / Chat / Profil), remplace
   la simple pile d'écrans.
2. **Annonces de session** (remplace l'ancien "Découverte" par profils) :
   modèle façon LFG — un joueur publie une annonce pour un jeu qu'il possède
   (créneau + places), les autres demandent à rejoindre, l'hôte accepte ou
   refuse, le code ami Switch est automatiquement révélé au demandeur accepté
   (RPC `get_host_friend_code`, jamais exposé autrement).
3. **Chat** : salon de groupe automatique par annonce (`session-chat`) +
   chat direct 1:1 réservé aux amis confirmés (`direct-chat`). Les deux en
   Supabase Realtime (seule partie de l'app en temps réel).
4. **Système d'amis** : vrai flux demande/acceptation (`friend_requests`,
   pas d'amitié automatique), historique "joueurs rencontrés" dérivé des
   annonces acceptées.
5. **Notation privée 👍/👎** des joueurs après une session (`player_ratings`,
   RLS strictement privée — même la personne notée ne voit jamais sa note).
   Sert uniquement à réordonner discrètement tes propres listes, jamais un
   score public.
6. **Accueil** transformé en vrai tableau de bord : prochaine session, stats
   rapides, fil d'activité récente, aperçu d'annonces recommandées, et un
   bloc "Actus Switch" (nouvelle table `news`, verrouillée en écriture —
   alimentée uniquement par la routine hebdomadaire, jamais par les
   utilisateurs).
7. **Profil** séparé en vue publique réutilisable (`ProfileView`, exclut
   toujours le code ami) + réglages séparés (`/profile-setup?edit=1`).
   Nouvelle route `/player/[id]` pour consulter le profil de n'importe qui,
   avec le nombre de sessions jouées par jeu (RPC `get_public_profile` +
   `get_player_game_session_counts`, toutes deux SECURITY DEFINER pour ne
   jamais rouvrir un accès large à la table `profiles`).
8. **Identité visuelle** : dégradé violet→rose partout (composants
   `PrimaryButton`, `GradientAvatar`), alignée sur la maquette du site (les
   couleurs elles-mêmes étaient déjà identiques, seul l'usage en dégradé
   manquait).
9. **Avatars systématiques** : la photo de profil accompagne désormais le
   pseudo absolument partout où il apparaît dans l'app.

### Bugs résolus en cours de route
- Connexion Expo Go cassée à chaque changement de réseau Wi-Fi → passage en
  **mode tunnel** (`npx expo start --tunnel`, nécessite `@expo/ngrok`
  installé globalement). L'adresse tunnel affichée au démarrage du serveur
  est stable dans le temps observé cette session, mais redémarre si le
  process Metro est tué — relance simplement `matesync-mobile` depuis
  `.claude/launch.json` et regénère l'adresse via `curl localhost:4040/api/tunnels`
  si besoin.
- Après connexion, l'app renvoyait systématiquement vers l'onboarding au lieu
  de l'accueil (même profil déjà complet) → corrigé dans `login.tsx`
  (redirige vers `/home`, laisse la garde de `(tabs)/_layout.tsx` décider) et
  `profile-setup.tsx` (logique de reprise d'étape).

## Fichiers clés pour reprendre le fil
- **`mobile/NEXT_STEPS.md`** — journal technique détaillé de chaque feature,
  à lire en premier.
- `mobile/lib/theme.ts`, `mobile/lib/supabase.ts` — palette et types
  partagés.
- `automation/` — scripts et contexte réseaux sociaux.
- `.claude/plans/logical-wishing-stream.md` — dernier plan approuvé
  (probablement obsolète après cette session, mais utile pour voir le
  raisonnement détaillé des dernières features).

## Pistes déjà identifiées pour la suite
- Notifications (pas d'onglet dédié pour l'instant — envisager un badge)
- Planification de session au-delà du système d'annonces actuel
- Optimisation du comptage de places par annonce si la communauté grandit
  (actuellement une requête séparée par annonce)
