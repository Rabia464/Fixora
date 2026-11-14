# Evaluation and Demo Guide

How to produce the evidence for the Test Report and Final Presentation (D6).
It covers the acceptance criteria in the Project Scope Document (section 6) and
the evaluation targets in the Feasibility Report (objectives 2, 3 and 5).

All commands run from `frontend/`.

## 1. Automated tests (acceptance criteria and objective 5)

```bash
npm run check            # lint + type check + all tests
npm run test:coverage    # the same tests with a coverage report
```

Vitest prints how many tests passed, for example `Tests 202 passed (202)`.
Quote that count and the CI run on `main` in the report. Objective 5 asks for at
least 90% of the planned functional test cases to pass.

Which tests prove each acceptance criterion:

| Scope criterion | Tests |
| :-- | :-- |
| F1: no token gives 401 | `src/app/api/v1/__tests__/routes.test.ts`, "returns 401 without a token" for every protected route |
| F1: a supervisor can't open another hostel's complaint (403) | `src/lib/server/__tests__/complaints.test.ts`, "supervisor from another hostel" |
| F1: each account reaches only its dashboard | `src/proxy.ts`; check by hand in the demo (step 7) |
| F2 to F6: Open to Closed with three accounts | `routes.test.ts`, "runs Open → Closed…"; `complaints.test.ts`, "full lifecycle" |
| F3: an out-of-order step gives 409 and leaves the status unchanged | `complaints.test.ts`, "state guards (409)" and "a rejected mutation leaves the stored complaint untouched" |
| F7: every action is in the timeline with actor and time | `complaints.test.ts`, "full lifecycle" (audit list) |
| F8: the affected user is notified | `complaints.test.ts`, "notifies the student on every status change…"; `routes.test.ts`, "notifications" |
| F9: the supervisor changes a suggestion and the change is recorded | `complaints.test.ts`, "records the change from the suggestion…" and "lets the supervisor adjust the triage again…" |
| D5: CI passes lint, types, tests and build | `.github/workflows/ci.yml`, run on `main` |

## 2. Triage accuracy (Feasibility Report objective 3)

```bash
npm run eval:triage          # held-out test set  -> evaluation/triage-report.md
npm run eval:triage:tuning   # tuning set         -> evaluation/triage-tuning-report.md
```

Both commands run the keyword rules in `src/lib/ai/classifier.ts` over a set
of labelled complaints. Each report gives category, priority and department
agreement, confusion matrices, precision and recall per category, and every
Critical complaint the rules ranked lower. The target is set with
`TRIAGE_TARGET` (default 0.8).

### Method

There are two separate sets of labelled complaints:

| Set | File | Size | Use |
| :-- | :-- | --: | :-- |
| Tuning | `evaluation/triage-tuning.json` | 122 | Adjust the rules by looking only at this set's misses |
| Held-out test | `evaluation/triage-sample.json` | 100 | Measure the final rules once and report the score |

A test (`src/lib/ai/__tests__/evaluation.test.ts`) checks that the two sets
share no complaint.

The rules work like this:
- **Category:** each category has strong keywords worth 2 points and weak
  keywords worth 1 point. Title words count double, because the description
  often only says where the problem is. The highest score wins. Building and
  safety-equipment words (wall, ceiling, lift, extinguisher…) send a complaint
  to General only when they outscore every specific trade.
- **Priority:** checked from Critical down to Low, and the first level that
  matches wins. Anything unmatched is Medium.

### Labelling guide

Both sets were labelled with these rules, written before the rules were tuned.

| Priority | Meaning | Examples |
| :-- | :-- | :-- |
| Critical | Immediate danger to people | fire, smoke, gas smell, sparks, burning smell, electric shock, exposed or live wires, short circuit, burst pipe, flooding |
| High | An essential service is out; a room or block can't be secured; someone could be hurt or made ill | no water or power, toilet blocked or overflowing, sewage, door can't lock, shattered glass, falling plaster, loose railing, rats or bed bugs, dead animal, stuck lift, missing extinguisher |
| Medium | A fault that needs repair, with no danger | most "not working" or "broken" complaints |
| Low | Cosmetic, or a minor inconvenience with a workaround | flickering, dim, slow, loose, wobbly, peeling paint, dust, torn mattress |

Category follows the trade that fixes the problem. Plumbing covers water,
pipes, taps, toilets and geysers. Electrical covers power, lights, fans,
sockets, wiring and AC. Furniture covers beds, chairs, tables, cupboards,
doors, locks and windows. Sanitation covers cleaning, garbage, pests and
smells. General covers walls, ceilings, roofs, floors, paint, lifts, fire
safety equipment and laundry machines. Department follows category.

### Results (14 Nov 2026)

