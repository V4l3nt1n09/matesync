# Templates de publication MateSync

## post-template-games.svg

Format approuvé pour les posts "jeux compatibles" (Instagram + réutilisable pour Discord). 1080x1080, jusqu'à 3 jeux par publication.

**Pour créer un nouveau post** : copier ce fichier, remplacer pour chaque jeu :
- Le nom du jeu (texte gradient/blanc alterné)
- Le badge sous chaque nom (mode de jeu : "Jusqu'à X joueurs", "PvP + Coop", etc.)
- Le texte de conclusion si besoin

Puis rasteriser avec `rsvg-convert -w 1080 -h 1080 fichier.svg -o fichier.png`.

**Règles de style à respecter :**
- Fond : dégradé radial `#221a38 → #120f1e → #0a0912`
- Texte gradient (titres alternés) : `#8c5cf6 → #ff6aa8`
- Badges : contour `#3ee6a8` (mint), jamais rempli
- Police : Avenir Next / Futura pour les titres, système sans-serif pour le corps, monospace pour les labels/footer
- Toujours terminer par le footer `matesync.fr`
- Maximum 3 jeux par publication (au-delà, la typo doit trop rétrécir)

**Règles de contenu :**
- Uniquement des jeux Nintendo Switch 1/2 réellement jouables en multijoueur ou coop (vérifier avant d'ajouter un titre — ex: Zelda TOTK n'a pas de multi, à ne pas inclure)
- Jamais d'images/captures d'écran des jeux eux-mêmes (droit d'auteur Nintendo) — uniquement le nom en texte
- Ne pas mentionner l'absence de géolocalisation de façon défensive ("on n'en a même pas") — ça alourdit inutilement le message. Le principe reste valable partout ailleurs (pas de géoloc, pas de ton dating app), juste pas dans cette phrase-là.
