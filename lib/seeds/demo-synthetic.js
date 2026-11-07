/**
 * Synthetic demo campaigns ("Demo sintética") built to show almost every case in the app in a video.
 * Everything is generated from a fixed seed, so the same data appears every time. No real people.
 *
 * Campaigns (share codes in parentheses):
 *   A  Tutor de escritura académica (sint01)  3 steps, randomized order, 24 participants, 3 + 2 + 1 conditions
 *   B  Piloto de resumen, pausado (sint11)    1 step, 2 conditions, 5 sessions (too few for statistics)
 *   C  Campaña vacía (sint21)                 1 step, nobody has entered yet
 *
 * What campaign A covers:
 *   - Step 1 has 3 conditions (multi-group test), step 2 is unbalanced (imbalance alert), step 3 has 1 condition.
 *   - Counterbalanced step order: all 6 orders of 3 steps, 4 participants each.
 *   - Ceiling effect in one condition (non-parametric route) and unequal variances in another (Welch route).
 *   - Every question type: likert (1-5 and 1-7, reverse-coded), multiple, dropdown, checklist (min/max), text,
 *     "Otro" answers, optional questions left blank, a completed session without survey.
 *   - Dialogue shapes: one-shot, short, deep; Spanish and English; skipped reading, long inactivity, blurred tab.
 *   - Live states: active now, joined and never wrote (stalled), open for more than 2 hours.
 *   - Consent, condition shown to the participant, final message, hypothesis.
 */

const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

// ---------- deterministic randomness ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rng = mulberry32(20261107);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const normal = () => {
  const u = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Stable ids so the demo data can be found and removed later. */
let idRng = mulberry32(777);
/** Restarts both streams so every build produces the same data and the same ids. */
function reseed(seed) {
  rng = mulberry32(seed);
  idRng = mulberry32(seed + 1);
}
function uid() {
  const h = () => Math.floor(idRng() * 0x100000000).toString(16).padStart(8, '0');
  const a = h() + h() + h() + h();
  return `5d${a.slice(2, 8)}-${a.slice(8, 12)}-4${a.slice(13, 16)}-a${a.slice(17, 20)}-${a.slice(20, 32)}`;
}

// ---------- fixed ids ----------
const V = { c1: uid(), c2: uid(), c3: uid(), c4: uid(), c5: uid(), c6: uid(), p1: uid(), p2: uid(), e1: uid() };
const W = { s1: uid(), s2: uid(), s3: uid(), pilot: uid(), empty: uid() };
const CHAIN_A = uid();

// ---------- conditions (versions) ----------
const versions = [
  {
    id: V.c1,
    title: 'Control — respuesta directa',
    case_content:
      '# Tu borrador de tesis\n\nEstás escribiendo la **introducción de tu tesis de maestría** sobre deserción universitaria en el primer año. Tu directora dice que "falta un vacío claro" y que la justificación se parece a los antecedentes.\n\n## Tu objetivo\nObtener ayuda para mejorar el borrador. El asistente responde de forma directa, sin hacerte preguntas.',
    system_prompt: 'Eres un tutor de escritura académica. Responde de inmediato con una versión mejorada y una lista corta de cambios.',
  },
  {
    id: V.c2,
    title: 'Guiado — pregunta primero',
    case_content:
      '# Tu borrador de tesis\n\nEstás escribiendo la **introducción de tu tesis de maestría** sobre deserción universitaria en el primer año. Tu directora dice que "falta un vacío claro" y que la justificación se parece a los antecedentes.\n\n## Tu objetivo\nObtener ayuda para mejorar el borrador. El asistente primero te pregunta por tu contexto y luego propone cambios.',
    system_prompt: 'Eres un tutor de escritura académica. Antes de proponer cambios, haz una o dos preguntas sobre el contexto, el lector y el propósito del texto.',
  },
  {
    id: V.c3,
    title: 'Socrático — andamiaje',
    case_content:
      '# Tu borrador de tesis\n\nEstás escribiendo la **introducción de tu tesis de maestría** sobre deserción universitaria en el primer año. Tu directora dice que "falta un vacío claro" y que la justificación se parece a los antecedentes.\n\n## Tu objetivo\nObtener ayuda para mejorar el borrador. El asistente te guía con preguntas para que encuentres tú el vacío.',
    system_prompt: 'Eres un tutor socrático de escritura académica. No reescribas el texto: guía con preguntas y pide al estudiante que formule el vacío con sus palabras.',
  },
  {
    id: V.c4,
    title: 'Reescritura — con rúbrica visible',
    case_content:
      '# Reescritura con rúbrica\n\nTienes la rúbrica de la facultad (claridad del vacío, coherencia, uso de fuentes, voz académica). Reescribe tu introducción con ayuda del asistente y usa la rúbrica para decidir qué mejorar.\n\n## Tu objetivo\nLlegar a una versión que cumpla al menos tres de los cuatro criterios.',
    system_prompt: 'Ayuda a reescribir usando la rúbrica de cuatro criterios. Cita el criterio al que responde cada sugerencia.',
  },
  {
    id: V.c5,
    title: 'Reescritura — sin rúbrica',
    case_content:
      '# Reescritura sin rúbrica\n\nReescribe tu introducción con ayuda del asistente. No tienes rúbrica: decide tú qué mejorar.\n\n## Tu objetivo\nLlegar a una versión que tu directora pueda aprobar.',
    system_prompt: 'Ayuda a reescribir el texto según lo que pida el estudiante.',
  },
  {
    id: V.c6,
    title: 'Seguimiento — conversación libre',
    case_content:
      '# Seguimiento\n\nHan pasado unos días. Cuéntale al asistente cómo avanzó tu escritura y qué sigue.\n\n## Tu objetivo\nPlanear los próximos pasos de tu capítulo.',
    system_prompt: 'Eres un tutor de escritura. Ayuda a planear los siguientes pasos con base en lo que cuente el estudiante.',
  },
  {
    id: V.p1,
    title: 'Piloto — resumen con ejemplo',
    case_content: '# Resumen con ejemplo\n\nResume en 150 palabras el artículo asignado. El asistente te muestra un ejemplo de buen resumen.',
    system_prompt: 'Muestra un ejemplo breve de resumen y ayuda al estudiante a escribir el suyo.',
  },
  {
    id: V.p2,
    title: 'Piloto — resumen sin ejemplo',
    case_content: '# Resumen sin ejemplo\n\nResume en 150 palabras el artículo asignado. El asistente solo responde tus preguntas.',
    system_prompt: 'Responde preguntas del estudiante sobre su resumen sin mostrar ejemplos.',
  },
  {
    id: V.e1,
    title: 'Campaign — open conversation',
    case_content: '# Open conversation\n\nTalk to the assistant about a writing problem you are facing right now.',
    system_prompt: 'You are a friendly academic writing tutor.',
  },
].map((v) => ({ ...v, is_active: true }));

