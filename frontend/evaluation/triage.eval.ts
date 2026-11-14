/**
 * `npm run eval:triage` runs the triage rules over the held-out test set
 * (evaluation/triage-sample.json) and writes evaluation/triage-report.md.
 *
 * `npm run eval:triage:tuning` does the same for the tuning set
 * (evaluation/triage-tuning.json -> triage-tuning-report.md). Adjust the rules
 * by looking only at the tuning report; the held-out set is for the final
 * score, so tuning on it would inflate that score.
 *
 * Both report and never fail on a low score, so the numbers can be quoted
 * honestly in the test report.
 */
import { writeFileSync } from 'fs';
import path from 'path';
import { describe, it } from 'vitest';
import { classifyComplaint } from '../src/lib/ai/classifier';
import { evaluateTriage, formatTriageReport, type LabelledComplaint } from '../src/lib/ai/evaluation';
import heldOut from './triage-sample.json';
import tuning from './triage-tuning.json';

const TARGET = Number(process.env.TRIAGE_TARGET ?? 0.8);
const SET = process.env.TRIAGE_SET === 'tuning' ? 'tuning' : 'held-out';
const data = SET === 'tuning' ? tuning : heldOut;
const outFile = SET === 'tuning' ? 'triage-tuning-report.md' : 'triage-report.md';

describe(`triage evaluation (${SET} set)`, () => {
  it(`writes evaluation/${outFile}`, () => {
    const result = evaluateTriage(data.samples as LabelledComplaint[], classifyComplaint);
    const report = formatTriageReport(result, {
      target: TARGET,
      sampleNote: `${SET === 'tuning' ? 'Tuning set. ' : 'Held-out test set. '}${data._note}`,
      date: new Date().toISOString().slice(0, 10),
    });
    const out = path.resolve(__dirname, outFile);
    writeFileSync(out, report);
    const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
    console.log(
      [
        `Triage evaluation on the ${SET} set (${result.total} labelled complaints)`,
        `  category   ${pct(result.category.accuracy)}  (target ${pct(TARGET)})`,
        `  priority   ${pct(result.priority.accuracy)}`,
        `  department ${pct(result.department.accuracy)}`,
        `  critical   ${result.critical.detected}/${result.critical.total} suggested as Critical`,
        `  under-prioritised ${result.underPrioritised.length}`,
        `Report: ${out}`,
      ].join('\n')
    );
  });
});
