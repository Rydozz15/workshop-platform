/**
 * Spanish strings that reach tr() through a variable (arrays of labels, offline assistant text),
 * so the literal scan cannot see them. They still need en and pt-BR entries in messages-*.js.
 */
import { GLOSSARY_TEXT_KEYS } from '../glossary-data.js';
import { ASSISTANT_TEXT_KEYS } from '../assistant-prompt.js';
import { EXPLANATION_KEYS } from '../stats.js';
import { PREVALENCE_WARNING } from '../irr.js';
import { AI_ERROR_KEYS } from '../ai-engine.js';
import { DEMO_ERRORS } from '../seeds/demo-synthetic.js';
import { ABBR_TEXT_KEYS } from '../abbr-data.js';
import { ALERT_TEXT_KEYS } from '../live-monitor.js';
import { CAMPAIGN_ERROR_KEYS } from '../campaign-errors.js';

export const DYNAMIC_KEYS = [
  ...GLOSSARY_TEXT_KEYS,
  ...ASSISTANT_TEXT_KEYS,
  ...ALERT_TEXT_KEYS,
  ...ABBR_TEXT_KEYS,
  ...EXPLANATION_KEYS,
  PREVALENCE_WARNING,
  ...AI_ERROR_KEYS,
  ...Object.values(DEMO_ERRORS),
  ...CAMPAIGN_ERROR_KEYS,
  'Todas',
  // live view selector
  'Barras',
  'Proporción',
  'Tabla',
  // onboarding
  'Antes de empezar',
  'Cómo funciona',
  'Poco',
  'Algo',
  'Mucho',
  'Lee el caso',
  'Está a un lado de la pantalla (en el celular, en la pestaña “Ver caso”).',
  'Conversa con el asistente',
  'Escribe con tus propias palabras. Enter envía; Shift + Enter hace un salto de línea.',
  'Termina y responde unas preguntas',
  'Cuando quieras cerrar, usa el botón “Terminar conversación”.',
  // results
  'Una fila por sesión',
  'Una fila por persona y paso: condición, duración, respuestas de la encuesta y métricas.',
  'Una fila por mensaje',
  'Cada mensaje de la conversación, con tiempos y métricas del texto.',
  'Seguimiento de cada participante entre pasos',
  'Una fila por participante con sus resultados en cada paso (útil para comparar antes y después).',
  'Una columna por pregunta y paso',
  'Una fila por participante y una columna por pregunta y paso, para cualquier cantidad de pasos.',
  'Mensajes que escribió cada participante',
  // quick analysis labels and magnitudes (lib/quick-analysis.js)
  'Prueba t de Welch',
  'U de Mann-Whitney',
  'Kruskal-Wallis',
  'ANOVA de Welch',
  'd de Cohen',
  'ε² (épsilon cuadrado)',
  'η² (eta cuadrado)',
  'insignificante',
  'pequeño',
  'mediano',
  'grande',
  // analytics effect-size tiers
  'Insignificante',
  'Pequeño',
  'Mediano',
  'Grande',
  // assistant suggestions
  '¿Qué es una condición?',
  '¿Cómo redacto un buen prompt?',
  '¿Necesito consentimiento?',
  '¿Cómo comparto la campaña?',
  '¿Cómo descargo los datos?',
  '¿Qué es el p-valor?',
  '¿Qué es el tamaño del efecto?',
  '¿Cómo proyecto el QR?',
  '¿Qué hago si nadie escribe?',
  '¿Cómo creo una campaña?',
];
