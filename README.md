# Cognitive Training

Application web locale pour entretenir ses capacités cognitives.

## Démarrer

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # tests unitaires (Vitest)
npm run build   # typecheck + build
```

## État actuel

- **Calcul mental** : sessions de 20 opérations (+ − × ÷), 10 niveaux, difficulté adaptative
  (3 bonnes réponses d'affilée → niveau +1, 2 erreurs d'affilée → niveau −1). Reprise au dernier niveau atteint.
- **Suivi** : historique des sessions (précision, temps moyen, niveau) stocké en localStorage sur l'appareil.
- **Points faibles** : stats par opération sur les 10 dernières sessions ; l'opération la moins réussie
  (au moins 8 réponses) est signalée, le temps servant à départager les ex æquo.
- Mémoire, attention, logique, vitesse : à venir.

## Structure

```
src/
  core/        types partagés, stats, aléatoire
  domains/     un dossier par domaine cognitif (logique pure, testée)
  storage/     persistance (interface + implémentation localStorage)
  ui/          composants React
```

Chaque domaine produit des `SessionRecord` communs : c'est ce qui permettra de comparer les domaines et de cibler les points faibles.

## Dette technique connue

- Stockage localStorage seulement, sans export ni sauvegarde.
- Pas de graphique de progression, seulement un tableau.
- Les points faibles sont seulement affichés : la génération des exercices ne les cible pas encore.
