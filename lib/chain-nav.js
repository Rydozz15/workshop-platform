/**
 * Which step comes after the one a session just finished. Campaigns that randomize the order store
 * each participant's sequence on their sessions; all others follow chain_order.
 */
import { getWorkshop, getNextWorkshopInChain } from '@/lib/db';
import { nextStepId } from '@/lib/step-order';

export async function nextShareCodeFor(session, workshop) {
  if (!workshop || !workshop.chain_id) return null;
  if (Array.isArray(session?.step_sequence)) {
    const nextId = nextStepId(session.step_sequence, workshop.id);
    const next = nextId ? await getWorkshop(nextId) : null;
    return next ? next.share_code : null;
  }
  const next = await getNextWorkshopInChain(workshop.chain_id, (workshop.chain_order || 1) + 1);
  return next ? next.share_code : null;
}
