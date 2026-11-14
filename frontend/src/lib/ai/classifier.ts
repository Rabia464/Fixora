import {
  CATEGORY_DEPARTMENT,
  DEFAULT_CATEGORY,
  DEFAULT_PRIORITY,
  type ComplaintCategory,
  type ComplaintPriority,
} from '../domain/complaint';

export interface AIPrediction {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  department: string;
}

/**
 * Rule-based triage. Suggestions only: the supervisor reviews every complaint
 * and can change any field before forwarding (Scope Document F4, F9, X3).
 *
 * The keyword lists were tuned on evaluation/triage-tuning.json only. The
 * held-out set (evaluation/triage-sample.json) gives the reported score, so
 * don't add keywords to fix individual held-out misses. See docs/evaluation.md.
 */

/**
 * Builds a matcher for whole words or phrases (plus common English suffixes),
 * so "tap" matches "taps" but not "laptop", and "bed" matches "beds" but not
 * "bedroom". A space in a keyword matches any run of whitespace.
 */
function wordMatcher(keywords: readonly string[]): RegExp {
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'));
  return new RegExp(`\\b(?:${escaped.join('|')})(?:s|es|ed|ing|age|al|ity|y)?\\b`, 'gi');
}

/** Words that strongly identify a category (2 points each match) or hint at it (1 point). */
const CATEGORY_KEYWORDS: Record<Exclude<ComplaintCategory, 'General'>, { strong: string[]; weak: string[] }> = {
  Plumbing: {
    strong: [
      'leak', 'pipe', 'drain', 'tap', 'faucet', 'flush', 'shower', 'geyser', 'cistern', 'commode',
      'urinal', 'basin', 'washbasin', 'sink', 'sewage', 'choke', 'water tank', 'water cooler',
      'hot water', 'no water', 'water heater', 'water pressure', 'water flow', 'bidet', 'plumb',
      'running water', 'drinking water', 'mixer', 'seepage', 'burst',
    ],
    weak: ['water', 'toilet', 'washroom', 'bathroom', 'tank', 'drip', 'flood', 'overflow', 'blocked'],
  },
  Electrical: {
    strong: [
      'electric', 'electricity', 'power', 'light', 'ceiling fan', 'bulb', 'tube light', 'socket', 'plug', 'switch',
      'switchboard', 'wire', 'wiring', 'fan', 'short circuit', 'breaker', 'circuit', 'spark', 'shock',
      'ac', 'air conditioner', 'heater', 'led', 'charger', 'charging point', 'extension board',
      'doorbell', 'outage', 'voltage', 'regulator', 'fuse',
    ],
    weak: ['board', 'trip', 'flicker', 'dim', 'router'],
  },
  Furniture: {
    strong: [
      'bed', 'bunk', 'mattress', 'chair', 'table', 'desk', 'drawer', 'cupboard', 'wardrobe', 'almirah',
      'furniture', 'shelf', 'shelves', 'bookshelf', 'locker', 'sofa', 'curtain', 'lock', 'latch',
      'hinge', 'handle', 'knob', 'door', 'window', 'mesh', 'slat', 'stool', 'ladder',
    ],
    weak: ['glass', 'key'],
  },
  Sanitation: {
    strong: [
      'clean', 'unclean', 'dirty', 'garbage', 'trash', 'rubbish', 'dustbin', 'bin', 'waste', 'pest',
      'insect', 'rodent', 'rat', 'mouse', 'mice', 'cockroach', 'mosquito', 'mosquitoes', 'bedbug',
      'bed bug', 'termite', 'ant', 'fly', 'flies', 'lizard', 'spider', 'cobweb', 'fumigat', 'swept',
      'sweep', 'hygiene', 'droppings', 'stray', 'dead', 'vomit', 'fungus', 'algae', 'slime', 'slimy',
      'mould', 'mold', 'dusty', 'filth',
    ],
    weak: ['smell', 'stink', 'foul', 'dust', 'stagnant'],
  },
};

/**
 * Words that name building structure or safety equipment. They pull a
 * complaint towards General (Maintenance) when nothing more specific matches,
 * and outweigh a passing mention such as "washroom" or "door".
 */
const GENERAL_KEYWORDS = {
  strong: [
    'wall', 'ceiling', 'plaster', 'roof', 'floor tile', 'tile', 'paint', 'whitewash', 'crack', 'railing',
    'lift', 'elevator', 'fire alarm', 'extinguisher', 'fire', 'smoke', 'gas', 'laundry',
    'washing machine', 'iron', 'name plate', 'notice board', 'balcony', 'stair', 'staircase', 'hole',
  ],
  weak: ['floor', 'rain', 'damp'],
};