| Measure | Before (first-match rules) | After, tuning set | **After, held-out set** |
| :-- | --: | --: | --: |
| Category agreement | 73% | 94.3% | **93%** (target 80%) |
| Priority agreement | 46% | 86.9% | **77%** |
| Department agreement | 79% | 95.1% | **95%** |
| Critical complaints suggested as Critical | 4 of 9 | 12 of 12 | **9 of 9** |
| Complaints ranked below their label | 18 | 3 | **5** |

The held-out run was done once, after the rules were frozen; the rules were
not changed afterwards. On the held-out set, none of the 5 complaints ranked
too low is a safety case: four are Medium complaints suggested as Low, and one
High (a broken bed frame) was suggested as Medium.
Known misses include "bed bugs" (the word "bed" pulls it to Furniture) and
"termites in cupboard". The supervisor reviews every suggestion and can change
any field before forwarding, so a wrong suggestion is caught before work is
assigned.

**Read before quoting the numbers.** Both sets are realistic but synthetic.
The team wrote them and labelled them as a supervisor would, and the same
person wrote the rules, so the held-out score is likely higher than it would
be on real complaints. The Feasibility Report says not to present synthetic
data as evidence of real-world accuracy (section 5 and recommendation 6).
In the report, call the result "93% category agreement on a held-out synthetic
sample". For a real figure, collect anonymised complaints with the hostel
office's permission and have a supervisor label them. Add them as a new
held-out file and run the script once.

**Never tune the rules on the held-out set.** To improve the rules, add
complaints to the tuning set, adjust the rules against
`npm run eval:triage:tuning`, and only then run `npm run eval:triage`.

## 3. Usability check (Feasibility Report objective 2)

Target: a first-time user submits a complaint in under three minutes. Test with
at least five users.

1. Seed the data (`npm run seed -- --reset`) and open the live site.
2. Give each participant the student login and one written task, for example:
   "The tap in your washroom has been leaking since yesterday. Report it."
3. Start a stopwatch when they see the dashboard. Stop it when the success
   message shows. Don't help them unless they are stuck for a minute, and note
   when you did.
4. Then ask them to find the complaint's current status and history.

Record each session like this:

| Participant | Role (student, staff) | Time to submit | Completed alone? | Found status and history? | Comments |
| :-- | :-- | --: | :-- | :-- | :-- |
| P1 | | | | | |

Report the median and the longest time, how many finished in under three
minutes, and the problems people hit.

## 4. End-to-end demo script (acceptance criteria F1 to F9)

Run `npm run seed -- --reset` before the demo. Each step names the account to
use.

1. **Student** (`student@giki.edu.pk`): submit "Tap leaking in washroom", room
   204. The complaint appears as Submitted. Open it to show the suggested
   category (Plumbing) and priority.
2. **Supervisor A** (`supervisor@giki.edu.pk`): the bell shows the new
   complaint. In the Review Queue, press Adjust and change the priority (and,
   if you like, the department). Save. Press Adjust again to show that
   triage can still change before forwarding.
3. Open the complaint. History shows "Supervisor Override" with
   *Changed: Priority: … → …* and the supervisor's name and time.
4. Press **Approve & Forward**.
5. **Student**: the bell shows "being reviewed" and "sent to the Maintenance
   Office".
6. **Maintenance** (`maintenance@giki.edu.pk`): the complaint is in the queue
   with its location and priority. Press **Start Repair**, then **Mark Resolved** with a note.
7. **Student**: confirm the fix. The status becomes Closed and History lists
   every step. Show that typing `/dashboard/supervisor` in the address bar
   sends the student back to their own dashboard.
8. **Supervisor B** (`supervisor.b@giki.edu.pk`): their queue shows only
   Hostel B complaints. The Hostel A complaint from step 1 is not in the
   list, and the API refuses to return it (403; covered by the tests in
   section 1).
9. **Supervisor A**: open Visual Analytics to show counts by category and by
   status (F10).
10. Out-of-order actions (409) are proven by the automated tests. You can show
    the test output, since the UI only offers the actions that are allowed.

The seeded data has 20 complaints across both hostels and covers every status:
Open, Under review, Forwarded, In progress, Resolved, Closed and Reopened. Every
screen therefore has something to show.

## 5. Material for the next documents

- **SRS (D3):** the business rules are in `docs/business_rules.md`, and the
  state machine that enforces F3 is in `frontend/src/lib/server/workflow.ts`.
  The table in section 1 maps each scope feature to its tests.
- **Design document (D4):** the transition table is in
  `frontend/src/lib/server/workflow.ts` and the Firestore collections are in
  `frontend/src/lib/server/db.ts`. The API routes are under
  `frontend/src/app/api/v1/`, and the notification events are listed in the
  `NotificationType` constant.
- **Test report (D6):** use sections 1 to 4 above. Known limitations to state:
  email-only sign-in (Scope X6); keyword triage measured on a synthetic sample
  only; no Firestore emulator or browser end-to-end tests yet
  (`docs/testing_plan.md`).