// ---------- survey questions ----------
const q = {
  confianza: { id: 'confianza', text: 'Me sentí seguro/a de mi escritura académica durante esta sesión.', type: 'likert', scale: [1, 2, 3, 4, 5], minLabel: 'Nada de acuerdo', maxLabel: 'Totalmente de acuerdo' },
  claridad: { id: 'claridad', text: 'Las respuestas del asistente fueron claras.', type: 'likert', scale: [1, 2, 3, 4, 5], minLabel: 'Nada de acuerdo', maxLabel: 'Totalmente de acuerdo' },
  utilidad: { id: 'utilidad', text: 'Lo que me propuso el asistente me sirvió para mi texto.', type: 'likert', scale: [1, 2, 3, 4, 5], minLabel: 'Nada de acuerdo', maxLabel: 'Totalmente de acuerdo' },
  frustracion: { id: 'frustracion', text: 'Me sentí frustrado/a con la conversación.', type: 'likert', scale: [1, 2, 3, 4, 5], reverse: true, minLabel: 'Nada de acuerdo', maxLabel: 'Totalmente de acuerdo' },
  dificultad: { id: 'dificultad', text: '¿Qué tan difícil fue la tarea de escritura?', type: 'likert', scale: [1, 2, 3, 4, 5, 6, 7], minLabel: 'Muy fácil', maxLabel: 'Muy difícil' },
  herramienta: { id: 'herramienta', text: '¿Qué herramienta de IA usas normalmente para escribir?', type: 'multiple', options: ['Ninguna', 'ChatGPT', 'Claude', 'Gemini', 'Corrector del procesador de texto'], allowOther: true, required: true },
  nivel: { id: 'nivel', text: '¿Cuál es tu nivel de estudios?', type: 'dropdown', options: ['Pregrado', 'Maestría', 'Doctorado', 'Posdoctorado'], required: true },
  acciones: { id: 'acciones', text: 'Durante la conversación, el asistente… (marca de 1 a 3)', type: 'checklist', options: ['Me preguntó por mi contexto antes de aconsejar', 'Reescribió mi texto sin preguntar', 'Me pidió explicar el vacío con mis palabras', 'Citó el criterio de la rúbrica', 'Me dio una lista de pasos'], allowOther: true, minSelections: 1, maxSelections: 3, required: true },
  comentario: { id: 'comentario', text: '¿Qué cambiarías de esta conversación?', type: 'text', minChars: 20, maxChars: 400, required: false },
  razon: { id: 'razon', text: 'Explica en una frase qué fue lo más útil.', type: 'text', maxChars: 300, required: false },
  recomendaria: { id: 'recomendaria', text: '¿Recomendarías este asistente a un compañero?', type: 'multiple', options: ['Sí', 'Quizá', 'No'], required: true },
  cambio: { id: 'cambio', text: '¿Cómo cambió tu forma de escribir después de las sesiones?', type: 'text', minChars: 30, required: false },
};

const surveyS1 = [q.confianza, q.claridad, q.utilidad, q.frustracion, q.herramienta, q.nivel, q.acciones, q.comentario];
const surveyS2 = [q.confianza, q.claridad, q.utilidad, q.frustracion, q.dificultad, q.acciones, q.razon];
const surveyS3 = [q.confianza, q.claridad, q.utilidad, q.recomendaria, q.cambio];

const surveyPilot = [
  { id: 'claridad', text: 'El resumen que escribí quedó claro.', type: 'likert', scale: [1, 2, 3, 4, 5], minLabel: 'Nada de acuerdo', maxLabel: 'Totalmente de acuerdo' },
  { id: 'comentario', text: '¿Algo que mejorar?', type: 'text', required: false },
];

