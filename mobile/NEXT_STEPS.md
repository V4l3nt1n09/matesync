# Prochaine étape

L'écran de création de profil complet (pseudo, jeux possédés, disponibilité,
photo de profil, gamer tag Switch) est fait et testé de bout en bout —
voir `app/profile-setup.tsx`.

L'app est organisée en onglets (`app/(tabs)/`) : Accueil, Annonces, Chat,
Profil. Le profil est partagé entre les écrans via `lib/profile-context.tsx`
(évite de le refetch à chaque onglet).

**Le chat et le système d'amis sont faits** — voir `app/(tabs)/chat.tsx`.
Deux surfaces de discussion :
- **Chat de session** (`app/session-chat/[id].tsx`) : un salon de groupe
  automatique par annonce, entre l'hôte et les participants acceptés — pas de
  création manuelle de groupe, ça se fait tout seul via les annonces.
- **Chat direct** (`app/direct-chat/[userId].tsx`) : discussion 1:1, réservée
  aux amis confirmés.

Le système d'amis est un vrai flux demande/acceptation (`friend_requests`),
pas une amitié automatique. L'onglet Chat a un segment "Amis" avec : demandes
reçues, mes amis, et un historique des "joueurs rencontrés" (dérivé des
annonces acceptées) avec un bouton "Demander en ami" pour chacun. Les deux
chats utilisent Supabase Realtime pour les messages en direct (contrairement
au reste de l'app qui fonctionne par simple fetch).

**L'ancien modèle "Découverte" (parcourir des profils de joueurs) a été
remplacé par un système d'annonces de session**, façon tableau LFG : un joueur
publie une annonce pour un jeu qu'il possède (créneau + nombre de places,
`app/create-session.tsx`), les autres joueurs qui possèdent ce jeu la voient
dans l'onglet Annonces (`app/(tabs)/annonces.tsx`) et peuvent demander à
rejoindre ; le créateur accepte ou refuse depuis "Les miennes" ; en cas
d'acceptation, son code ami Switch est automatiquement révélé au demandeur
(fonction RPC `get_host_friend_code`, qui vérifie l'acceptation côté serveur).
Une annonce disparaît automatiquement 12h après l'horaire de la partie, ou
si le créateur la supprime.

Suite à ce changement, l'accès large aux profils d'autrui a été retiré côté
Supabase (policy `allow_discover_completed_profiles` supprimée) : pseudo et
avatar sont désormais dupliqués directement dans `sessions` et
`session_requests` à la création, pour éviter de rouvrir un accès large à la
table `profiles`.

**L'onglet Accueil est maintenant un vrai tableau de bord** (scrollable) :
- Carte "Ta prochaine session" + stats rapides (annonces actives, amis)
- Raccourcis "Voir les annonces" / "Créer une annonce"
- **Activité récente** : 5 derniers événements notables (demande d'ami reçue,
  demande d'ami acceptée, demande de session reçue sur une annonce hébergée,
  demande de session acceptée) avec lien direct vers l'écran concerné
- **Annonces pour toi** : aperçu des 3 annonces les plus récentes pour tes
  jeux
- **Actus Switch** : table Supabase `news` (title, body, created_at), sans
  policy INSERT pour les utilisateurs — alimentée uniquement par la routine
  hebdomadaire `matesync-weekly-content` (voir plus bas), jamais par les
  joueurs eux-mêmes.

**Identité visuelle alignée sur la maquette du site** : les couleurs étaient
déjà identiques (`lib/theme.ts` ≡ `src/app/globals.css`), mais l'app
utilisait les accents en aplat alors que la maquette utilise un dégradé
violet→rose. Ajout de `expo-linear-gradient` + deux composants réutilisables
(`components/PrimaryButton.tsx`, `components/GradientAvatar.tsx`) appliqués
partout (boutons principaux, avatars sans photo, bulles de chat "moi").

**Notation privée des joueurs (like/dislike)** — table `player_ratings`,
lisible uniquement par celui qui note (RLS restreinte à `rater_id = auth.uid()`,
personne d'autre ne voit jamais ces notes, pas même la personne notée). Depuis
`app/session-chat/[id].tsx`, tu peux noter 👍/👎 chaque participant de la
session (une note par paire, écrasée si tu re-notes la même personne plus
tard). Ça sert uniquement à réordonner discrètement *tes propres* listes :
"Joueurs rencontrés" (onglet Chat) remonte les 👍 en premier, "Disponibles"
(onglet Annonces) remonte les annonces des hôtes que tu as bien notés. Jamais
utilisé pour cacher qui que ce soit ni pour un score public — décision prise
explicitement pour éviter tout côté "note publique punitive".

**L'onglet Profil sépare maintenant "vue" et "édition"** :
- `components/ProfileView.tsx` (présentationnel, réutilisable) affiche pseudo,
  avatar, badges console/fréquence, jeux favoris en chips, et le nombre de
  sessions réalisées par jeu (fonction RPC `get_player_game_session_counts`,
  SECURITY DEFINER — nécessaire car `session_requests` a une RLS restreinte
  et je ne peux pas compter les sessions acceptées d'un autre utilisateur
  sans bypasser ça de façon contrôlée ; l'agrégat ne révèle jamais l'identité
  des partenaires de jeu).
- `app/(tabs)/profile.tsx` = `ProfileView` sur soi-même + icône réglages qui
  ouvre `/profile-setup?edit=1` (reprend l'assistant existant mais force le
  retour à l'étape "console" au lieu de sauter à "photo", pour permettre de
  revoir/modifier chaque champ ; termine en revenant sur l'onglet Profil).
- `app/player/[id].tsx` (nouveau) : la même vue pour n'importe quel joueur,
  via la fonction RPC `get_public_profile` — **exclut volontairement
  `switch_friend_code`**, qui reste uniquement révélé via le flux annonces
  existant (`get_host_friend_code`).

**Les pseudos/avatars sont maintenant tapables partout** vers `/player/[id]` :
cartes d'annonces (Disponibles + Les miennes), conversations et sections de
l'onglet Amis (demandes reçues, mes amis, joueurs rencontrés), et les chips
de participants dans le chat de session (à côté des boutons 👍/👎, sans
conflit de geste). Les profils publics sont donc réellement consultables
depuis toute l'app.

**La photo de profil (`GradientAvatar`) accompagne désormais systématiquement
le pseudo partout où il apparaît** : demandeurs en attente et destinataires
de tes demandes envoyées (Annonces), demandes d'ami reçues/mes amis/joueurs
rencontrés (Chat), fil d'activité et aperçu "Annonces pour toi" (Accueil), et
l'en-tête du chat direct (tapable vers `/player/[id]`).

## À venir ensuite
- Notifications (pour l'instant pas d'onglet dédié — envisager un badge sur
  Accueil ou Profil plutôt qu'un 5e onglet)
- Planification de session au-delà des annonces (calendrier récurrent, etc.)
- Optimisation possible : le comptage des places acceptées par annonce se
  fait actuellement par requête séparée (acceptable au volume actuel, à
  revoir si la communauté grandit beaucoup)

## Rappels de principe (toujours valables)

- Pas de géolocalisation, jamais
- Pas de ton "app de rencontre" (éviter swipe/cœur, vocabulaire romantique)
