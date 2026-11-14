# Triage evaluation

Generated 2026-11-14 by `npm run eval:triage`.

> 100 realistic, synthetic hostel complaints written by the project team for the triage evaluation (Feasibility Report objective 3). Labels are the category, priority and department a hostel supervisor would assign. They are NOT real student complaints; replace or extend them with supervisor-verified, anonymised real complaints before quoting accuracy as real-world evidence.

## Summary

| Measure | Agreement | Correct |
| :-- | --: | --: |
| Category | 73.0% | 73/100 |
| Priority | 46.0% | 46/100 |
| Department | 79.0% | 79/100 |
| All three | 36.0% | 36/100 |
| Critical complaints suggested as Critical | 44.4% | 4/9 |

Category agreement does not meet the 80.0% target in the Feasibility Report (objective 3).

## Category by category

| Category | Precision | Recall | Labelled |
| :-- | --: | --: | --: |
| Plumbing | 73.3% | 100.0% | 22 |
| Electrical | 94.1% | 72.7% | 22 |
| Furniture | 77.8% | 70.0% | 20 |
| Sanitation | 80.0% | 44.4% | 18 |
| General | 52.0% | 72.2% | 18 |

## Category confusion

| Labelled \ Suggested | Plumbing | Electrical | Furniture | Sanitation | General |
| :-- | --: | --: | --: | --: | --: |
| **Plumbing** | 22 | 0 | 0 | 0 | 0 |
| **Electrical** | 2 | 16 | 0 | 1 | 3 |
| **Furniture** | 1 | 1 | 14 | 0 | 4 |
| **Sanitation** | 3 | 0 | 2 | 8 | 5 |
| **General** | 2 | 0 | 2 | 1 | 13 |

## Priority confusion

| Labelled \ Suggested | Low | Medium | High | Critical |
| :-- | --: | --: | --: | --: |
| **Low** | 1 | 22 | 4 | 0 |
| **Medium** | 0 | 33 | 8 | 1 |
| **High** | 0 | 13 | 8 | 1 |
| **Critical** | 1 | 4 | 0 | 4 |

## Critical complaints not suggested as Critical

Every complaint stays with the supervisor, who sees and can raise the priority before forwarding (Scope Document X3), but these are the cases to watch.

| ID | Complaint | Labelled | Suggested |
| :-- | :-- | :-- | :-- |
| t010 | Pipe burst behind wall | Critical | Medium |
| t027 | Exposed wires in corridor | Critical | Medium |
| t031 | Burning smell from switchboard | Critical | Medium |
| t037 | Electric shock from switch | Critical | Low |
| t096 | Smoke from the store room | Critical | Medium |

## Under-prioritised complaints (18)

| ID | Complaint | Labelled | Suggested |
| :-- | :-- | :-- | :-- |
| t005 | Toilet blocked | High | Medium |
| t010 | Pipe burst behind wall | Critical | Medium |
| t012 | Dirty water from taps | High | Medium |
| t017 | Bathroom drain smells and backs up | High | Medium |
| t027 | Exposed wires in corridor | Critical | Medium |
| t031 | Burning smell from switchboard | Critical | Medium |
| t033 | Power trips when kettle used | High | Medium |
| t036 | Corridor lights off | High | Medium |
| t037 | Electric shock from switch | Critical | Low |
| t041 | Plug point burnt | High | Medium |
| t067 | Rats in the room | High | Medium |
| t071 | Dead bird on roof | High | Medium |
| t072 | Bed bugs in room | High | Medium |
| t077 | Washroom floor slimy | High | Medium |
| t084 | Ceiling plaster falling | High | Medium |
| t089 | Staircase railing loose | High | Medium |
| t095 | Lift not working | High | Medium |
| t096 | Smoke from the store room | Critical | Medium |

## Category disagreements (27)

| ID | Complaint | Labelled | Suggested |
| :-- | :-- | :-- | :-- |
| t029 | AC not cooling | Electrical | General |
| t030 | Bulb fused in washroom | Electrical | Plumbing |
| t031 | Burning smell from switchboard | Electrical | Sanitation |
| t038 | Exhaust fan not working | Electrical | Plumbing |
| t039 | Heater not working | Electrical | General |
| t041 | Plug point burnt | Electrical | General |
| t054 | Mattress torn | Furniture | General |
| t055 | Curtain rod fell | Furniture | General |
| t056 | Bookshelf wobbling | Furniture | General |
| t060 | Mosquito net on window torn | Furniture | Electrical |
| t062 | Common room sofa broken | Furniture | General |
| t063 | Washroom door does not lock | Furniture | Plumbing |
| t065 | Washroom not cleaned | Sanitation | Plumbing |
| t067 | Rats in the room | Sanitation | General |
| t070 | Mosquitoes in rooms | Sanitation | General |
| t071 | Dead bird on roof | Sanitation | Plumbing |
| t072 | Bed bugs in room | Sanitation | Furniture |
| t073 | Stairs very dirty | Sanitation | General |
| t076 | Termites in cupboard | Sanitation | Furniture |
| t077 | Washroom floor slimy | Sanitation | Plumbing |
| t080 | Lizards in room | Sanitation | General |
| t082 | Ants on the floor | Sanitation | General |
| t084 | Ceiling plaster falling | General | Furniture |
| t090 | Roof leaking when it rains | General | Plumbing |
| t091 | Mirror missing in washroom | General | Plumbing |
| t093 | Gas heater smell | General | Sanitation |
| t098 | Balcony door cannot open | General | Furniture |
