/**
 * The symbol dictionary: what each shape traditionally means.
 *
 * Bundled, not fetched. The Searcher used to read four Turkish kahve falı
 * sözlüğü live through Anthropic's server-side web_fetch, which cost a model
 * call, up to eighteen seconds of a fifty-second budget, and a dependency on
 * four sites staying up and staying the same shape. This file replaces all of
 * that: docs/SYMBOLS.md is the source, and it is vendored here as data.
 *
 * What that buys, beyond the seconds: every meaning is now one we can actually
 * point at. The old two-tier "sourced versus general" distinction existed
 * because a fetched meaning and an invented one had to be told apart. With one
 * bundled list there is one tier, and it is honest by construction.
 *
 * Generated from docs/SYMBOLS.md. Edit that file and regenerate rather than
 * editing the array by hand, or the two drift and the documentation stops
 * being the source.
 */

export const SYMBOLS = [
  { name: 'Island', meaning: 'opportunity, new beginnings, independence' },
  { name: 'Tree', meaning: 'growth, stability, family, roots' },
  { name: 'Octopus', meaning: 'complexity, adaptability, many responsibilities' },
  { name: 'Family', meaning: 'unity, support, togetherness' },
  { name: 'Scorpion', meaning: 'danger, jealousy, hidden threat' },
  { name: 'Vulture', meaning: 'endings, transformation, renewal' },
  { name: 'Flame', meaning: 'passion, energy, inspiration' },
  { name: 'Wedding Ring', meaning: 'commitment, marriage, partnership' },
  { name: 'Key', meaning: 'opportunity, solution, access' },
  { name: 'Car', meaning: 'journey, movement, progress' },
  { name: 'Horse', meaning: 'freedom, strength, good news' },
  { name: 'Soldier', meaning: 'discipline, duty, protection' },
  { name: 'Hunter', meaning: 'pursuit, determination, achievement' },
  { name: 'Moon', meaning: 'intuition, cycles, mystery' },
  { name: 'Chimney', meaning: 'home, family, domestic matters' },
  { name: 'Fish', meaning: 'abundance, prosperity, good fortune' },
  { name: 'Axe', meaning: 'decisive action, cutting ties, change' },
  { name: 'Step', meaning: 'progress, stages, moving forward' },
  { name: 'Cane', meaning: 'support, guidance, assistance' },
  { name: 'Head', meaning: 'thoughts, leadership, identity' },
  { name: 'Suitcase', meaning: 'travel, transition, departure' },
  { name: 'Flag', meaning: 'victory, announcement, recognition' },
  { name: 'Cradle', meaning: 'new beginnings, children, nurturing' },
  { name: 'Knife', meaning: 'conflict, separation, decisive action' },
  { name: 'Building', meaning: 'stability, work, structure' },
  { name: 'Cloud', meaning: 'uncertainty, confusion, temporary obstacles' },
  { name: 'Nose', meaning: 'intuition, curiosity, perception' },
  { name: 'Mosque', meaning: 'spirituality, faith, guidance' },
  { name: 'Funeral', meaning: 'endings, transition, closure' },
  { name: 'Ruler', meaning: 'measurement, order, precision' },
  { name: 'Walnut', meaning: 'hidden potential, nourishment, opportunity' },
  { name: 'Gazelle', meaning: 'grace, gentleness, speed' },
  { name: 'Tweezers', meaning: 'precision, selection, removing obstacles' },
  { name: 'Wallet', meaning: 'finances, resources, security' },
  { name: 'Tent', meaning: 'temporary shelter, travel, change' },
  { name: 'Bush', meaning: 'obstacles, hidden matters, growth' },
  { name: 'Pine Tree', meaning: 'longevity, resilience, stability' },
  { name: 'Bag', meaning: 'possessions, responsibilities, carrying burdens' },
  { name: 'Anchor', meaning: 'stability, grounding, security' },
  { name: 'Flower', meaning: 'beauty, growth, happiness' },
  { name: 'Nail', meaning: 'attachment, persistence, something fixed' },
  { name: 'Line', meaning: 'direction, path, continuity' },
  { name: 'Boot', meaning: 'journey, work, perseverance' },
  { name: 'Child', meaning: 'new beginnings, innocence, family' },
  { name: 'Mountain', meaning: 'challenge, ambition, achievement' },
  { name: 'Drum', meaning: 'celebration, announcement, attention' },
  { name: 'Railway', meaning: 'journey, direction, progress' },
  { name: 'Sea', meaning: 'emotions, vast possibilities, uncertainty' },
  { name: 'Mermaid', meaning: 'mystery, attraction, imagination' },
  { name: 'Camel', meaning: 'endurance, patience, carrying burdens' },
  { name: 'Ostrich', meaning: 'avoidance, fear, hiding' },
  { name: 'Lip', meaning: 'communication, affection, attraction' },
  { name: 'Straight, Thick Line', meaning: 'determination, clarity, a direct path' },
  { name: 'Bread', meaning: 'nourishment, abundance, livelihood' },
  { name: 'Hand', meaning: 'help, action, connection' },
  { name: 'Dress', meaning: 'femininity, appearance, social life' },
  { name: 'Pacifier', meaning: 'comfort, childhood, soothing' },
  { name: 'Donkey', meaning: 'patience, hard work, stubbornness' },
  { name: 'House', meaning: 'home, security, family' },
  { name: 'Mouse', meaning: 'small worries, resourcefulness, hidden activity' },
  { name: 'Fez', meaning: 'tradition, culture, identity' },
  { name: 'Hazelnut', meaning: 'nourishment, abundance, potential' },
  { name: 'Elephant', meaning: 'strength, wisdom, memory' },
  { name: 'Pharaoh', meaning: 'authority, power, ancient wisdom' },
  { name: 'Pregnant Woman', meaning: 'fertility, creation, new beginnings' },
  { name: 'Bride', meaning: 'marriage, commitment, transition' },
  { name: 'Bride and Groom', meaning: 'union, partnership, marriage' },
  { name: 'Ship', meaning: 'journey, adventure, progress' },
  { name: 'Rose', meaning: 'love, beauty, passion' },
  { name: 'Judge', meaning: 'justice, decisions, authority' },
  { name: 'Ring', meaning: 'commitment, cycles, agreement' },
  { name: 'Dagger', meaning: 'betrayal, danger, conflict' },
  { name: 'Nurse', meaning: 'care, healing, support' },
  { name: 'Saddlebag', meaning: 'travel, preparation, carrying resources' },
  { name: 'Ewer', meaning: 'hospitality, abundance, cleansing' },
  { name: 'Needle', meaning: 'precision, repair, connection' },
  { name: 'Elderly Person', meaning: 'wisdom, experience, reflection' },
  { name: 'Imam', meaning: 'spirituality, guidance, faith' },
  { name: 'Emperor', meaning: 'authority, leadership, power' },
  { name: 'Cow', meaning: 'abundance, nourishment, fertility' },
  { name: 'Person', meaning: 'self, relationships, human connection' },
  { name: 'Rope', meaning: 'connection, support, restriction' },
  { name: 'Gendarmerie', meaning: 'authority, protection, discipline' },
  { name: 'Razor Blade', meaning: 'precision, separation, cutting ties' },
  { name: 'Jockey', meaning: 'competition, speed, ambition' },
  { name: 'Container', meaning: 'holding, protection, resources' },
  { name: 'Kaaba', meaning: 'spirituality, pilgrimage, faith' },
  { name: 'Grave', meaning: 'endings, remembrance, transformation' },
  { name: 'Goblet', meaning: 'celebration, pleasure, abundance' },
  { name: 'Woman', meaning: 'femininity, relationships, intuition' },
  { name: 'Face', meaning: 'identity, expression, recognition' },
  { name: 'Cage', meaning: 'restriction, confinement, protection' },
  { name: 'Crowd', meaning: 'social life, community, pressure' },
  { name: 'Castle', meaning: 'protection, power, security' },
  { name: 'Pencil', meaning: 'ideas, communication, creativity' },
  { name: 'Heart', meaning: 'love, emotion, relationships' },
  { name: 'Oil Lamp', meaning: 'illumination, hope, guidance' },
  { name: 'Door', meaning: 'opportunity, transition, access' },
  { name: 'Tiger', meaning: 'strength, courage, power' },
  { name: 'Turtle', meaning: 'patience, protection, longevity' },
  { name: 'Karagöz', meaning: 'entertainment, storytelling, observation' },
  { name: 'Carnation', meaning: 'affection, admiration, remembrance' },
  { name: 'Housefly', meaning: 'irritation, nuisance, persistence' },
  { name: 'Square', meaning: 'stability, order, structure' },
  { name: 'Crow', meaning: 'intelligence, mystery, messages' },
  { name: 'Ant', meaning: 'hard work, cooperation, persistence' },
  { name: 'Eagle', meaning: 'freedom, vision, power' },
  { name: 'Bed', meaning: 'rest, intimacy, vulnerability' },
  { name: 'Spoon', meaning: 'nourishment, care, sharing' },
  { name: 'Cauldron', meaning: 'transformation, abundance, gathering' },
  { name: 'Armchair', meaning: 'comfort, authority, rest' },
  { name: 'Shoe', meaning: 'journey, movement, practicality' },
  { name: 'Frog', meaning: 'transformation, fertility, renewal' },
  { name: 'Cup', meaning: 'emotions, receptivity, celebration' },
  { name: 'Wolf', meaning: 'independence, instinct, loyalty' },
  { name: 'Bird', meaning: 'freedom, news, communication' },
  { name: 'Bird\'s Nest', meaning: 'home, family, security' },
  { name: 'Comet', meaning: 'sudden change, opportunity, wishes' },
  { name: 'Well', meaning: 'depth, hidden resources, reflection' },
  { name: 'Lamp', meaning: 'illumination, ideas, hope' },
  { name: 'Sink', meaning: 'cleansing, release, domestic matters' },
  { name: 'Stork', meaning: 'change, travel, new beginnings' },
  { name: 'Medal', meaning: 'achievement, recognition, success' },
  { name: 'Cave', meaning: 'mystery, introspection, hidden things' },
  { name: 'Scissors', meaning: 'separation, decisions, cutting ties' },
  { name: 'Barbecue', meaning: 'gathering, celebration, nourishment' },
  { name: 'Letter', meaning: 'communication, news, information' },
  { name: 'Staircase', meaning: 'progress, transition, advancement' },
  { name: 'Spear', meaning: 'ambition, defense, direct action' },
  { name: 'Horseshoe', meaning: 'luck, protection, opportunity' },
  { name: 'Prayer', meaning: 'spirituality, devotion, hope' },
  { name: 'Pomegranate', meaning: 'abundance, fertility, prosperity' },
  { name: 'Evil Eye Amulet', meaning: 'protection, warding off negativity' },
  { name: 'Number', meaning: 'measurement, sequence, significance' },
  { name: 'Firewood', meaning: 'fuel, warmth, preparation' },
  { name: 'Arrow', meaning: 'direction, focus, movement' },
  { name: 'Fishing Rod', meaning: 'patience, opportunity, pursuit' },
  { name: 'Sickle', meaning: 'harvest, endings, reaping results' },
  { name: 'Bus', meaning: 'travel, community, shared journey' },
  { name: 'Automobile', meaning: 'movement, independence, travel' },
  { name: 'Spider', meaning: 'patience, creativity, interconnectedness' },
  { name: 'Package', meaning: 'gifts, news, something arriving' },
  { name: 'Daisy', meaning: 'innocence, simplicity, happiness' },
  { name: 'Priest', meaning: 'spirituality, tradition, guidance' },
  { name: 'Money', meaning: 'wealth, resources, financial matters' },
  { name: 'Clock', meaning: 'timing, cycles, deadlines' },
  { name: 'Hair', meaning: 'identity, vitality, appearance' },
  { name: 'Beard', meaning: 'wisdom, maturity, masculinity' },
  { name: 'Swing', meaning: 'change, movement, balance' },
  { name: 'Raft', meaning: 'survival, transition, adaptability' },
  { name: 'Chair', meaning: 'rest, support, stability' },
  { name: 'Turban', meaning: 'tradition, identity, spirituality' },
  { name: 'Saz', meaning: 'music, culture, expression' },
  { name: 'Basket', meaning: 'gathering, abundance, carrying' },
  { name: 'Cigarette', meaning: 'stress, habit, release' },
  { name: 'Weapon', meaning: 'conflict, defense, power' },
  { name: 'Fly', meaning: 'irritation, movement, nuisance' },
  { name: 'Black Dots of Various Sizes', meaning: 'worries, obstacles, accumulated issues' },
  { name: 'Broom', meaning: 'cleansing, removal, renewal' },
  { name: 'Cavalryman', meaning: 'movement, authority, action' },
  { name: 'Fountain', meaning: 'abundance, cleansing, flow' },
  { name: 'Candelabrum', meaning: 'illumination, celebration, spirituality' },
  { name: 'Comb', meaning: 'grooming, order, self-care' },
  { name: 'Pistol', meaning: 'conflict, protection, decisive action' },
  { name: 'Coffin', meaning: 'endings, closure, transformation' },
  { name: 'Crown', meaning: 'authority, achievement, recognition' },
  { name: 'Seesaw', meaning: 'balance, instability, changing circumstances' },
  { name: 'Rabbit', meaning: 'fertility, luck, quick developments' },
  { name: 'Chicken', meaning: 'domestic life, nourishment, productivity' },
  { name: 'Peacock', meaning: 'beauty, pride, recognition' },
  { name: 'Telephone', meaning: 'communication, news, connection' },
  { name: 'Pot', meaning: 'nourishment, domestic matters, preparation' },
  { name: 'Scale', meaning: 'balance, justice, decisions' },
  { name: 'Prayer Beads', meaning: 'spirituality, reflection, devotion' },
  { name: 'Saw', meaning: 'effort, separation, cutting through obstacles' },
  { name: 'Pitcher', meaning: 'abundance, hospitality, nourishment' },
  { name: 'Spinning Top', meaning: 'play, cycles, instability' },
  { name: 'Train', meaning: 'journey, progress, major transition' },
  { name: 'Rifle', meaning: 'conflict, defense, power' },
  { name: 'Airplane', meaning: 'travel, freedom, rapid change' },
  { name: 'Kite', meaning: 'freedom, aspiration, play' },
  { name: 'Razor', meaning: 'precision, separation, decisiveness' },
  { name: 'Three Filled Dots', meaning: 'emphasis, abundance, multiple developments' },
  { name: 'Iron', meaning: 'work, smoothing difficulties, domestic matters' },
  { name: 'Grapes', meaning: 'abundance, celebration, prosperity' },
  { name: 'Vase', meaning: 'beauty, receptivity, abundance' },
  { name: 'Body', meaning: 'self, health, physical presence' },
  { name: 'Volcano', meaning: 'powerful emotions, release, transformation' },
  { name: 'Leaf', meaning: 'growth, change, renewal' },
  { name: 'Bat', meaning: 'mystery, intuition, hidden matters' },
  { name: 'Crescent Moon', meaning: 'intuition, cycles, new beginnings' },
  { name: 'Bow', meaning: 'direction, tension, potential' },
  { name: 'Windmill', meaning: 'energy, work, change' },
  { name: 'Sail', meaning: 'travel, direction, opportunity' },
  { name: 'Fan', meaning: 'movement, attention, social energy' },
  { name: 'Snake', meaning: 'transformation, caution, hidden matters' },
  { name: 'Star', meaning: 'hope, guidance, success' },
  { name: 'Egg', meaning: 'new beginnings, potential, fertility' },
  { name: 'Fist', meaning: 'determination, strength, conflict' },
  { name: 'Road', meaning: 'journey, direction, life path' },
  { name: 'Envelope', meaning: 'news, communication, secrets' },
  { name: 'Olive', meaning: 'peace, abundance, reconciliation' },
  { name: 'Chain', meaning: 'connection, restriction, commitment' },
  { name: 'Zurna', meaning: 'music, celebration, cultural expression' },
  { name: 'Giraffe', meaning: 'perspective, ambition, seeing the bigger picture' },
];

