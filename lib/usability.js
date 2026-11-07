/** Analysis helpers for the facilitator usability test (see docs/USABILITY_TEST.md). */

/** SUS score (0-100) from ten answers on a 1-5 scale. Odd items count (x-1), even items (5-x). */
export function susScore(answers) {
  if (!Array.isArray(answers) || answers.length !== 10 || answers.some((a) => !(a >= 1 && a <= 5))) return null;
  const sum = answers.reduce((acc, a, i) => acc + (i % 2 === 0 ? a - 1 : 5 - a), 0);
  return sum * 2.5;
}

const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null;
};

/**
 * rows: [{participant, task, result: 'si'|'ayuda'|'no', seconds, errors}]
 * susByParticipant: { P1: [10 answers], ... }
 */
export function summarizeUsability(rows, susByParticipant = {}) {
  const tasks = {};
  for (const r of rows) {
    const t = (tasks[r.task] ||= { task: r.task, n: 0, unaided: 0, withHelp: 0, failed: 0, seconds: [], errors: 0 });
    t.n++;
    if (r.result === 'si') t.unaided++;
    else if (r.result === 'ayuda') t.withHelp++;
    else t.failed++;
    if (Number.isFinite(r.seconds)) t.seconds.push(r.seconds);
    t.errors += Number(r.errors) || 0;
  }
  const perTask = Object.values(tasks).map((t) => ({
    task: t.task,
    n: t.n,
    unaidedRate: t.unaided / t.n,
    medianSeconds: median(t.seconds),
    errors: t.errors,
  }));
  const total = rows.length;
  const unaided = rows.filter((r) => r.result === 'si').length;
  const scores = Object.values(susByParticipant).map(susScore).filter((s) => s !== null);
  const sus = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  return {
    participants: new Set(rows.map((r) => r.participant)).size,
    unaidedRate: total ? unaided / total : null,
    perTask,
    sus,
    meets: {
      unaided80: total ? unaided / total >= 0.8 : null,
      sus68: sus === null ? null : sus >= 68,
      live60s: perTask.filter((t) => t.task.startsWith('2.')).every((t) => t.medianSeconds === null || t.medianSeconds <= 60),
    },
  };
}

/** Minimal CSV parser for "participant,task,result,seconds,errors" (and "participant,sus1..sus10"). */
export function parseCsv(text) {
  return text.trim().split(/\r?\n/).map((l) => l.split(',').map((c) => c.trim()));
}
