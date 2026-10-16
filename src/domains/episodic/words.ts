/** Single-word French nouns, common and unambiguous, for memory exercises. */

export const CONCRETE_NOUNS: readonly string[] = [
  'abeille', 'arbre', 'assiette', 'avion', 'bague', 'balai', 'ballon', 'banane', 'bateau', 'bougie',
  'bouteille', 'bouton', 'brosse', 'bureau', 'cactus', 'cadeau', 'camion', 'canapé', 'carotte', 'casque',
  'cerise', 'chaise', 'chameau', 'chapeau', 'château', 'chaussure', 'cheval', 'chocolat', 'ciseaux', 'citron',
  'clavier', 'cloche', 'clou', 'coffre', 'collier', 'couteau', 'couverture', 'crayon', 'cuillère', 'dauphin',
  'drapeau', 'échelle', 'écharpe', 'éléphant', 'enveloppe', 'éponge', 'escalier', 'fauteuil', 'fenêtre', 'feuille',
  'fourchette', 'fraise', 'fromage', 'fusée', 'gant', 'gâteau', 'girafe', 'guitare', 'hamac', 'hélicoptère',
  'horloge', 'jardin', 'journal', 'jupe', 'lampe', 'lapin', 'lavabo', 'livre', 'loupe', 'lunettes',
  'manteau', 'marteau', 'masque', 'médaille', 'miroir', 'montagne', 'moto', 'mouchoir', 'mouton', 'nuage',
  'oignon', 'oiseau', 'orange', 'oreiller', 'panier', 'pantalon', 'papillon', 'parapluie', 'peigne', 'pelle',
  'perroquet', 'piano', 'pinceau', 'pingouin', 'pipe', 'pizza', 'placard', 'plume', 'poire', 'pomme',
  'pont', 'porte', 'poupée', 'radio', 'raquette', 'renard', 'requin', 'robinet', 'robot', 'rocher',
  'sac', 'sandale', 'sapin', 'savon', 'seau', 'serpent', 'sifflet', 'singe', 'soleil', 'stylo',
  'table', 'tambour', 'tapis', 'tasse', 'téléphone', 'tente', 'tigre', 'tomate', 'tortue', 'tracteur',
  'train', 'trompette', 'tuile', 'valise', 'vélo', 'violon', 'voiture', 'volcan', 'yaourt', 'zèbre',
]

export const ABSTRACT_NOUNS: readonly string[] = [
  'amitié', 'audace', 'avenir', 'beauté', 'bonheur', 'bonté', 'calme', 'certitude', 'chance', 'colère',
  'confiance', 'courage', 'croyance', 'curiosité', 'désir', 'destin', 'devoir', 'doute', 'droit', 'éclat',
  'effort', 'élan', 'énergie', 'ennui', 'envie', 'espoir', 'esprit', 'fierté', 'fortune', 'gloire',
  'grâce', 'habitude', 'hasard', 'honneur', 'humour', 'idée', 'justice', 'liberté', 'loisir', 'malice',
  'mémoire', 'mérite', 'misère', 'morale', 'mystère', 'nostalgie', 'orgueil', 'pardon', 'passion', 'patience',
  'pensée', 'peur', 'pitié', 'plaisir', 'politesse', 'pouvoir', 'progrès', 'promesse', 'prudence', 'raison',
  'regret', 'respect', 'rêve', 'richesse', 'rigueur', 'sagesse', 'secret', 'silence', 'solitude', 'souci',
  'souvenir', 'succès', 'surprise', 'talent', 'tendresse', 'théorie', 'tristesse', 'valeur', 'vérité', 'vertu',
]

/** Semantically related pairs: the first word cues the second. */
export const RELATED_PAIRS: readonly (readonly [string, string])[] = [
  ['pain', 'beurre'], ['marteau', 'clou'], ['chien', 'niche'], ['lune', 'étoile'], ['mer', 'vague'],
  ['clé', 'serrure'], ['abeille', 'miel'], ['pluie', 'parapluie'], ['livre', 'page'], ['arbre', 'feuille'],
  ['vache', 'lait'], ['hiver', 'neige'], ['médecin', 'hôpital'], ['professeur', 'école'], ['boulanger', 'baguette'],
  ['train', 'gare'], ['avion', 'aéroport'], ['oiseau', 'nid'], ['poule', 'œuf'], ['tasse', 'café'],
  ['crayon', 'papier'], ['fourchette', 'couteau'], ['chaussure', 'lacet'], ['bougie', 'flamme'], ['jardin', 'fleur'],
  ['cheval', 'selle'], ['guitare', 'corde'], ['pêcheur', 'poisson'], ['montagne', 'sommet'], ['désert', 'sable'],
  ['forêt', 'sapin'], ['roi', 'couronne'], ['soleil', 'chaleur'], ['nuit', 'sommeil'], ['cuisine', 'four'],
  ['peintre', 'tableau'], ['facteur', 'lettre'], ['araignée', 'toile'], ['volcan', 'lave'], ['bateau', 'port'],
  ['savon', 'mousse'], ['château', 'donjon'], ['vin', 'raisin'], ['fromage', 'souris'], ['œil', 'paupière'],
  ['main', 'gant'], ['tête', 'chapeau'], ['porte', 'poignée'], ['horloge', 'aiguille'], ['piano', 'touche'],
]