// ---------- participants ----------
const STEPS = ['s1', 's2', 's3'];
const STEP_ID = { s1: W.s1, s2: W.s2, s3: W.s3 };
const ORDERS = [
  ['s1', 's2', 's3'], ['s1', 's3', 's2'], ['s2', 's1', 's3'],
  ['s2', 's3', 's1'], ['s3', 's1', 's2'], ['s3', 's2', 's1'],
];

const N = 24;
const participants = Array.from({ length: N }, (_, i) => {
  const n = i + 1;
  return {
    n,
    name: `Participante ${String(n).padStart(2, '0')}`,
    chainUser: uid(),
    order: ORDERS[i % 6],
    ability: normal() * 0.7,
    english: [7, 15, 21].includes(n),
  };
});

// Step 1: balanced 8/8/8 over C1, C2, C3. Step 2: unbalanced 17 with rubric / 7 without.
const s1Cond = (p) => [V.c1, V.c2, V.c3][(p.n - 1) % 3];
const s2Cond = (p) => (p.n % 24 < 7 && p.n % 24 !== 0 ? V.c5 : V.c4);
const stepCond = { s1: s1Cond, s2: s2Cond, s3: () => V.c6 };

// Progress by participant: how far each person got and what state the last session is in.
//   P19, P20 stopped before the last step; P21 is chatting now; P22 joined and never wrote;
//   P23 has been open for hours; P24 completed everything but skipped the surveys.
const progress = (p) => {
  if (p.n === 19 || p.n === 20) return { done: 1, last: 'abandoned' };
  if (p.n === 21) return { done: 1, last: 'live' };
  if (p.n === 22) return { done: 0, last: 'stalled' };
  if (p.n === 23) return { done: 1, last: 'long-open' };
  return { done: 3, last: null };
};

// ---------- survey answers ----------
const STEP_EFFECT = { s1: { [V.c1]: -0.1, [V.c2]: 0.8, [V.c3]: 2.0 }, s2: { [V.c4]: 1.0, [V.c5]: 0 }, s3: { [V.c6]: 0.5 } };
const SD = { [V.c1]: 0.55, [V.c2]: 0.6, [V.c3]: 0.45, [V.c4]: 1.1, [V.c5]: 0.4, [V.c6]: 0.6 };

function surveyAnswers(p, stepKey, condId, position) {
  const latent = 2.9 + p.ability + (STEP_EFFECT[stepKey][condId] || 0) + position * 0.1;
  const sd = SD[condId] || 0.6;
  const lik = (shift = 0, max = 5) => String(clamp(Math.round(latent + shift + normal() * sd), 1, max));
  const a = {};
  a.confianza = lik();
  // Perceived clarity sits near the ceiling in every condition: the survey cannot tell the conditions apart.
  a.claridad = String(clamp(Math.round(4.35 + normal() * 0.5), 1, 5));
  a.utilidad = lik(0.1);
  if (stepKey !== 's3') a.frustracion = String(clamp(Math.round(6 - latent + normal() * sd), 1, 5));
  if (stepKey === 's2') a.dificultad = String(clamp(Math.round(4.5 - (p.ability + 0.3) + normal() * 0.8), 1, 7));

  if (stepKey === 's1') {
    const tools = ['Ninguna', 'ChatGPT', 'ChatGPT', 'Claude', 'Gemini', 'Corrector del procesador de texto'];
    if (rng() < 0.15) {
      a.herramienta = '__other__';
      a.herramienta__other = pick(['Perplexity', 'Copilot de la universidad', 'DeepL Write']);
    } else {
      a.herramienta = pick(tools);
    }
    a.nivel = p.n % 5 === 0 ? 'Doctorado' : p.n % 7 === 0 ? 'Pregrado' : 'Maestría';
  }
  if (stepKey !== 's3') {
    const base = condId === V.c1 || condId === V.c5
      ? ['Reescribió mi texto sin preguntar', 'Me dio una lista de pasos']
      : condId === V.c4
        ? ['Citó el criterio de la rúbrica', 'Me dio una lista de pasos']
        : ['Me preguntó por mi contexto antes de aconsejar', 'Me pidió explicar el vacío con mis palabras'];
    const chosen = base.filter(() => rng() < 0.85);
    if (chosen.length === 0) chosen.push(base[0]);
    if (rng() < 0.12) {
      chosen.push('__other__');
      a.acciones__other = pick(['Me recomendó leer dos artículos', 'Señaló un error de citación']);
    }
    a.acciones = chosen.slice(0, 3);
  }
  if (stepKey === 's1' && rng() < 0.55) {
    a.comentario = pick([
      'Me gustó que me preguntara por mi lector, pero tardó en darme el párrafo final.',
      'Quisiera que el asistente me mostrara un ejemplo de vacío bien escrito antes de pedirme el mío.',
      'La respuesta fue rápida, aunque sentí que no entendió bien el contexto de mi tesis.',
      'Las preguntas me ayudaron a ver que mezclaba antecedentes con justificación.',
    ]);
  }
  if (stepKey === 's2' && rng() < 0.6) {
    a.razon = pick([
      'La rúbrica me ayudó a decidir qué mejorar primero.',
      'Que reescribiera solo la última frase y no todo el párrafo.',
      'Ver los cuatro criterios me dio un orden para trabajar.',
      'Poder pedirle ejemplos de conectores.',
    ]);
  }
  if (stepKey === 's3') {
    a.recomendaria = latent > 4 ? 'Sí' : latent > 3.2 ? 'Quizá' : 'No';
    if (rng() < 0.7) {
      a.cambio = pick([
        'Ahora escribo primero el vacío en una frase y después armo los antecedentes.',
        'Antes pegaba el texto y esperaba que lo arreglara; ahora pregunto por qué cada cambio.',
        'Sigo escribiendo igual, pero reviso mejor las citas.',
      ]);
    }
  }
  // Occasional skipped optional/required item to produce partial data (the survey API does not enforce required).
  if (rng() < 0.08) delete a.utilidad;
  return a;
}

