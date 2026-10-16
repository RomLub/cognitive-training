/** How to play each exercise: shown before it starts, so the user reads the rules without the clock running. */
export const INSTRUCTIONS: Readonly<Record<string, readonly string[]>> = {
  arithmetic: [
    'Calcule le résultat de chaque opération.',
    'Tape-le sur le pavé ou au clavier : la réponse part dès qu’elle a le bon nombre de chiffres.',
  ],
  chain: [
    'Un nombre de départ s’affiche, puis des opérations une à une (+ 7, × 3…).',
    'Garde le total en tête, sans rien noter, puis tape le résultat final.',
  ],
  practical: [
    'Pourcentages, fractions, remises, hausses, règle de trois : calcule de tête.',
    'Exemples : 25 % de 80 = 20 · 3/4 de 60 = 45. Les résultats sont toujours des nombres entiers.',
  ],
  estimation: [
    'Pas besoin du résultat exact : choisis la valeur la plus proche parmi les 4 proposées.',
    'Le temps est court, fie-toi aux ordres de grandeur. Clique ou tape 1 à 4.',
  ],
  'digit-span': [
    'Des chiffres s’affichent un par un : mémorise-les.',
    'Ordre direct : retape-les dans le même ordre. Ordre inverse : à l’envers. Le mode est indiqué avant chaque séquence.',
  ],
  'n-back': [
    'Des lettres ou des cases s’allument une à une.',
    'Appuie sur « Pareil » (ou Espace) quand l’élément est le même qu’il y a n coups ; sinon ne fais rien. n est indiqué en haut.',
  ],
  corsi: [
    'Des blocs s’allument dans un certain ordre.',
    'Touche-les ensuite dans le même ordre, ou à l’envers quand c’est demandé.',
  ],
  'word-list': [
    'Des mots s’affichent un par un : retiens-en le plus possible.',
    'Après une pause, écris tous ceux dont tu te souviens, dans n’importe quel ordre. Pendant la pause, compte à rebours de 3 en 3 dans ta tête.',
  ],
  'word-pairs': [
    'Des paires de mots s’affichent : mémorise les associations.',
    'On te donne ensuite le premier mot de chaque paire : retrouve le second. Il est validé dès qu’il est tapé.',
  ],
  stroop: [
    'Un nom de couleur est écrit dans une autre couleur : donne la couleur de l’encre, pas le mot.',
    'Touches R, B, V, J (puis I, M). Aux niveaux élevés, suis l’étiquette au-dessus du mot : ENCRE ou MOT.',
  ],
  'go-no-go': [
    'Des chiffres défilent vite : appuie (Espace) pour chacun, sauf le 3.',
    'Sur le 3, ne fais rien. Le piège, c’est l’habitude d’appuyer.',
  ],
  flanker: [
    'Une rangée de flèches s’affiche.',
    'Indique la direction de la flèche du milieu, sans te laisser influencer par ses voisines (← / →).',
  ],
  'visual-search': [
    'Une lettre cible est indiquée, puis une grille de leurres qui lui ressemblent.',
    'Dis si la cible est présente ou absente, le plus vite possible (← présente, → absente).',
  ],
  'trail-making': [
    'Clique les cercles dans l’ordre : 1 → 2 → 3…, ou en alternant chiffres et lettres : 1 → A → 2 → B…',
    'Chaque mauvais cercle compte comme une erreur, et le temps est limité.',
  ],
  'tower-of-london': [
    'Déplace les boules pour reproduire le modèle : clique une tige pour prendre la boule du dessus, puis une autre pour la poser.',
    'Il faut réussir en exactement le nombre de coups indiqué : planifie avant de jouer.',
  ],
  'number-series': [
    'Trouve le nombre qui suit dans la suite.',
    'Les règles varient : écarts constants, multiplications, alternances, sommes… L’explication s’affiche après ta réponse.',
  ],
  matrices: [
    'Une grille de 3 × 3 figures suit des règles sur la forme, le nombre et le remplissage.',
    'Trouve la figure qui complète la case vide en regardant lignes et colonnes. Clique-la ou tape son numéro.',
  ],
  syllogisms: [
    'Les mots sont inventés : seule la logique compte.',
    'Si les phrases sont vraies, la conclusion l’est-elle forcément ? Valide (←) ou non valide (→).',
  ],
  'pair-compare': [
    'Deux séries de caractères s’affichent.',
    'Sont-elles exactement identiques ? Réponds vite : ← identiques, → différentes.',
  ],
  'symbol-digit': [
    'Une clé associe chaque symbole à un chiffre.',
    'Pour chaque symbole affiché, tape le chiffre correspondant, le plus vite possible.',
  ],
  fluency: [
    'Cite un maximum de mots de la catégorie demandée, ou commençant par la lettre, avant la fin du temps.',
    'Tape un mot puis Entrée, ou active la réponse vocale et parle. Les doublons ne comptent pas.',
  ],
  anagrams: [
    'Les lettres d’un mot sont mélangées : retrouve le mot.',
    'Il est validé dès que toutes les lettres sont placées. Tu peux retenter jusqu’à la fin du temps.',
  ],
  'mental-rotation': [
    'Deux formes s’affichent ; celle de droite a été tournée.',
    'Est-ce la même forme, ou son reflet dans un miroir ? ← même forme, → miroir.',
  ],
}

export function instructionsFor(exercise: string): readonly string[] {
  const lines = INSTRUCTIONS[exercise]
  if (lines === undefined) throw new Error(`No instructions for exercise ${exercise}`)
  return lines
}
