/**
 * Consent to send participants' open-ended answers to the external AI provider.
 * Stored once in the `settings` table (value = ISO date of the acceptance) so it holds across browsers.
 * The API routes that call the provider refuse to run without it, whatever the UI does.
 */
export const AI_CONSENT_KEY = 'ai_open_responses_consent';

export const hasAiConsent = (settings) => Boolean(settings && typeof settings[AI_CONSENT_KEY] === 'string' && settings[AI_CONSENT_KEY].trim());

/** Response for a request that arrives without consent. */
export const consentRequiredResponse = (NextResponse) =>
  NextResponse.json({ error: 'consent_required' }, { status: 403 });
