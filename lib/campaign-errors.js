/**
 * Validation messages of the campaign editor. Each is a Spanish source string with {placeholders}; the error
 * carries the filled-in text (for API consumers) plus the key and params so the screen can translate it:
 * tr(error.key, error.params). The keys are listed in CAMPAIGN_ERROR_KEYS for the i18n test.
 */
export const CAMPAIGN_ERRORS = {
  missing: 'Faltan los datos de la campaña.',
  name: 'La campaña necesita un nombre.',
  noSteps: 'La campaña necesita al menos un paso.',
  stepName: 'El paso {n} necesita un nombre.',
  noConditions: '"{step}" necesita al menos una condición.',
  conditionName: 'La condición {n} de "{step}" necesita un nombre.',
  conditionCase: 'La condición "{title}" de "{step}" necesita el caso o escenario que verá el participante.',
  consentUrl: 'El enlace del consentimiento debe empezar con http:// o https://.',
  notFound: 'Campaña no encontrada',
};
export const CAMPAIGN_ERROR_KEYS = Object.values(CAMPAIGN_ERRORS);

const fill = (text, params) => (params ? text.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m)) : text);

/** Error with a readable Spanish message plus the key/params needed to translate it on screen. */
export class CampaignValidationError extends Error {
  constructor(key, params = null) {
    super(fill(key, params));
    this.key = key;
    this.params = params;
  }
}
