/**
 * Measures the triage rules against labelled sample complaints, for the
 * evaluation the Feasibility Report plans (objective 3: at least 80% category
 * agreement with supervisor-verified labels on 100 or more complaints).
 *
 * Pure functions only; `npm run eval:triage` feeds them the sample in
 * evaluation/triage-sample.json and writes evaluation/triage-report.md.
 */

import { CATEGORIES, PRIORITIES, type ComplaintPriority } from '../domain/complaint';
import type { AIPrediction } from './classifier';

export interface LabelledComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  department: string;
}

export interface Miss {
  id: string;
  title: string;
  expected: string;
  predicted: string;
}

export interface TriageEvaluation {
  total: number;
  category: { correct: number; accuracy: number };
  priority: { correct: number; accuracy: number };
  department: { correct: number; accuracy: number };
  /** All three fields right. */
  exact: { correct: number; accuracy: number };
  /** confusion.category[expected][predicted] = count */
  confusion: {
    category: Record<string, Record<string, number>>;
    priority: Record<string, Record<string, number>>;
  };
  perCategory: Record<string, { precision: number; recall: number; support: number }>;
  /**
   * Safety: complaints labelled Critical, and how many the rules ranked lower.
   * The Feasibility Report (risk R1) asks that urgent faults are not
   * under-prioritised, so these are listed separately.
   */
  critical: { total: number; detected: number; recall: number; missed: Miss[] };
  /** Complaints given a lower priority than their label. */
  underPrioritised: Miss[];
  categoryMisses: Miss[];
}

const PRIORITY_RANK: Record<ComplaintPriority, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

const ratio = (n: number, d: number) => (d === 0 ? 0 : n / d);

function emptyMatrix(labels: readonly string[]): Record<string, Record<string, number>> {
  return Object.fromEntries(labels.map((a) => [a, Object.fromEntries(labels.map((b) => [b, 0]))]));
}

function bump(m: Record<string, Record<string, number>>, expected: string, predicted: string) {
  m[expected] ??= {};
  m[expected][predicted] = (m[expected][predicted] ?? 0) + 1;
}