/**
 * Words a reader might use for a symbol the list names differently. Kept small
 * and deliberate: every alias is a way the Eye has a real chance of phrasing
 * something, not a thesaurus.
 */
const ALIASES = {
  boat: 'Ship',
  serpent: 'Snake',
  path: 'Road',
  track: 'Road',
  coin: 'Money',
  purse: 'Wallet',
  crescent: 'Crescent Moon',
  blossom: 'Flower',
  petal: 'Flower',
  hound: 'Wolf',
  stairs: 'Staircase',
  stairway: 'Staircase',
  ladder: 'Staircase',
  dot: 'Black Dots of Various Sizes',
  dots: 'Black Dots of Various Sizes',
  speck: 'Black Dots of Various Sizes',
  wing: 'Bird',
  nest: "Bird's Nest",
  blade: 'Knife',
  sword: 'Dagger',
  vessel: 'Ship',
  bloom: 'Flower',
};

const BY_NAME = new Map(SYMBOLS.map((s) => [s.name.toLowerCase(), s]));

/**
 * Longest name first, so "Bird's Nest" is matched before "Bird" and "Pine
 * Tree" before "Tree". Without this the shorter symbol swallows the longer one
 * and every nest in every cup reads as a bird.
 */
const ORDERED = [...SYMBOLS].sort((a, b) => b.name.length - a.name.length);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Whole words only, and forgiving about plurals and apostrophes.
 *
 * Two things this has to get right at once. The list has symbols as short as
 * "Ant", "Car", "Cow", "Bow" and "Sea", and the Eye writes prose, so "a large
 * elephant" must not match Ant and "a scar down the wall" must not match Car:
 * hence the word boundaries.
 *
 * But the Eye also writes "a bird nest" for what the list calls "Bird's Nest",
 * and an exact match there silently falls through to Bird, which is a
 * different fortune. So every word of a name may carry an optional 's and an
 * optional s, and the gap between words is any whitespace. That covers bird
 * nest, birds nest, bird's nest and bird nests without loosening the
 * boundaries that keep Ant out of elephant.
 */