// ---------- dialogue banks ----------
const STUDENT_FIRST = {
  oneshot: [
    'Corrige mi introducción: "La deserción universitaria es un problema importante en muchos países y por eso se debe estudiar."',
    'Mejora este párrafo, por favor.',
    'Reescribe mi justificación para que suene más académica.',
  ],
  contextual: [
    'Estoy escribiendo la introducción de mi tesis de maestría sobre deserción en primer año. Mi directora dice que falta un vacío claro y que la justificación se parece a los antecedentes. ¿Cómo lo abordo?',
    'Mi tesis trata de por qué abandonan los estudiantes de ingeniería en el primer año. Tengo 1.200 palabras de introducción, pero no sé dónde termina el contexto y dónde empieza mi aporte.',
    'Necesito ayuda con la introducción de mi tesis. Mi lector es un comité de tres profesores de educación y me piden más rigor en la justificación.',
  ],
  english: [
    'I am writing the introduction of my master thesis about first-year dropout. My advisor says the gap is not clear because I mix background and rationale. How should I start?',
    'Can you help me restructure my introduction? I think the main problem is that I do not state my contribution until page four.',
  ],
};

const STUDENT_FOLLOW = [
  'Creo que el vacío es que casi nadie estudia la deserción en universidades regionales, sin embargo no estoy segura de poder afirmarlo porque no revisé todos los estudios.',
  'Mi lector principal es mi directora, que viene de sociología, así que probablemente necesito justificar mejor el enfoque cuantitativo.',
  'Ahora que lo pienso, mi pregunta de investigación es sobre el efecto de las tutorías, no sobre la deserción en general. Eso cambia el vacío, ¿verdad?',
  'Intenté reformularlo: "Aunque existen estudios sobre deserción, pocos evalúan tutorías de pares en universidades regionales." ¿Eso funciona como vacío?',
  'Entiendo, pero no me convence del todo la segunda parte, porque mezcla el contexto con mi objetivo. ¿Cómo lo separo?',
  'Gracias, eso me aclara. Voy a reescribir el párrafo y te lo muestro.',
  'ok',
  'Ahora sí: "La deserción en primer año está bien documentada; lo que falta es evidencia sobre tutorías de pares en universidades regionales, donde los recursos son menores." Me parece mejor porque separa lo conocido de lo que falta.',
];
const STUDENT_FOLLOW_EN = [
  'I think the gap is that few studies look at regional universities, but I am not sure because I have not read all of them.',
  'My main reader is my advisor, who comes from sociology, so I probably need to justify the quantitative approach better.',
  'Thanks, that makes sense. I will rewrite the paragraph and come back with it.',
];
const STUDENT_FOLLOW_SHORT = ['Gracias.', 'Hazlo más corto.', 'No entiendo, ¿puedes explicarlo de otra forma?', 'Otra versión, por favor.'];

const BOT_FIRST = {
  [V.c1]: [
    'Aquí tienes una versión mejorada: "La deserción universitaria en el primer año es un problema persistente que afecta la trayectoria académica y el desempeño institucional; analizar sus factores resulta indispensable para diseñar intervenciones oportunas." Cambios principales: 1) frase inicial más específica, 2) conectores más formales, 3) cierre orientado a la acción.',
    'Versión reescrita: se precisó el sujeto, se eliminó la redundancia y se añadió un conector causal. Puedes usarla tal cual o ajustar el vocabulario a tu disciplina. Si lo prefieres, te preparo otra versión más breve o con tono más técnico.',
  ],
  [V.c2]: [
    'Antes de proponer cambios necesito entender el contexto. ¿Quién es tu lector principal (tu directora, un comité, una revista)? ¿Y qué quieres que decida o piense esa persona al terminar la introducción?',
    'Gracias por compartirlo. Para no darte consejos genéricos, cuéntame dos cosas: ¿qué dice la literatura que ya existe sobre tu tema y qué falta, según tu opinión? ¿Y cuántas palabras te permite el formato?',
  ],
  [V.c3]: [
    'Vamos paso a paso. Si tuvieras que decirle a alguien en una sola frase qué no se sabe todavía sobre la deserción en primer año, ¿qué diría esa frase? No te preocupes por la redacción, solo por la idea.',
    'Antes de tocar el texto, una pregunta: ¿qué te hace pensar que lo que ya se ha escrito no es suficiente? ¿En qué parte de tu borrador aparece esa limitación?',
  ],
};
BOT_FIRST[V.c4] = BOT_FIRST[V.c1].map((t) => `${t} (Criterio de la rúbrica: claridad del vacío.)`);
BOT_FIRST[V.c5] = BOT_FIRST[V.c1];
BOT_FIRST[V.c6] = [
  'Me alegra retomar la conversación. ¿Qué lograste avanzar desde la última vez y qué se te quedó atascado? Con eso armamos los próximos pasos.',
];
BOT_FIRST[V.p1] = BOT_FIRST[V.c1];
BOT_FIRST[V.p2] = BOT_FIRST[V.c2];