const CATEGORY_MATCHERS = (Object.keys(CATEGORY_KEYWORDS) as (keyof typeof CATEGORY_KEYWORDS)[]).map(
  (category) => ({
    category,
    strong: wordMatcher(CATEGORY_KEYWORDS[category].strong),
    weak: wordMatcher(CATEGORY_KEYWORDS[category].weak),
  })
);
const GENERAL_MATCHER = { strong: wordMatcher(GENERAL_KEYWORDS.strong), weak: wordMatcher(GENERAL_KEYWORDS.weak) };

const count = (re: RegExp, text: string) => text.match(re)?.length ?? 0;

function score(m: { strong: RegExp; weak: RegExp }, title: string, description: string): number {
  // The title names the problem; the description often mentions where it is,
  // so title words count double.
  const pts = (t: string) => 2 * count(m.strong, t) + count(m.weak, t);
  return 2 * pts(title) + pts(description);
}

function classifyCategory(title: string, description: string): ComplaintCategory {
  let best: ComplaintCategory = DEFAULT_CATEGORY;
  let bestScore = 0;
  // Ties go to the earlier category (Plumbing, Electrical, Furniture, Sanitation).
  for (const { category, strong, weak } of CATEGORY_MATCHERS) {
    const s = score({ strong, weak }, title, description);
    if (s > bestScore) {
      best = category;
      bestScore = s;
    }
  }
  // Structural or safety-equipment complaints go to General when they outscore
  // the best specific category; on a tie the specific trade wins.
  if (score(GENERAL_MATCHER, title, description) > bestScore) return 'General';
  return best;
}

/**
 * Priority, checked from most to least urgent; the first level that matches
 * wins. Critical means an immediate danger to people; High means an essential
 * service is out, a room or block can't be secured, or someone could be hurt
 * or made ill; Low means cosmetic or minor. Everything else is Medium.
 */
const PRIORITY_RULES: [ComplaintPriority, RegExp][] = [
  [
    'Critical',
    wordMatcher([
      'fire', 'smoke', 'gas', 'spark', 'short circuit', 'shock', 'electrocut', 'live wire', 'exposed',
      'burning', 'burnt smell', 'burning smell', 'flood', 'burst', 'gushing', 'emergency',
    ]),
  ],
  [
    'High',
    wordMatcher([
      'no water', 'no power', 'no electricity', 'outage', 'power cut', 'no running water', 'dry',
      'empty', 'blocked', 'choked', 'overflow', 'sewage', 'backing up', 'back up', 'comes back up',
      'cannot lock', 'can not lock', "can't lock", 'cannot be locked', 'cannot be shut', 'stays open',
      'not lock', 'shatter', 'sharp', 'fell', 'falling', 'collapse', 'rat', 'mouse', 'mice', 'rodent',
      'bedbug', 'bed bug', 'dead', 'stray', 'slippery', 'slipped', 'unsafe', 'injur', 'hurt',
      'stuck', 'railing', 'dark', 'fire alarm', 'extinguisher', 'trip', 'melt', 'muddy', 'brown water',
      'dirty water', 'rain water', 'through the roof', 'through the ceiling', 'broke in', 'burnt',
      'not cleaned for', 'whole block', 'whole floor', 'entire floor',
    ]),
  ],
  [
    'Low',
    wordMatcher([
      'flicker', 'dim', 'slow', 'weak', 'low pressure', 'loose', 'wobble', 'wobbly', 'creak', 'noisy',
      'rattl', 'minor', 'small', 'slight', 'scratch', 'peel', 'paint', 'whitewash', 'stain', 'dust',
      'dusty', 'cobweb', 'spider web', 'torn', 'thin', 'ant', 'lizard', 'dropping', 'swept', 'mirror',
      'curtain', 'name plate', 'notice board', 'uneven', 'not cooling', 'cosmetic', 'drawer',
      'regulator', 'banging',
    ]),
  ],
];

function classifyPriority(text: string): ComplaintPriority {
  for (const [priority, re] of PRIORITY_RULES) {
    re.lastIndex = 0;
    if (re.test(text)) return priority;
  }
  return DEFAULT_PRIORITY;
}

/** Rule-based triage: suggests category, priority and routing department. */
export function classifyComplaint(title: string, description: string): AIPrediction {
  const category = classifyCategory(title, description);
  return {
    category,
    priority: classifyPriority(`${title} ${description}`),
    department: CATEGORY_DEPARTMENT[category],
  };
}
