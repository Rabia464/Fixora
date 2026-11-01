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
 * Builds a matcher for whole words (plus common English suffixes), so "tap"
 * matches "taps" but not "laptop", and "bed" matches "beds" but not "bedroom".
 */
function wordMatcher(keywords: string[]): RegExp {
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'));
  return new RegExp(`\\b(?:${escaped.join('|')})(?:s|es|ed|ing|age|al|ity|y)?\\b`, 'i');
}

/** First matching rule wins, so order matters. */
const CATEGORY_RULES: [ComplaintCategory, RegExp][] = [
  ['Plumbing', wordMatcher(['leak', 'pipe', 'water', 'drain', 'tap', 'toilet', 'washroom', 'flush', 'shower'])],
  ['Electrical', wordMatcher(['power', 'electric', 'electrical', 'light', 'socket', 'wire', 'wiring', 'fan', 'short circuit', 'switch', 'bulb'])],
  ['Furniture', wordMatcher(['door', 'window', 'bed', 'chair', 'table', 'furniture', 'lock', 'cupboard', 'wardrobe'])],
  ['Sanitation', wordMatcher(['clean', 'garbage', 'trash', 'pest', 'insect', 'rodent', 'cockroach', 'smell'])],
];

const PRIORITY_RULES: [ComplaintPriority, RegExp][] = [
  ['Critical', wordMatcher(['fire', 'gas', 'spark', 'flood', 'emergency', 'short circuit'])],
  ['High', wordMatcher(['leak', 'no water', 'no power', 'broken', 'unsafe'])],
  ['Low', wordMatcher(['slow', 'minor', 'small'])],
];

function firstMatch<T>(rules: [T, RegExp][], text: string, fallback: T): T {
  return rules.find(([, re]) => re.test(text))?.[0] ?? fallback;
}

/** Rule-based triage: predicts category, priority and routing department. */
export function classifyComplaint(title: string, description: string): AIPrediction {
  const text = `${title} ${description}`;
  const category = firstMatch(CATEGORY_RULES, text, DEFAULT_CATEGORY);
  return {
    category,
    priority: firstMatch(PRIORITY_RULES, text, DEFAULT_PRIORITY),
    department: CATEGORY_DEPARTMENT[category],
  };
}
