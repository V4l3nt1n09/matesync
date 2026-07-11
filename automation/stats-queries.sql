-- Statistiques anonymisées des inscriptions MateSync
-- Projet Supabase : bftjufmdxlwbqyhnhoxx (table public.signups)
-- Ces requêtes n'exposent jamais l'email ni l'identité d'un individu.

-- Total d'inscrits
select count(*) as total from public.signups;

-- Répartition par console / fréquence / motivation
select 'console' as categorie, console as valeur, count(*) as total
from public.signups group by console
union all
select 'frequence', frequency, count(*)
from public.signups group by frequency
union all
select 'motivation', unnest(motivations), count(*)
from public.signups group by 2
order by categorie, total desc;

-- Jeux favoris et remarques (texte libre, anonymisé)
select favorite_games, comment
from public.signups
where favorite_games is not null or comment is not null;