const matcher = (name) => {
  const words = name
    .toLowerCase()
    .split(/\s+/)
    .map((word) => `${escape(word.replace(/['’]s?$/, ''))}(?:['’]?s)?`);
  return new RegExp(`\\b${words.join('\\s+')}\\b`, 'i');
};
const PATTERNS = ORDERED.map((symbol) => ({ symbol, re: matcher(symbol.name) }));
const ALIAS_PATTERNS = Object.entries(ALIASES)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([word, name]) => ({ symbol: BY_NAME.get(name.toLowerCase()), re: matcher(word) }))
  .filter((p) => p.symbol);

/**
 * Match a shape the Eye named to its entry.
 *
 * The Eye names shapes the way a reader talks ("a bird, caught mid-turn"), not
 * as dictionary keys, so this searches inside the phrase. Real names beat
 * aliases, and longer names beat shorter ones.
 */
export function lookupSymbol(shape) {
  const name = String(shape?.name || '').toLowerCase();
  if (!name) return null;

  for (const { symbol, re } of PATTERNS) {
    if (re.test(name)) return { symbol: symbol.name, meaning: symbol.meaning };
  }
  for (const { symbol, re } of ALIAS_PATTERNS) {
    if (re.test(name)) return { symbol: symbol.name, meaning: symbol.meaning };
  }
  return null;
}
