# Prochaine étape : écran de création de profil complet

À construire juste après l'inscription (entre `login.tsx` et `home.tsx`), en remplacement/extension de `profile-setup.tsx` qui ne gère aujourd'hui que la console.

## Champs à ajouter

- **Pseudo** — texte libre, unique si possible (vérifier disponibilité en base)
- **Jeux possédés** — multi-sélection, réutiliser la liste de `automation/games-reference.md` (déjà utilisée côté site pour l'autocomplétion)
- **Disponibilité** — actuellement juste `frequency` (tous les jours / chaque semaine / etc.), à enrichir en quelque chose de plus granulaire (créneaux/jours) si besoin
- **Photo de profil** — upload d'image (nécessite un bucket Supabase Storage + policy RLS dédiée, pas encore créé)
- **Gamer tag / code ami Switch** — identifiant Nintendo pour s'ajouter en ami en jeu, champ texte simple avec un format à valider

## Ce qui existe déjà et qu'il faudra étendre

- Table `public.profiles` (Supabase, projet `bftjufmdxlwbqyhnhoxx`) : actuellement `id, console, frequency, favorite_games, created_at, updated_at` — il manque `pseudo`, `avatar_url`, `switch_friend_code` à ajouter par migration
- `mobile/app/profile-setup.tsx` : ne gère que la console pour l'instant, à transformer en flux multi-étapes
- Pas encore de bucket Supabase Storage pour les photos — à créer avec policy "chacun ne peut modifier que sa propre photo"

## Rappels de principe (toujours valables)

- Pas de géolocalisation, jamais
- Pas de ton "app de rencontre" (éviter swipe/cœur, vocabulaire romantique)
