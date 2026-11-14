/**
 * `npm run eval:triage` — runs the triage rules over evaluation/triage-sample.json
 * and writes evaluation/triage-report.md. It reports; it does not fail on a
 * low score, so the numbers can be quoted honestly in the test report.
 */
import { writeFileSync } from 'fs';
import path from 'path';
import { describe, it } from 'vitest';
import { classifyComplaint } from '../src/lib/ai/classifier';
import { evaluateTriage, formatTriageReport, type LabelledComplaint } from '../src/lib/ai/evaluation';
import sample from './triage-sample.json';

const TARGET = Number(process.env.TRIAGE_TARGET ?? 0.8);

describe('triage evaluation', () => {
  it('writes evaluation/triage-report.md', () => {
    const result = evaluateTriage(sample.samples as LabelledComplaint[], classifyComplaint);
    const report = formatTriageReport(result, {
      target: TARGET,
      sampleNote: sample._note,
      date: new Date().toISOString().slice(0, 10),
    });
    const out = path.resolve(__dirname, 'triage-report.md');
    writeFileSync(out, report);
    const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
    console.log(
      [
        `Triage evaluation on ${result.total} labelled complaints`,
        `  category   ${pct(result.category.accuracy)}  (target ${pct(TARGET)})`,
        `  priority   ${pct(result.priority.accuracy)}`,
        `  department ${pct(result.department.accuracy)}`,
        `  critical   ${result.critical.detected}/${result.critical.total} suggested as Critical`,
        `Report: ${out}`,
      ].join('\n')
    );
  });
});