const BOT_FOLLOW = {
  direct: [
    'Entendido. Te propongo esta estructura: 1) contexto en dos frases, 2) lo que ya se sabe, 3) el vacío en una frase, 4) tu objetivo. Si quieres, escribo el párrafo completo con esa estructura.',
    'Aquí va la versión ajustada del párrafo con el vacío en la tercera frase y el objetivo al final. Revisa que los términos coincidan con los de tu marco teórico.',
    'Listo. Añadí un conector adversativo ("sin embargo") para marcar el vacío y acorté la segunda oración.',
  ],
  guided: [
    'Eso ayuda mucho. Con lo que me cuentas, el vacío parece estar en las tutorías de pares y no en la deserción en general. ¿Quieres que probemos una frase que lo diga así y la comparamos con tu versión?',
    'Gracias por la aclaración. Tu lectora viene de sociología, así que conviene justificar el enfoque cuantitativo en una frase. ¿Qué argumento usarías tú para defenderlo?',
    'Tu reformulación es un buen avance: separa lo conocido de lo que falta. Un ajuste posible es nombrar el tipo de universidad al final, para que el vacío sea más específico.',
  ],
  socratic: [
    '¿Qué evidencia tendrías que mostrar para que un lector crea que ese vacío existe? Piensa en una cita que ya tengas y qué dice o qué no dice.',
    'Interesante. Si tu pregunta es sobre tutorías de pares, ¿cómo cambia eso la frase del vacío que escribiste antes? Prueba a escribirla de nuevo y dime qué cambió.',
    'Buena observación: dices que la segunda parte mezcla contexto y objetivo. ¿Qué pasaría si el contexto fuera una frase aparte? ¿Qué quedaría en la segunda?',
  ],
};
const BOT_FOLLOW_EN = [
  'Thanks. That helps. Which sentence in your draft currently states the gap? Try to copy it here and we can test whether it names what is missing in the literature.',
  'Good point. A short sentence that separates what is known from what is missing usually works: "Although X is well documented, little is known about Y in Z."',
];
const styleOf = (cond) =>
  cond === V.c1 || cond === V.c5 || cond === V.c4 || cond === V.p1 ? 'direct' : cond === V.c3 ? 'socratic' : 'guided';

// ---------- dialogue builder ----------
const wordCount = (t) => t.trim().split(/\s+/).filter(Boolean).length;

function turnsFor(cond, p) {
  const style = styleOf(cond);
  const r = rng();
  if (p.n === 24 && cond === V.c2) return 8; // one very long conversation
  if (style === 'direct') return r < 0.5 ? 1 : r < 0.85 ? 2 : 3;
  if (style === 'guided') return r < 0.15 ? 1 : r < 0.6 ? 3 : 5;
  return r < 0.05 ? 2 : r < 0.5 ? 4 : 6;
}

function buildMessages(sessionId, p, cond, startMs, turns, { stalled = false } = {}) {
  if (stalled || turns === 0) return [];
  const style = styleOf(cond);
  const messages = [];
  let t = startMs + 40 * 1000;
  let lastBotEnd = startMs;
  let order = 1;
  const english = p.english;
  const shape = turns === 1 ? 'oneshot' : turns <= 3 && style === 'direct' ? 'oneshot' : 'contextual';

  for (let i = 0; i < turns; i++) {
    let userText;
    if (i === 0) {
      userText = english ? pick(STUDENT_FIRST.english) : pick(STUDENT_FIRST[shape === 'oneshot' && rng() < 0.7 ? 'oneshot' : 'contextual']);
    } else if (english) {
      userText = STUDENT_FOLLOW_EN[(i - 1) % STUDENT_FOLLOW_EN.length];
    } else {
      userText = shape === 'oneshot' ? pick(STUDENT_FOLLOW_SHORT) : STUDENT_FOLLOW[(i - 1) % STUDENT_FOLLOW.length];
    }

    // Typing telemetry. Most people read first; a few skim; a few leave the tab; one takes very long.
    const prevBotWords = i === 0 ? 0 : wordCount(messages[messages.length - 1].content);
    const kind = (p.n + i) % 11 === 0 ? 'skim' : (p.n * 3 + i) % 17 === 0 ? 'blur' : (p.n + 2 * i) % 19 === 0 ? 'long' : 'normal';
    let readMs = Math.round(prevBotWords * (190 + rng() * 160));
    if (i === 0) readMs = 4000 + Math.round(rng() * 6000);
    if (kind === 'skim' && i > 0) readMs = 300 + Math.round(rng() * 300);
    if (kind === 'long' && i > 0) readMs = 200000 + Math.round(rng() * 90000);
    const composeMs = Math.round(wordCount(userText) * (350 + rng() * 300)) + 1500;
    const tBot = lastBotEnd;
    const tFirstKey = tBot + readMs;
    const tSend = tFirstKey + composeMs;
    t = tSend;

    messages.push({
      id: uid(),
      session_id: sessionId,
      role: 'user',
      content: userText,
      created_at: new Date(t).toISOString(),
      metadata: { order: order++ },
      telemetry: { t_bot: tBot, t_first_key: tFirstKey, t_send: tSend, is_tab_blurred: kind === 'blur' },
    });

    const reply = i === 0
      ? english ? 'Thanks for the context. Before suggesting changes: who is your main reader, and what do you want them to understand after the introduction? Tell me also how long the section can be.' : pick(BOT_FIRST[cond] || BOT_FIRST[V.c1])
      : english ? pick(BOT_FOLLOW_EN) : BOT_FOLLOW[style][(i - 1) % BOT_FOLLOW[style].length];
    const completion = Math.round(wordCount(reply) * 1.45);
    const prompt = 220 + i * 260 + Math.round(rng() * 80);
    const ttft = 380 + Math.round(rng() * 900);
    const duration = ttft + completion * (18 + Math.round(rng() * 10));
    const botEnd = t + duration;
    messages.push({
      id: uid(),
      session_id: sessionId,
      role: 'assistant',
      content: reply,
      created_at: new Date(botEnd).toISOString(),
      metadata: { order: order++ },
      telemetry: {
        prompt_tokens: prompt,
        completion_tokens: completion,
        cost_usd: Math.round((prompt * 0.15 + completion * 0.6) / 1e6 * 1e6) / 1e6,
        ttft_ms: ttft,
        duration_ms: duration,
        model: 'deepseek/deepseek-v4-flash',
      },
    });
    lastBotEnd = botEnd;
    t = botEnd + 1000;
  }
  return messages;
}

