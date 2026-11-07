# Usability test protocol with teachers

> Spanish version: [USABILITY_TEST.es.md](USABILITY_TEST.es.md).

Status: **prepared, not yet run.** Use this document to run the test with 3 to 5 real teachers or researchers per moment of use and to compare the result with the Nielsen heuristic evaluation done on the earlier prototype.

## Goal

Check that someone who runs a workshop can, without help, (1) set up a campaign, (2) monitor it live and solve a problem, and (3) get and understand the results.

## Participants

- 3 to 5 people per moment (ideally the same people do all three, in one ~45 minute session).
- Profile: teachers or researchers who run workshops; at least one person with no previous experience with the platform or with advanced statistics.
- Written informed consent to record screen and voice. Anonymized data (P1, P2…).

## Preparation

- Disposable local instance: `DB_PROVIDER=memory DB_MEMORY_PATH=scratch/usabilidad.json npm run dev`, with the simulated assistant (no real keys).
- Turn on **demo mode** (Settings) for Moment 3, or load sample sessions.
- One person facilitates and another observes. The facilitator **does not help**; they only repeat the prompt. Ask participants to think aloud.

## Tasks

### Moment 1 — Set up
| # | Prompt (no button names) | Success |
| --- | --- | --- |
| 1.1 | "You will run a workshop that compares three assistant styles. Get the activity ready." | Campaign saved with 3 conditions |
| 1.2 | "You want participants to accept a consent notice before they start." | Consent turned on with a link |
| 1.3 | "Add two questions for the end; one must be required." | Questions created, one required |
| 1.4 | "Check how a participant will see it." | Opens the participant view |
| 1.5 | "Change the name of the second condition." | Edit saved |

### Moment 2 — Live (with 4 simulated sessions, one with no messages)
| # | Prompt | Success |
| --- | --- | --- |
| 2.1 | "The workshop is under way. How many people are there and how many finished?" | Correct answer in < 20 s |
| 2.2 | "Someone arrives late and does not have the code. Show it to the room." | Projects the QR |
| 2.3 | "Is there anything you should worry about right now?" | Identifies the alert and its cause |
| 2.4 | "You do not know what to do about that alert. Look for help." | Uses the assistant or the suggested action |

### Moment 3 — Results (demo mode)
| # | Prompt | Success |
| --- | --- | --- |
| 3.1 | "Download the data to analyze it in your own software." | CSV file downloaded |
| 3.2 | "Were there differences between the conditions on the usefulness question?" | Answers in their own words and matches the reading |
| 3.3 | "You do not understand what the p-value is. Find out." | Uses the tooltip or the glossary |
| 3.4 | "Close demo mode." | Leaves demo mode |

## What to measure

- **Success** per task (yes / with help / no), **time** and **errors** (wrong clicks, going back).
- **SUS** (System Usability Scale, 10 items) at the end.
- Open question: "What was the most confusing? What did you expect to find that was not there?"
- Observe: hesitation over texts, terms they do not understand, elements they ignore.

## Suggested acceptance criteria

- ≥ 80 % of tasks completed without help.
- No Moment 2 task taking more than 60 s.
- SUS ≥ 68 (the scale average).
- Every term that two or more people do not understand must be explained where it appears.

## Observation sheet (copy per participant)

```
Participant: P_   Date:   Observer:
Moment / task | result (yes/help/no) | time | errors | verbatim quotes
SUS (1-5 per item): 1__ 2__ 3__ 4__ 5__ 6__ 7__ 8__ 9__ 10__
Most confusing:
What was missing:
```

## Report

Summarize per task: success rate, median time, observed problems with severity (Nielsen 0–4), proposed changes and which ones were applied. Compare with the criticisms in the review document of the earlier prototype.

## Kit to run it

```bash
node scripts/usability-kit.js prepare     # creates the disposable instance with the Moment 2 scenario
node scripts/usability-kit.js analyze obs.csv sus.csv
```

- `obs.csv`: `participant,task,result,seconds,errors` (`result` = `si`, `ayuda` or `no`; `task` = 1.1, 2.3, …).
- `sus.csv`: `participant,a1,…,a10` with answers 1 to 5.
- The output gives the success rate without help, the median time per task, the average SUS and whether the acceptance criteria are met.