export function evaluateTriage(
  samples: readonly LabelledComplaint[],
  classify: (title: string, description: string) => AIPrediction
): TriageEvaluation {
  const category = emptyMatrix(CATEGORIES);
  const priority = emptyMatrix(PRIORITIES);
  let cat = 0;
  let pri = 0;
  let dep = 0;
  let exact = 0;
  const underPrioritised: Miss[] = [];
  const categoryMisses: Miss[] = [];
  const criticalMissed: Miss[] = [];
  let criticalTotal = 0;

  for (const s of samples) {
    const p = classify(s.title, s.description);
    const catOk = p.category === s.category;
    const priOk = p.priority === s.priority;
    const depOk = p.department === s.department;
    cat += +catOk;
    pri += +priOk;
    dep += +depOk;
    exact += +(catOk && priOk && depOk);
    bump(category, s.category, p.category);
    bump(priority, s.priority, p.priority);

    if (!catOk) categoryMisses.push({ id: s.id, title: s.title, expected: s.category, predicted: p.category });
    const miss = { id: s.id, title: s.title, expected: s.priority, predicted: p.priority };
    if (PRIORITY_RANK[p.priority] < PRIORITY_RANK[s.priority]) underPrioritised.push(miss);
    if (s.priority === 'Critical') {
      criticalTotal += 1;
      if (p.priority !== 'Critical') criticalMissed.push(miss);
    }
  }

  const perCategory: TriageEvaluation['perCategory'] = {};
  for (const c of Object.keys(category)) {
    const tp = category[c]?.[c] ?? 0;
    const support = Object.values(category[c] ?? {}).reduce((a, b) => a + b, 0);
    const predicted = Object.values(category).reduce((a, row) => a + (row[c] ?? 0), 0);
    perCategory[c] = { precision: ratio(tp, predicted), recall: ratio(tp, support), support };
  }

  const n = samples.length;
  return {
    total: n,
    category: { correct: cat, accuracy: ratio(cat, n) },
    priority: { correct: pri, accuracy: ratio(pri, n) },
    department: { correct: dep, accuracy: ratio(dep, n) },
    exact: { correct: exact, accuracy: ratio(exact, n) },
    confusion: { category, priority },
    perCategory,
    critical: {
      total: criticalTotal,
      detected: criticalTotal - criticalMissed.length,
      recall: ratio(criticalTotal - criticalMissed.length, criticalTotal),
      missed: criticalMissed,
    },
    underPrioritised,
    categoryMisses,
  };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

function matrixTable(m: Record<string, Record<string, number>>, labels: readonly string[]): string {
  const head = `| Labelled \\ Suggested | ${labels.join(' | ')} |`;
  const sep = `| :-- | ${labels.map(() => '--:').join(' | ')} |`;
  const rows = labels.map((a) => `| **${a}** | ${labels.map((b) => m[a]?.[b] ?? 0).join(' | ')} |`);
  return [head, sep, ...rows].join('\n');
}

function missTable(misses: Miss[]): string {
  if (misses.length === 0) return '_None._';
  return [
    '| ID | Complaint | Labelled | Suggested |',
    '| :-- | :-- | :-- | :-- |',
    ...misses.map((m) => `| ${m.id} | ${m.title.replace(/\|/g, '\\|')} | ${m.expected} | ${m.predicted} |`),
  ].join('\n');
}

/** Markdown report for the test report (D6). `target` is the agreement goal. */
export function formatTriageReport(
  r: TriageEvaluation,
  opts: { target?: number; sampleNote?: string; date?: string } = {}
): string {
  const target = opts.target ?? 0.8;
  const verdict = r.category.accuracy >= target ? 'meets' : 'does not meet';
  return [
    '# Triage evaluation',
    '',
    opts.date ? `Generated ${opts.date} by \`npm run eval:triage\`.` : 'Generated by `npm run eval:triage`.',
    '',
    opts.sampleNote ? `> ${opts.sampleNote}` : '',
    '',
    '## Summary',
    '',
    '| Measure | Agreement | Correct |',
    '| :-- | --: | --: |',
    `| Category | ${pct(r.category.accuracy)} | ${r.category.correct}/${r.total} |`,
    `| Priority | ${pct(r.priority.accuracy)} | ${r.priority.correct}/${r.total} |`,
    `| Department | ${pct(r.department.accuracy)} | ${r.department.correct}/${r.total} |`,
    `| All three | ${pct(r.exact.accuracy)} | ${r.exact.correct}/${r.total} |`,
    `| Critical complaints suggested as Critical | ${pct(r.critical.recall)} | ${r.critical.detected}/${r.critical.total} |`,
    '',
    `Category agreement ${verdict} the ${pct(target)} target in the Feasibility Report (objective 3).`,
    '',
    '## Category by category',
    '',
    '| Category | Precision | Recall | Labelled |',
    '| :-- | --: | --: | --: |',
    ...Object.entries(r.perCategory).map(
      ([c, s]) => `| ${c} | ${pct(s.precision)} | ${pct(s.recall)} | ${s.support} |`
    ),
    '',
    '## Category confusion',
    '',
    matrixTable(r.confusion.category, CATEGORIES),
    '',
    '## Priority confusion',
    '',
    matrixTable(r.confusion.priority, PRIORITIES),
    '',
    '## Critical complaints not suggested as Critical',
    '',
    'Every complaint stays with the supervisor, who sees and can raise the priority before forwarding (Scope Document X3), but these are the cases to watch.',
    '',
    missTable(r.critical.missed),
    '',
    `## Under-prioritised complaints (${r.underPrioritised.length})`,
    '',
    missTable(r.underPrioritised),
    '',
    `## Category disagreements (${r.categoryMisses.length})`,
    '',
    missTable(r.categoryMisses),
    '',
  ].join('\n');
}
