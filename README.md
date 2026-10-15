# Cognitive Training

Application web locale pour entretenir ses capacités cognitives.

## Démarrer

```bash
npm install
npm run dev     # http://localhost:5173 (port fixe : l'historique est lié à l'adresse)
npm test        # tests (Vitest)
npm run build   # typecheck + build
```

## Exercices

| Domaine | Exercice | Catégories suivies | Chrono |
| --- | --- | --- | --- |
| Calcul mental | Opérations + − × ÷, 20 par session | opération | non |
| Mémoire de travail | Empan de chiffres : restituer dans l'ordre direct (3 → 12 chiffres) ou inverse (un de moins) | mode | non |
| Attention | Stroop : nommer la couleur de l'encre, pas le mot (touches R B V J, + I M). 20 niveaux : 1-10 classique, 11-15 consigne alternée ENCRE / MOT, 16-20 six couleurs | concordant / discordant / lire le mot | 3 s → 0,74 s |
| Logique | Suites de nombres : arithmétique, géométrique, alternée, écarts croissants, somme des précédents, entremêlée | type de suite | non |
| Vitesse de traitement | Deux séries identiques ou non ? (← / →) | identiques / différentes | selon longueur et niveau |

Tous les exercices partagent :
- **Niveaux adaptatifs** (10, ou 20 pour l'attention) : 3 bonnes réponses d'affilée → niveau +1, 2 erreurs d'affilée →
  niveau −1 ; chaque domaine reprend au dernier niveau atteint. Une session terminée au niveau maximal est signalée :
  c'est le signe qu'il faut étendre l'exercice.
- **Points faibles** : stats par catégorie sur les 10 dernières sessions ; la catégorie la moins réussie
  (au moins 8 réponses) est signalée, et les sessions suivantes insistent dessus (50 % des tirages).

## Progrès

Par domaine : graphique du niveau en fin de session (survol = détail), et **évolution par rapport à soi-même** :
la ligne de base est la moyenne des 3 premières sessions, comparée aux 3 dernières (niveau, précision, temps).
Il n'y a pas de comparaison à la population : les niveaux sont des paliers internes, pas des scores normés.

## Programmes

- **Séance du jour** (~12 min) : tous les domaines, du plus faible au plus fort ; le plus faible a une série double.
- **Express** (~5 min) : calcul mental puis les deux autres domaines les plus faibles.
- **Focus calcul** (~12 min) : calcul, mémoire de travail, calcul.

Le domaine le plus faible = celui dont le niveau est le plus bas par rapport à son échelle (non entraîné en premier).
L'accueil affiche la **série** de jours consécutifs d'entraînement.

## Réponse vocale

Bouton « 🎤 Réponse vocale » en haut à droite, visible seulement si le navigateur gère la reconnaissance vocale
(Edge, Chrome ; pas Firefox). Les réponses comprises : nombres (« 42 » ou « quarante-deux »), couleurs,
« pareil » / « différent », chiffres un par un (« trois huit un »). Sur les exercices chronométrés,
1,5 s de plus est accordée pour compenser le délai de reconnaissance.

Confidentialité : dans Edge et Chrome, l'audio est envoyé aux serveurs de Microsoft / Google pour la transcription.
La fonction est désactivée par défaut.

## Structure

```
src/
  core/        types, difficulté adaptative, stats, points faibles, programmes, série de jours
  domains/     un dossier par domaine : moteur pur et testé (génération, niveaux, libellés)
  storage/     persistance (interface + implémentation localStorage)
  voice/       reconnaissance vocale (Web Speech API) et interprétation des réponses en français
  ui/          composants React ; useAdaptiveSession = moteur de session commun ; domains.ts = registre des domaines
```

Ajouter un exercice : un moteur dans `domains/<nom>/`, un composant de session qui utilise `useAdaptiveSession`,
et une entrée dans `ui/domains.ts`.

## Dette technique connue

- Stockage localStorage seulement, sans export ni sauvegarde.
- Les temps de réponse à la voix incluent le délai de reconnaissance et sont mélangés à ceux au clavier.
- Le ciblage ne vise qu'une catégorie à la fois, avec une part fixe.
- Un exercice par domaine ; la batterie peut s'étoffer (n-back, rotation mentale, calcul en chaîne…).