// ---------- assemble campaign A ----------
const NOW_BASE = Date.UTC(2026, 9, 12, 14, 0, 0); // fixed anchor for finished sessions

function buildCampaignA(now) {
  reseed(101);
  const sessions = [];
  const messages = [];

  for (const p of participants) {
    const prog = progress(p);
    const seq = p.order.map((k) => STEP_ID[k]);
    const totalSteps = prog.last ? prog.done + 1 : 3;
    let cursor = NOW_BASE + (p.n - 1) * (DAY / 3);

    for (let pos = 0; pos < totalSteps; pos++) {
      const stepKey = p.order[pos];
      const cond = stepCond[stepKey](p);
      const isLast = prog.last && pos === prog.done;
      const sessionId = uid();
      const common = {
        id: sessionId,
        workshop_id: STEP_ID[stepKey],
        version_id: cond,
        participant_name: p.name,
        chain_user_id: p.chainUser,
        chain_position: pos + 1,
        step_sequence: seq,
      };

      if (isLast && prog.last === 'stalled') {
        sessions.push({ ...common, status: 'active', interaction_count: 0, started_at: new Date(now - 16 * MIN).toISOString(), completed_at: null, survey_answers: null });
        continue;
      }
      if (isLast && (prog.last === 'live' || prog.last === 'long-open' || prog.last === 'abandoned')) {
        const start = prog.last === 'live' ? now - 4 * MIN : prog.last === 'long-open' ? now - 3 * 60 * MIN : cursor;
        const turns = prog.last === 'live' ? 2 : 3;
        const msgs = buildMessages(sessionId, p, cond, start, turns);
        // "abandoned" stays active from an old date: shows up in Resultados as unfinished.
        sessions.push({ ...common, status: 'active', interaction_count: turns, started_at: new Date(start).toISOString(), completed_at: null, survey_answers: null });
        messages.push(...msgs);
        continue;
      }

      const turns = turnsFor(cond, p);
      const msgs = buildMessages(sessionId, p, cond, cursor, turns);
      const endMs = new Date(msgs[msgs.length - 1].created_at).getTime() + 90 * 1000;
      const noSurvey = p.n === 24 && stepKey === 's1';
      sessions.push({
        ...common,
        status: 'completed',
        interaction_count: turns,
        started_at: new Date(cursor).toISOString(),
        completed_at: new Date(endMs + 3 * MIN).toISOString(),
        survey_answers: noSurvey ? null : surveyAnswers(p, stepKey, cond, pos),
      });
      messages.push(...msgs);
      cursor = endMs + 2 * DAY;
    }
  }
  return { sessions, messages };
}

function buildPilot() {
  reseed(202);
  const sessions = [];
  const messages = [];
  const people = [
    { name: 'Piloto 01', cond: V.p1, likert: '4' },
    { name: 'Piloto 02', cond: V.p2, likert: '3' },
    { name: 'Piloto 03', cond: V.p1, likert: '5', comment: 'El ejemplo me ahorró tiempo.' },
    { name: 'Piloto 04', cond: V.p2, likert: '2', comment: 'No sabía por dónde empezar.' },
    { name: 'Piloto 05', cond: V.p1, likert: '4' },
  ];
  people.forEach((x, i) => {
    const id = uid();
    const start = NOW_BASE - 12 * DAY + i * 3 * 60 * MIN;
    const fake = { n: 100 + i, english: false };
    const msgs = buildMessages(id, fake, x.cond, start, 2);
    sessions.push({
      id,
      workshop_id: W.pilot,
      version_id: x.cond,
      participant_name: x.name,
      chain_user_id: uid(),
      status: 'completed',
      interaction_count: 2,
      started_at: new Date(start).toISOString(),
      completed_at: new Date(start + 14 * MIN).toISOString(),
      survey_answers: { claridad: x.likert, ...(x.comment ? { comentario: x.comment } : {}) },
    });
    messages.push(...msgs);
  });
  return { sessions, messages };
}

