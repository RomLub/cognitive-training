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

- **Calcul mental** : sessions de 20 opérations (+ − × ÷), 10 niveaux.
- **Mémoire de travail** : empan de chiffres, 12 séquences par session. Les chiffres s'affichent un par un
  (0,8 s + 0,25 s de pause), puis il faut les restituer dans l'ordre direct (3 à 12 chiffres selon le niveau)
  ou dans l'ordre inverse (un chiffre de moins, car l'inversion est plus exigeante).
- **Difficulté adaptative** (tous domaines) : 3 bonnes réponses d'affilée → niveau +1, 2 erreurs d'affilée →
  niveau −1. Chaque domaine reprend au dernier niveau atteint.
- **Suivi** : historique des sessions (précision, temps moyen, niveau) stocké en localStorage sur l'appareil.
- **Points faibles** : stats par catégorie (opération, ou mode direct/inverse) sur les 10 dernières sessions ;
  la catégorie la moins réussie (au moins 8 réponses) est signalée, le temps servant à départager les ex æquo.
- **Entraînement ciblé** : les sessions suivantes insistent sur ce point faible (50 % des tirages forcés dessus,
  le reste uniforme), si le niveau en cours l'utilise.
- Attention, logique, vitesse : à venir.

## Structure

```
src/
  core/        types partagés, difficulté adaptative, stats, points faibles, aléatoire
  domains/     un dossier par domaine cognitif (logique pure, testée)
  storage/     persistance (interface + implémentation localStorage)
  ui/          composants React ; ui/domains.ts décrit chaque domaine pour l'affichage
```

Chaque domaine produit des `SessionRecord` communs, avec un détail par catégorie. Ajouter un domaine revient à :
un moteur dans `domains/<nom>/`, un composant de session dans `ui/`, une entrée dans `ui/domains.ts` et un cas dans `App.tsx`.

## Dette technique connue

- Stockage localStorage seulement, sans export ni sauvegarde.
- Pas de graphique de progression, seulement un tableau.
- Le ciblage ne vise qu'une opération à la fois, avec une part fixe (pas encore proportionnelle à l'écart).
