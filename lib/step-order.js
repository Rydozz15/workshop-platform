/**
 * Per-participant step order for campaigns that randomize it (e.g. control then treatment for some
 * people, treatment then control for others). Pure functions, no I/O.
 *
 * A "sequence" is the list of step (workshop) ids in the order one participant goes through them.
 * It is decided once, when the participant starts, and stored on each of their sessions
 * (sessions.step_sequence) together with the position of that session (sessions.chain_position).
 */

export function permutations(items) {
  if (items.length <= 1) return [items.slice()];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
  );
}

function shuffle(items, rng) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Same set of steps, in any order? */
export function isValidSequence(sequence, stepIds) {
  return (
    Array.isArray(sequence) &&
    sequence.length === stepIds.length &&
    stepIds.every((id) => sequence.includes(id)) &&
    new Set(sequence).size === sequence.length
  );
}

/**
 * Picks an order for a new participant, balanced against the orders already given out.
 * Up to 4 steps (24 orders) it picks one of the least used orders; with more steps it shuffles.
 * `existingSequences` holds one sequence per participant who already started.
 */
export function chooseSequence(stepIds, existingSequences = [], rng = Math.random) {
  if (stepIds.length <= 1) return stepIds.slice();
  if (stepIds.length > 4) return shuffle(stepIds, rng);
  const all = permutations(stepIds);
  const key = (seq) => seq.join('|');
  const counts = new Map(all.map((seq) => [key(seq), 0]));
  existingSequences.forEach((seq) => {
    if (isValidSequence(seq, stepIds) && counts.has(key(seq))) counts.set(key(seq), counts.get(key(seq)) + 1);
  });
  const min = Math.min(...counts.values());
  const leastUsed = all.filter((seq) => counts.get(key(seq)) === min);
  return leastUsed[Math.floor(rng() * leastUsed.length)];
}

/** 1-based position of a step in a sequence (0 when it is not there). */
export function positionIn(sequence, stepId) {
  return Array.isArray(sequence) ? sequence.indexOf(stepId) + 1 : 0;
}

/** The step that follows `stepId` in the sequence, or null at the end (or without a sequence). */
export function nextStepId(sequence, stepId) {
  const pos = positionIn(sequence, stepId);
  return pos > 0 && pos < sequence.length ? sequence[pos] : null;
}

/** Distinct orders in use, one per participant: input for chooseSequence. */
export function sequencesPerParticipant(sessions) {
  const byParticipant = new Map();
  for (const s of sessions) {
    if (!Array.isArray(s.step_sequence)) continue;
    const who = s.chain_user_id || s.id;
    if (!byParticipant.has(who)) byParticipant.set(who, s.step_sequence);
  }
  return [...byParticipant.values()];
}