// ---------- workshops ----------
const campaignMeta = {
  campaign_name: 'Demo sintética — Tutor de escritura académica',
  campaign_description:
    'Datos sintéticos para mostrar la plataforma: 3 pasos en orden aleatorio, 24 participantes, encuestas con todos los tipos de pregunta y sesiones en distintos estados. No son personas reales.',
  consent_required: true,
  consent_url: 'https://example.org/consentimiento-demo',
  randomize_order: true,
  final_message: 'Gracias por participar. Tus respuestas son sintéticas y sirven solo para la demostración.',
  show_condition: true,
};

function workshops() {
  const base = { ai_provider: 'openrouter', openrouter_model: 'deepseek/deepseek-v4-flash', chain_id: CHAIN_A, maintain_version: false, analysis_type: 'preregistrado', is_active: true };
  const hyp = 'H1: los asistentes con preguntas previas (guiado y socrático) elevan la confianza de escritura más que la respuesta directa. H2: la rúbrica visible reduce la frustración.';
  return [
    { ...base, ...campaignMeta, id: W.s1, name: 'Sesión 1 — Retroalimentación del borrador', share_code: 'sint01', chain_order: 1, selected_version_ids: [V.c1, V.c2, V.c3], survey_config: surveyS1, hypothesis: hyp, onboarding_instructions: 'Pega o describe tu borrador y conversa con el asistente durante 10 minutos.' },
    { ...base, ...campaignMeta, id: W.s2, name: 'Sesión 2 — Reescritura', share_code: 'sint02', chain_order: 2, selected_version_ids: [V.c4, V.c5], survey_config: surveyS2, hypothesis: hyp, onboarding_instructions: 'Reescribe tu introducción con ayuda del asistente.' },
    { ...base, ...campaignMeta, id: W.s3, name: 'Sesión 3 — Seguimiento', share_code: 'sint03', chain_order: 3, selected_version_ids: [V.c6], survey_config: surveyS3, hypothesis: hyp, onboarding_instructions: 'Cuéntale al asistente cómo avanzó tu escritura.' },
    {
      id: W.pilot,
      name: 'Piloto de resumen',
      share_code: 'sint11',
      chain_order: 1,
      selected_version_ids: [V.p1, V.p2],
      survey_config: surveyPilot,
      ai_provider: 'openrouter',
      openrouter_model: 'deepseek/deepseek-v4-flash',
      analysis_type: 'exploratorio',
      campaign_name: 'Demo sintética — Piloto de resumen (pausado)',
      campaign_description: 'Campaña pausada con solo 5 sesiones: sirve para mostrar el aviso de muestra insuficiente y el paso pausado.',
      consent_required: false,
      randomize_order: false,
      show_condition: false,
      is_active: false,
    },
    {
      id: W.empty,
      name: 'Open conversation',
      share_code: 'sint21',
      chain_order: 1,
      selected_version_ids: [V.e1],
      survey_config: [],
      ai_provider: 'openrouter',
      openrouter_model: 'deepseek/deepseek-v4-flash',
      analysis_type: 'exploratorio',
      campaign_name: 'Demo sintética — Campaña vacía',
      campaign_description: 'Campaña recién creada, sin participantes ni encuesta: sirve para mostrar el estado vacío.',
      consent_required: false,
      randomize_order: false,
      show_condition: false,
      is_active: true,
    },
  ];
}

/**
 * The synthetic data in the shape the memory store keeps (defaults filled in), for a store that starts empty.
 * Same ids and content as seedSyntheticData(), so demo mode can still remove it.
 */
export function getSyntheticRecords(now = Date.now()) {
  const a = buildCampaignA(now);
  const p = buildPilot();
  const created = new Date(now).toISOString();
  const withDefaults = (w, i) => ({
    system_prompt: null,
    chain_id: null,
    maintain_version: false,
    onboarding_instructions: null,
    analysis_type: 'preregistrado',
    hypothesis: null,
    campaign_name: null,
    campaign_description: null,
    consent_required: false,
    consent_url: null,
    randomize_order: false,
    final_message: null,
    show_condition: false,
    is_active: true,
    ...w,
    // Main campaign newest first in lists, then the pilot, then the empty one.
    created_at: new Date(now - i * 1000).toISOString(),
  });
  return {
    versions: versions.map((v) => ({ ...v, system_prompt: v.system_prompt || null, created_at: created, updated_at: created })),
    workshops: workshops().map(withDefaults),
    sessions: [...a.sessions, ...p.sessions].map((s) => ({
      participant_name: 'Anonymous', chain_user_id: null, onboarding_answers: null, client_metrics: null,
      completed_at: null, survey_answers: null, chain_position: null, step_sequence: null, ...s,
    })),
    messages: [...a.messages, ...p.messages].map((m) => ({ telemetry: null, metadata: null, ...m })),
  };
}

