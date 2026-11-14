# Triage evaluation

Generated 2026-11-14 by `npm run eval:triage`.

> Held-out test set. 100 realistic, synthetic hostel complaints written by the project team for the triage evaluation (Feasibility Report objective 3). Labels are the category, priority and department a hostel supervisor would assign. They are NOT real student complaints; replace or extend them with supervisor-verified, anonymised real complaints before quoting accuracy as real-world evidence.

## Summary

| Measure | Agreement | Correct |
| :-- | --: | --: |
| Category | 93.0% | 93/100 |
| Priority | 77.0% | 77/100 |
| Department | 95.0% | 95/100 |
| All three | 70.0% | 70/100 |
| Critical complaints suggested as Critical | 100.0% | 9/9 |

Category agreement meets the 80.0% target in the Feasibility Report (objective 3).

## Category by category

| Category | Precision | Recall | Labelled |
| :-- | --: | --: | --: |
| Plumbing | 91.7% | 100.0% | 22 |
| Electrical | 95.7% | 100.0% | 22 |
| Furniture | 83.3% | 100.0% | 20 |
| Sanitation | 100.0% | 83.3% | 18 |
| General | 100.0% | 77.8% | 18 |

## Category confusion

| Labelled \ Suggested | Plumbing | Electrical | Furniture | Sanitation | General |
| :-- | --: | --: | --: | --: | --: |
| **Plumbing** | 22 | 0 | 0 | 0 | 0 |
| **Electrical** | 0 | 22 | 0 | 0 | 0 |
| **Furniture** | 0 | 0 | 20 | 0 | 0 |
| **Sanitation** | 1 | 0 | 2 | 15 | 0 |
| **General** | 1 | 1 | 2 | 0 | 14 |

## Priority confusion

| Labelled \ Suggested | Low | Medium | High | Critical |
| :-- | --: | --: | --: | --: |
| **Low** | 17 | 5 | 5 | 0 |
| **Medium** | 4 | 31 | 6 | 1 |
| **High** | 0 | 1 | 20 | 1 |
| **Critical** | 0 | 0 | 0 | 9 |

## Critical complaints not suggested as Critical

Every complaint stays with the supervisor, who sees and can raise the priority before forwarding (Scope Document X3), but these are the cases to watch.

_None._

## Under-prioritised complaints (5)

| ID | Complaint | Labelled | Suggested |
| :-- | :-- | :-- | :-- |
| t028 | Socket loose | Medium | Low |
| t042 | Lights flicker during evening | Medium | Low |
| t045 | Bed frame broken | High | Medium |
| t051 | Door hinge loose | Medium | Low |
| t056 | Bookshelf wobbling | Medium | Low |

## Category disagreements (7)

| ID | Complaint | Labelled | Suggested |
| :-- | :-- | :-- | :-- |
| t072 | Bed bugs in room | Sanitation | Furniture |
| t076 | Termites in cupboard | Sanitation | Furniture |
| t081 | Kitchenette sink dirty | Sanitation | Plumbing |
| t091 | Mirror missing in washroom | General | Plumbing |
| t093 | Gas heater smell | General | Electrical |
| t097 | Broken glass in courtyard | General | Furniture |
| t098 | Balcony door cannot open | General | Furniture |
