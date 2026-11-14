import { describe, expect, it } from 'vitest';
import { evaluateTriage, formatTriageReport, type LabelledComplaint } from '../evaluation';
import type { AIPrediction } from '../classifier';
import sample from '../../../../evaluation/triage-sample.json';

const item = (
  id: string,
  category: string,
  priority: LabelledComplaint['priority'],
  department = category
): LabelledComplaint => ({ id, title: id, description: '', category, priority, department });

/** A fake classifier that returns a fixed answer per title. */
const fake = (answers: Record<string, AIPrediction>) => (title: string) => answers[title];

describe('evaluateTriage', () => {
  const samples = [
    item('a', 'Plumbing', 'High'),
    item('b', 'Electrical', 'Critical'),
    item('c', 'Furniture', 'Low', 'Maintenance'),
    item('d', 'Sanitation', 'Medium'),
  ];
  const result = evaluateTriage(
    samples,
    fake({
      a: { category: 'Plumbing', priority: 'High', department: 'Plumbing' },
      b: { category: 'Electrical', priority: 'High', department: 'Electrical' },
      c: { category: 'General', priority: 'Low', department: 'Maintenance' },
      d: { category: 'Sanitation', priority: 'Medium', department: 'Sanitation' },
    })
  );

  it('counts agreement per field', () => {
    expect(result.total).toBe(4);
    expect(result.category).toEqual({ correct: 3, accuracy: 0.75 });
    expect(result.priority).toEqual({ correct: 3, accuracy: 0.75 });
    expect(result.department).toEqual({ correct: 4, accuracy: 1 });
    expect(result.exact).toEqual({ correct: 2, accuracy: 0.5 });
  });

  it('builds confusion matrices and per-category precision/recall', () => {
    expect(result.confusion.category.Furniture.General).toBe(1);
    expect(result.confusion.priority.Critical.High).toBe(1);
    expect(result.perCategory.Furniture).toEqual({ precision: 0, recall: 0, support: 1 });
    expect(result.perCategory.General).toEqual({ precision: 0, recall: 0, support: 0 });
    expect(result.perCategory.Plumbing).toEqual({ precision: 1, recall: 1, support: 1 });
  });

  it('lists missed critical and under-prioritised complaints', () => {
    expect(result.critical).toMatchObject({ total: 1, detected: 0, recall: 0 });
    expect(result.critical.missed.map((m) => m.id)).toEqual(['b']);
    expect(result.underPrioritised.map((m) => m.id)).toEqual(['b']);
    expect(result.categoryMisses).toEqual([{ id: 'c', title: 'c', expected: 'Furniture', predicted: 'General' }]);
  });

  it('handles an empty sample without dividing by zero', () => {
    const empty = evaluateTriage([], fake({}));
    expect(empty.category.accuracy).toBe(0);
    expect(empty.critical.recall).toBe(0);
  });

  it('formats a markdown report with a verdict against the target', () => {
    const md = formatTriageReport(result, { target: 0.8, sampleNote: 'Synthetic.', date: '2026-11-14' });
    expect(md).toContain('| Category | 75.0% | 3/4 |');
    expect(md).toContain('does not meet the 80.0% target');
    expect(md).toContain('> Synthetic.');
    expect(md).toContain('Generated 2026-11-14');
    expect(formatTriageReport(result, { target: 0.7 })).toContain('meets the 70.0% target');
    expect(formatTriageReport(evaluateTriage([], fake({})))).toContain('_None._');
  });
});

describe('triage sample', () => {
  const samples = sample.samples as LabelledComplaint[];

  it('has at least 100 labelled complaints with valid labels', () => {
    expect(samples.length).toBeGreaterThanOrEqual(100);
    expect(new Set(samples.map((s) => s.id)).size).toBe(samples.length);
    for (const s of samples) {
      expect(['Plumbing', 'Electrical', 'Furniture', 'Sanitation', 'General']).toContain(s.category);
      expect(['Low', 'Medium', 'High', 'Critical']).toContain(s.priority);
      expect(s.title.trim()).not.toBe('');
    }
  });
});
