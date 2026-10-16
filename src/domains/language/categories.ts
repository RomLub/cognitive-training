/** Reference lists for semantic fluency. Comparison is tolerant (accents, articles, plurals). */

export interface SemanticCategory {
  id: string
  prompt: string
  words: readonly string[]
}

const ANIMALS = [
  'abeille', 'aigle', 'alligator', 'alpaga', 'âne', 'anguille', 'antilope', 'araignée', 'autruche', 'baleine',
  'bélier', 'belette', 'biche', 'bison', 'blaireau', 'bœuf', 'bouc', 'bourdon', 'brebis', 'buffle',
  'caille', 'calamar', 'canard', 'canari', 'caribou', 'castor', 'cerf', 'chacal', 'chameau', 'chamois',
  'chat', 'chauve-souris', 'cheval', 'chenille', 'chèvre', 'chevreuil', 'chien', 'chimpanzé', 'chinchilla', 'chouette',
  'cigale', 'cigogne', 'coccinelle', 'cochon', 'colibri', 'colombe', 'coq', 'corbeau', 'crabe', 'crapaud',
  'crevette', 'criquet', 'crocodile', 'cygne', 'daim', 'dauphin', 'dindon', 'dinde', 'dromadaire', 'écureuil',
  'élan', 'éléphant', 'escargot', 'étoile de mer', 'faisan', 'faucon', 'fourmi', 'furet', 'gazelle', 'geai',
  'gecko', 'girafe', 'gnou', 'gorille', 'grenouille', 'grillon', 'guépard', 'guêpe', 'hamster', 'hérisson',
  'héron', 'hibou', 'hippopotame', 'hirondelle', 'homard', 'huître', 'hyène', 'iguane', 'jaguar', 'kangourou',
  'koala', 'lama', 'lapin', 'lémurien', 'léopard', 'lézard', 'libellule', 'lièvre', 'limace', 'lion',
  'loup', 'loutre', 'lynx', 'macaque', 'marmotte', 'merle', 'méduse', 'mésange', 'moineau', 'mouche',
  'mouette', 'mouffette', 'moule', 'moustique', 'mouton', 'mulet', 'mulot', 'murène', 'mygale', 'orang-outan',
  'orque', 'ours', 'panda', 'panthère', 'papillon', 'paon', 'perroquet', 'perruche', 'phoque', 'pie',
  'pieuvre', 'pigeon', 'pingouin', 'pintade', 'piranha', 'poisson', 'poney', 'porc', 'poule', 'poulpe',
  'poussin', 'puce', 'puma', 'putois', 'python', 'raie', 'rat', 'raton laveur', 'renard', 'renne',
  'requin', 'rhinocéros', 'rossignol', 'rouge-gorge', 'sanglier', 'sardine', 'sauterelle', 'saumon', 'scarabée', 'scorpion',
  'serpent', 'singe', 'souris', 'taupe', 'taureau', 'termite', 'thon', 'tigre', 'tortue', 'toucan',
  'truite', 'vache', 'vautour', 'veau', 'ver', 'vipère', 'zèbre',
]

const FRUITS_VEGETABLES = [
  'abricot', 'ail', 'amande', 'ananas', 'artichaut', 'asperge', 'aubergine', 'avocat', 'banane', 'betterave',
  'brocoli', 'cacahuète', 'carotte', 'cassis', 'céleri', 'cerise', 'champignon', 'châtaigne', 'chou', 'chou-fleur',
  'citron', 'citrouille', 'clémentine', 'coing', 'concombre', 'courge', 'courgette', 'cresson', 'datte', 'échalote',
  'endive', 'épinard', 'figue', 'fenouil', 'fève', 'fraise', 'framboise', 'goyave', 'grenade', 'groseille',
  'haricot', 'kaki', 'kiwi', 'laitue', 'lentille', 'litchi', 'mandarine', 'mangue', 'maïs', 'melon',
  'mirabelle', 'mûre', 'myrtille', 'navet', 'nectarine', 'noisette', 'noix', 'oignon', 'olive', 'orange',
  'pamplemousse', 'panais', 'papaye', 'pastèque', 'patate', 'pêche', 'petit pois', 'piment', 'poire', 'poireau',
  'pois', 'poivron', 'pomme', 'pomme de terre', 'potiron', 'prune', 'pruneau', 'radis', 'raisin', 'rhubarbe',
  'roquette', 'salade', 'salsifis', 'tomate', 'topinambour', 'citron vert', 'kumquat', 'mâche', 'chou de bruxelles', 'fruit de la passion',
]

const JOBS = [
  'acteur', 'agriculteur', 'architecte', 'artisan', 'astronaute', 'avocat', 'banquier', 'bibliothécaire', 'bijoutier', 'boucher',
  'boulanger', 'caissier', 'carreleur', 'charcutier', 'charpentier', 'chauffeur', 'chef', 'chimiste', 'chirurgien', 'coiffeur',
  'comptable', 'cordonnier', 'couturier', 'couvreur', 'cuisinier', 'danseur', 'dentiste', 'designer', 'développeur', 'directeur',
  'écrivain', 'éditeur', 'électricien', 'éleveur', 'enseignant', 'épicier', 'esthéticienne', 'facteur', 'fermier', 'fleuriste',
  'forgeron', 'fromager', 'garagiste', 'gendarme', 'géologue', 'graphiste', 'guide', 'horloger', 'hôtesse', 'infirmier',
  'informaticien', 'ingénieur', 'instituteur', 'jardinier', 'journaliste', 'juge', 'kinésithérapeute', 'libraire', 'livreur', 'maçon',
  'magicien', 'maire', 'mannequin', 'marin', 'mécanicien', 'médecin', 'menuisier', 'militaire', 'moniteur', 'musicien',
  'notaire', 'opticien', 'ostéopathe', 'ouvrier', 'pâtissier', 'pêcheur', 'peintre', 'pharmacien', 'philosophe', 'photographe',
  'physicien', 'pianiste', 'pilote', 'plombier', 'poissonnier', 'policier', 'pompier', 'potier', 'professeur', 'programmeur',
  'psychologue', 'radiologue', 'réalisateur', 'reporter', 'sage-femme', 'sculpteur', 'secrétaire', 'serrurier', 'serveur', 'soldat',
  'sommelier', 'styliste', 'surveillant', 'tailleur', 'taxi', 'technicien', 'traducteur', 'vendeur', 'vétérinaire', 'vigneron',
  'banquière', 'avocate', 'chanteur', 'cascadeur', 'chercheur', 'détective', 'éboueur', 'standardiste', 'urbaniste', 'vitrier',
]

