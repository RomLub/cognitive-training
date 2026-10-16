# Cognitive Training

Application web locale pour entretenir ses capacités cognitives : 23 exercices dans 9 domaines.

## Démarrer

```bash
npm install
npm run dev     # http://localhost:5173 (port fixe : l'historique est lié à l'adresse)
npm test        # tests (Vitest)
npm run build   # typecheck + build
```

## Sur téléphone

L'interface s'adapte au mobile (boutons au pouce, pavé numérique, raccourcis clavier masqués sur écran tactile)
et l'app est une **PWA** : installable sur l'écran d'accueil, plein écran, utilisable hors ligne une fois chargée.

- **Test rapide sur le Wi-Fi** : `npm run dev:mobile`, puis sur le téléphone `http://<IP du PC>:5173`
  (le PC et le téléphone sur le même réseau ; Windows peut demander d'autoriser Node dans le pare-feu, et un VPN
  peut bloquer l'accès au réseau local). Limites : pas d'installation ni de micro, car ces fonctions exigent HTTPS.
- **Usage quotidien** : publier le build (`npm run build`, dossier `dist/`) sur un hébergement HTTPS ; l'app est
  alors installable et la réponse vocale fonctionne (Chrome Android, Safari iOS).

Les icônes se régénèrent avec `python scripts/generate_icons.py` (Pillow).

## Historique partagé entre appareils (optionnel)

Sans configuration, chaque appareil garde son historique dans son navigateur. Avec un projet **Supabase**, un compte
(e-mail + mot de passe) synchronise sessions, niveaux et points faibles entre le PC et le téléphone :
synchro à la connexion, après chaque session et au retour du réseau ; l'app reste utilisable hors ligne.

Mise en place (une fois) :
1. Créer un projet sur supabase.com (offre gratuite).
2. SQL Editor → exécuter [`supabase/schema.sql`](supabase/schema.sql) (table, RLS : chacun ne voit que ses sessions).
3. Authentication → URL Configuration : *Site URL* = l'adresse publiée de l'app ; ajouter `http://localhost:5173`
   aux *Redirect URLs* (lien de confirmation du compte).
4. Récupérer l'URL du projet et la clé **publishable** (`sb_publishable_…`, Settings → API Keys), puis :
   - en local : fichier `.env.local` avec `VITE_SUPABASE_URL=…` et `VITE_SUPABASE_PUBLISHABLE_KEY=…` ;
   - pour GitHub Pages : variables du dépôt `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` (Settings → Secrets and
     variables → Actions → Variables), puis relancer le déploiement.

Ces deux valeurs sont publiques par conception (la sécurité repose sur la RLS) ; ne jamais utiliser la clé *secret*.
Code : `src/sync/` (interfaces, fusion des historiques, implémentation Supabase, hook de synchro).

## Exercices

| Domaine | Exercice | Principe | Catégories suivies |
| --- | --- | --- | --- |
| Calcul mental | Opérations | + − × ÷ isolées | opération |
| | Calcul en chaîne | un départ puis des opérations affichées une à une, total à garder en tête | ± seules / avec × ÷ |
| | Pourcentages & fractions | pourcentages, fractions, remises, hausses, règle de trois | type de calcul |
| | Estimation | ordre de grandeur parmi 4 valeurs, chronométré | opération |
| Mémoire de travail | Empan de chiffres | restituer une séquence, à l'endroit ou à l'envers | mode |
| | N-back | lettres ou positions : signaler ce qui revient n coups plus tard (n = 1 → 4) | modalité |
| | Blocs de Corsi | reproduire une séquence spatiale, à l'endroit ou à l'envers | mode |
| Mémoire épisodique | Liste de mots | apprendre une liste, pause (jusqu'à 30 s), rappel libre | mots concrets / abstraits |
| | Paires de mots | apprendre des associations, retrouver le partenaire | paires liées / sans lien |
| Attention | Stroop | nommer l'encre, pas le mot ; 20 niveaux (consigne alternée ENCRE/MOT dès 11, 6 couleurs dès 16) | concordant / discordant / lire le mot |
| | Go / No-Go | appuyer à chaque chiffre sauf le 3 (attention soutenue) | appuyer / se retenir |
| | Flanker | direction de la flèche centrale malgré ses voisines | concordant / discordant |
| | Recherche visuelle | une lettre cible présente ou non dans une grille de leurres | présente / absente |
| Fonctions exécutives | Trail Making | relier 1-2-3… ou 1-A-2-B… sans erreur | chiffres / alternance |
| | Tour de Londres | reproduire un modèle en un minimum de coups (2 → 7) | — |
| Raisonnement | Suites de nombres | trouver le terme suivant | type de suite |
| | Matrices | compléter une grille 3×3 de figures (forme, nombre, remplissage) | type de règle |
| | Syllogismes | la conclusion découle-t-elle des prémisses ? (mots inventés) | valide / non valide |
| Vitesse de traitement | Comparaison de séries | deux séries identiques ou non | identiques / différentes |
| | Code symbole-chiffre | traduire des symboles grâce à une clé | symboles distincts / proches |
| Langage | Fluence verbale | citer un maximum de mots en 60 s (catégorie ou lettre), idéalement à voix haute | catégorie / lettre |
| | Anagrammes | retrouver un mot à partir de ses lettres mélangées | mots concrets / abstraits |
| Visuo-spatial | Rotation mentale | même forme tournée, ou reflet en miroir ? | même / miroir |

Tous les exercices partagent :
- **Niveaux adaptatifs** (10, ou 20 pour le Stroop) : 3 réussites d'affilée → niveau +1, 2 échecs d'affilée → niveau −1 ;
  chaque exercice reprend à son dernier niveau. Une session terminée au niveau maximal est signalée.
- **Points faibles** : stats par catégorie sur les 10 dernières sessions ; la catégorie la moins réussie
  (au moins 8 réponses) est signalée, et les sessions suivantes insistent dessus (50 % des tirages).
- Pour les exercices « par bloc » (n-back, liste de mots, paires, Trail Making, fluence…), un item = un bloc entier,
  réussi au-dessus d'un seuil (ex. 85 % en n-back, 70 % des mots rappelés).

## Progrès

Par exercice : graphique du niveau en fin de session (survol = détail), et **évolution par rapport à soi-même** :
la ligne de base est la moyenne des 3 premières sessions, comparée aux 3 dernières (niveau, précision, temps).
Il n'y a pas de comparaison à la population : les niveaux sont des paliers internes, pas des scores normés.

## Programmes

- **Séance du jour** (~12 min) : tes 5 domaines les plus faibles, un exercice chacun (jamais fait d'abord, sinon le
  moins récent) ; le plus faible a une série double.
- **Express** (~5 min) : un exercice de calcul puis les deux autres domaines les plus faibles.
- **Focus calcul** (~12 min) : opérations, calcul en chaîne, pourcentages, estimation.
- **Découverte** (~8 min) : jusqu'à 4 exercices jamais faits, pris dans des domaines différents.

Le domaine le plus faible = celui dont le niveau moyen (rapporté à l'échelle de chaque exercice) est le plus bas ;
un domaine jamais entraîné passe en premier. L'accueil affiche la **série** de jours consécutifs d'entraînement.

## Réponse vocale

Bouton « 🎤 Réponse vocale » en haut à droite, visible seulement si le navigateur gère la reconnaissance vocale
(Edge, Chrome ; pas Firefox). Comprend : nombres (« 42 » ou « quarante-deux »), chiffres un par un, couleurs,
« pareil » / « différent », « gauche » / « droite », « valide » / « non valide », « présent » / « absent »,
« même forme » / « miroir », et des mots libres (rappel, paires, fluence, anagrammes). Sur les exercices chronométrés,
1,5 s de plus est accordée. Pas de voix pour l'estimation, Go/No-Go, Corsi, Trail Making, Tour de Londres et
les matrices (rythme trop rapide ou réponse spatiale).

Confidentialité : dans Edge et Chrome, l'audio est envoyé aux serveurs de Microsoft / Google pour la transcription.
La fonction est désactivée par défaut.

## Structure

```
src/
  core/        types, difficulté adaptative, stats, points faibles, ligne de base, programmes, série, texte
  domains/     un dossier par domaine : moteurs purs et testés (génération, niveaux, libellés, banques de mots)
  storage/     persistance (interface + localStorage), migration de l'ancien format
  voice/       reconnaissance vocale (Web Speech API) et interprétation des réponses en français
  ui/          composants React ; useAdaptiveSession = moteur de session commun ; exercises.ts = catalogue
```

Ajouter un exercice : un moteur dans `domains/<domaine>/`, un composant de session qui utilise `useAdaptiveSession`
(et `SessionFrame`), puis une entrée dans `ui/exercises.ts`. Le test « every exercise » de `src/exercises.test.tsx`
le couvre automatiquement.

## Dette technique connue

- Stockage localStorage seulement, sans export ni sauvegarde.
- Les temps de réponse à la voix incluent le délai de reconnaissance et sont mélangés à ceux au clavier.
- Le ciblage ne vise qu'une catégorie à la fois, avec une part fixe.
- Fluence par catégorie : seuls les mots des listes intégrées sont comptés (un mot juste mais absent est refusé) ;
  fluence par lettre : tout mot de 3 lettres ou plus est accepté, sans dictionnaire.
- Non implémentés : associations visage-nom (il faudrait des images de visages), pliage de papier.
