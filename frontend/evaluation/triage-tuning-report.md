# Triage evaluation

Generated 2026-11-14 by `npm run eval:triage`.

> Tuning set. Tuning (development) set: synthetic hostel complaints used to adjust the triage rules. Kept separate from triage-sample.json, which is the held-out test set and must not be used for tuning.

## Summary

| Measure | Agreement | Correct |
| :-- | --: | --: |
| Category | 94.3% | 115/122 |
| Priority | 86.9% | 106/122 |
| Department | 95.1% | 116/122 |
| All three | 81.1% | 99/122 |
| Critical complaints suggested as Critical | 100.0% | 12/12 |

Category agreement meets the 80.0% target in the Feasibility Report (objective 3).

## Category by category

| Category | Precision | Recall | Labelled |
| :-- | --: | --: | --: |
| Plumbing | 92.6% | 100.0% | 25 |
| Electrical | 100.0% | 96.0% | 25 |
| Furniture | 89.3% | 100.0% | 25 |
| Sanitation | 94.7% | 81.8% | 22 |
| General | 95.8% | 92.0% | 25 |

## Category confusion

| Labelled \ Suggested | Plumbing | Electrical | Furniture | Sanitation | General |
| :-- | --: | --: | --: | --: | --: |
| **Plumbing** | 25 | 0 | 0 | 0 | 0 |
| **Electrical** | 0 | 24 | 0 | 0 | 1 |
| **Furniture** | 0 | 0 | 25 | 0 | 0 |
| **Sanitation** | 2 | 0 | 2 | 18 | 0 |
| **General** | 0 | 0 | 1 | 1 | 23 |

## Priority confusion

| Labelled \ Suggested | Low | Medium | High | Critical |
| :-- | --: | --: | --: | --: |
| **Low** | 24 | 6 | 0 | 0 |
| **Medium** | 2 | 43 | 5 | 0 |
| **High** | 0 | 1 | 27 | 2 |
| **Critical** | 0 | 0 | 0 | 12 |

## Critical complaints not suggested as Critical

Every complaint stays with the supervisor, who sees and can raise the priority before forwarding (Scope Document X3), but these are the cases to watch.

_None._

## Under-prioritised complaints (3)

| ID | Complaint | Labelled | Suggested |
| :-- | :-- | :-- | :-- |
| d037 | Fan wobbling | Medium | Low |
| d048 | Switchboard cover broken | High | Medium |
| d113 | Roof sheet loose | Medium | Low |

## Category disagreements (7)

| ID | Complaint | Labelled | Suggested |
| :-- | :-- | :-- | :-- |
| d033 | Smoke from fan | Electrical | General |
| d080 | Foul smell from drain | Sanitation | Plumbing |
| d087 | Termite damage in door | Sanitation | Furniture |
| d092 | Ants in cupboard | Sanitation | Furniture |
| d097 | Unclean water cooler | Sanitation | Plumbing |
| d110 | Mould on ceiling | General | Sanitation |
| d118 | Room key lost | General | Furniture |