const COUNTRIES = [
  'afghanistan', 'afrique du sud', 'albanie', 'algérie', 'allemagne', 'andorre', 'angola', 'arabie saoudite', 'argentine', 'arménie',
  'australie', 'autriche', 'azerbaïdjan', 'bangladesh', 'belgique', 'bénin', 'biélorussie', 'birmanie', 'bolivie', 'bosnie',
  'botswana', 'brésil', 'bulgarie', 'burkina faso', 'burundi', 'cambodge', 'cameroun', 'canada', 'chili', 'chine',
  'chypre', 'colombie', 'congo', 'corée', 'costa rica', 'côte d’ivoire', 'croatie', 'cuba', 'danemark', 'djibouti',
  'égypte', 'émirats arabes unis', 'équateur', 'érythrée', 'espagne', 'estonie', 'états-unis', 'éthiopie', 'fidji', 'finlande',
  'france', 'gabon', 'gambie', 'géorgie', 'ghana', 'grèce', 'guatemala', 'guinée', 'haïti', 'honduras',
  'hongrie', 'inde', 'indonésie', 'irak', 'iran', 'irlande', 'islande', 'israël', 'italie', 'jamaïque',
  'japon', 'jordanie', 'kazakhstan', 'kenya', 'kirghizistan', 'koweït', 'laos', 'lettonie', 'liban', 'libéria',
  'libye', 'liechtenstein', 'lituanie', 'luxembourg', 'macédoine', 'madagascar', 'malaisie', 'malawi', 'mali', 'malte',
  'maroc', 'maurice', 'mauritanie', 'mexique', 'moldavie', 'monaco', 'mongolie', 'monténégro', 'mozambique', 'namibie',
  'népal', 'nicaragua', 'niger', 'nigeria', 'norvège', 'nouvelle-zélande', 'oman', 'ouganda', 'ouzbékistan', 'pakistan',
  'palestine', 'panama', 'paraguay', 'pays-bas', 'pérou', 'philippines', 'pologne', 'portugal', 'qatar', 'roumanie',
  'royaume-uni', 'russie', 'rwanda', 'salvador', 'sénégal', 'serbie', 'singapour', 'slovaquie', 'slovénie', 'somalie',
  'soudan', 'sri lanka', 'suède', 'suisse', 'syrie', 'tadjikistan', 'tanzanie', 'tchad', 'tchéquie', 'thaïlande',
  'togo', 'tunisie', 'turkménistan', 'turquie', 'ukraine', 'uruguay', 'venezuela', 'vietnam', 'yémen', 'zambie', 'zimbabwe',
  'angleterre', 'écosse', 'pays de galles', 'hollande', 'vatican', 'saint-marin', 'bhoutan', 'brunei', 'cap-vert', 'comores',
]

const CLOTHES = [
  'anorak', 'bandeau', 'baskets', 'béret', 'bermuda', 'blazer', 'blouse', 'blouson', 'bob', 'body',
  'bonnet', 'bottes', 'boxer', 'bretelles', 'cagoule', 'caleçon', 'casquette', 'ceinture', 'châle', 'chapeau',
  'chaussette', 'chaussure', 'chemise', 'chemisier', 'collant', 'combinaison', 'costume', 'cravate', 'débardeur', 'doudoune',
  'écharpe', 'escarpin', 'espadrille', 'foulard', 'gant', 'gilet', 'imperméable', 'jean', 'jogging', 'jupe',
  'jupon', 'kimono', 'legging', 'maillot', 'manteau', 'mitaine', 'moufle', 'nœud papillon', 'pantalon', 'pantoufle',
  'parka', 'peignoir', 'polo', 'poncho', 'pull', 'pyjama', 'robe', 'sandale', 'short', 'slip',
  'smoking', 'soutien-gorge', 'survêtement', 'sweat', 'tablier', 'tailleur', 'tee-shirt', 'tongs', 'tricot', 'tunique',
  'veste', 'veston', 'chaussons', 'mocassin', 'trench', 'cardigan', 'salopette', 'kilt', 'sari', 'toge',
]

export const SEMANTIC_CATEGORIES: readonly SemanticCategory[] = [
  { id: 'animals', prompt: 'des animaux', words: ANIMALS },
  { id: 'fruits-vegetables', prompt: 'des fruits ou des légumes', words: FRUITS_VEGETABLES },
  { id: 'jobs', prompt: 'des métiers', words: JOBS },
  { id: 'countries', prompt: 'des pays', words: COUNTRIES },
  { id: 'clothes', prompt: 'des vêtements', words: CLOTHES },
]

/** Initial letters for phonemic fluency (common, productive in French). */
export const FLUENCY_LETTERS: readonly string[] = ['P', 'M', 'B', 'C', 'F', 'L', 'R', 'S', 'T', 'D']