/**
 * Human vs. LLM-as-a-judge coding of 30 completed conversations (two dimensions, 60 pairs) for the agreement section.
 *   outcome: moderate agreement, three categories.
 *   flow_pattern: 90% of conversations share one category, so Cohen's kappa drops while Gwet's AC1 stays high
 *   (the prevalence paradox).
 * Returns null unless the synthetic campaigns are in `workshops`.
 */
export function getSyntheticCalibration() {
  const { sessions } = buildCampaignA(Date.now());
  const byId = new Map(versions.map((v) => [v.id, v]));
  const done = sessions.filter((x) => x.status === 'completed').slice(0, 30);
  const OUT = { sup: 'Superficial Advice', act: 'Actionable Guidance Reached', fat: 'Abandoned due to Fatigue' };
  const pairs = [];
  done.forEach((x, i) => {
    const style = styleOf(x.version_id);
    const human = i % 10 === 7 ? OUT.fat : style === 'direct' ? OUT.sup : OUT.act;
    // The judge disagrees on a fixed handful of conversations.
    const llm = [2, 5, 11, 17, 23, 28].includes(i) ? (human === OUT.act ? OUT.sup : OUT.act) : human;
    pairs.push({ session_id: x.id, rater_human: human, rater_llm: llm, dimension: 'outcome', condition: byId.get(x.version_id)?.title });
    const humanFlow = [4, 15, 26].includes(i) ? 'Productive Friction' : 'Coherent Baseline';
    const llmFlow = [4, 9, 20].includes(i) ? 'Productive Friction' : 'Coherent Baseline';
    pairs.push({ session_id: x.id, rater_human: humanFlow, rater_llm: llmFlow, dimension: 'flow_pattern', condition: byId.get(x.version_id)?.title });
  });
  return {
    dataset: 'Demo sintética: codificación dialógica (humano vs. LLM-as-a-judge)',
    codes: ['Productive Friction', 'Coherent Baseline', 'Actionable Guidance Reached', 'Superficial Advice', 'Abandoned due to Fatigue'],
    pairs,
  };
}

/** True when any synthetic workshop is in the given list (no database access). */
export const hasSyntheticWorkshops = (list = []) => list.some((w) => Object.values(W).includes(w.id));

const WORKSHOP_IDS = new Set(Object.values(W));
const VERSION_IDS = new Set(Object.values(V));

export const SYNTHETIC_SHARE_CODES = ['sint01', 'sint11', 'sint21'];

export function getSyntheticSummary() {
  const a = buildCampaignA(Date.now());
  const p = buildPilot();
  return {
    campaigns: 3,
    workshops: workshops().length,
    versions: versions.length,
    sessions: a.sessions.length + p.sessions.length,
    messages: a.messages.length + p.messages.length,
    shareCodes: SYNTHETIC_SHARE_CODES,
  };
}

/** True when any of the synthetic workshops is present. */
export async function isSyntheticLoaded(db) {
  const list = (await db.getWorkshops()) || [];
  return list.some((w) => WORKSHOP_IDS.has(w.id));
}

/** Loads the synthetic campaigns. Idempotent: skips what already exists. Timestamps of the live sessions are relative to now. */
export async function seedSyntheticData(db) {
  const now = Date.now();
  const a = buildCampaignA(now);
  const p = buildPilot();
  const out = { versionsCount: 0, workshopsCount: 0, sessionsCount: 0, messagesCount: 0 };

  const haveVersions = new Set(((await db.getVersions()) || []).map((v) => v.id));
  for (const v of versions) {
    if (!haveVersions.has(v.id)) { await db.createVersion(v); out.versionsCount++; }
  }
  const haveWorkshops = new Set(((await db.getWorkshops()) || []).map((w) => w.id));
  for (const w of workshops()) {
    if (!haveWorkshops.has(w.id)) { await db.createWorkshop(w); out.workshopsCount++; }
  }
  const haveSessions = new Set(((await db.getSessions()) || []).map((s) => s.id));
  const sessions = [...a.sessions, ...p.sessions];
  const seededSessionIds = new Set();
  for (const s of sessions) {
    if (!haveSessions.has(s.id)) { await db.createSession(s); out.sessionsCount++; seededSessionIds.add(s.id); }
  }
  for (const m of [...a.messages, ...p.messages]) {
    if (seededSessionIds.has(m.session_id)) { await db.createMessage(m); out.messagesCount++; }
  }
  return out;
}

/** Removes only the synthetic data (its sessions, workshops and versions). */
export async function removeSyntheticData(db) {
  const removed = { sessions: 0, workshops: 0, versions: 0 };
  for (const s of (await db.getSessions()) || []) {
    if (WORKSHOP_IDS.has(s.workshop_id)) { await db.deleteSession(s.id); removed.sessions++; }
  }
  for (const w of (await db.getWorkshops()) || []) {
    if (WORKSHOP_IDS.has(w.id)) { await db.deleteWorkshop(w.id); removed.workshops++; }
  }
  const inUse = new Set(((await db.getWorkshops()) || []).flatMap((w) => w.selected_version_ids || []));
  for (const v of (await db.getVersions()) || []) {
    if (VERSION_IDS.has(v.id) && !inUse.has(v.id)) { await db.deleteVersion(v.id); removed.versions++; }
  }
  return removed;
}
