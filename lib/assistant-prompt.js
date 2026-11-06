/**
 * Floating assistant for facilitators: system prompt + offline fallback.
 * The fallback answers from a small knowledge base so the assistant is still useful with no AI key.
 */

export const ASSISTANT_SYSTEM_PROMPT = `Eres el asistente de PromptSketch, una plataforma para diseñar y ejecutar actividades en las que personas conversan con un asistente de IA y se comparan distintas versiones (condiciones) de esa experiencia.
Hablas con quien dirige la actividad (docente, investigador o facilitador). Tu rol:
- Orientar sobre cómo usar la plataforma: campañas (conjunto de pasos), condiciones (versiones del caso o de las instrucciones del asistente), encuestas, código/QR, vista en vivo y resultados.
- Dar consejos expertos de diseño: cambiar una sola variable entre condiciones, redactar instrucciones claras para el asistente, probar con 2 o 3 personas antes, pedir consentimiento cuando corresponda, definir de antemano qué se va a medir.
- Explicar en lenguaje simple los términos estadísticos que aparezcan (p-valor, tamaño del efecto, supuestos) y sugerir el glosario cuando ayude.
Reglas: responde en el idioma de la persona, con 2 a 5 frases o una lista corta, sin jerga innecesaria y sin inventar funciones que no existan. Si no sabes algo de la plataforma, dilo. Recuerda que los datos de participantes son sensibles: no pidas ni repitas datos personales.`;

const GLOSSARY = (anchor) => ({ label: 'Ver en el glosario', href: `/glosario#${anchor}` });
const trLink = (tr, l) => ({ ...l, label: tr(l.label) });

const RULES = [
  {
    test: /p[- ]?valor|p-value|significativ|significan|signific(ant|ance)/i,
    reply: 'El p-valor dice qué tan sorprendente sería ver estos resultados si en realidad no hubiera diferencia entre condiciones. Un valor bajo (por ejemplo menor a 0,05) sugiere que la diferencia no es solo azar, pero no dice qué tan grande ni importante es. Mira siempre también el tamaño del efecto.',
    links: [GLOSSARY('p')],
  },
  {
    test: /tama[nñ]o del efecto|cohen|cliff|efecto|effect size|tamanho do efeito/i,
    reply: 'El tamaño del efecto responde “¿cuánta diferencia hay?” en vez de “¿hay diferencia?”. Con pocos participantes un efecto grande puede no ser “significativo”, y con muchos uno minúsculo sí lo será. Reporta ambos.',
    links: [GLOSSARY('cliff-delta')],
  },
  {
    test: /kruskal|anova|tres condiciones|m[aá]s de dos|three conditions|more than two|tr[eê]s condi[cç][oõ]es|mais de duas/i,
    reply: 'Con tres o más condiciones, primero se hace una prueba global (ANOVA de Welch si los datos son aproximadamente normales, Kruskal-Wallis si no) y, solo si hay diferencias, se comparan los pares con corrección de Holm para no inflar falsos positivos. Resultados lo hace por ti y lo explica en palabras simples.',
    links: [GLOSSARY('p-holm')],
  },
  {
    test: /holm|bonferroni|m[uú]ltiples comparaciones|multiple comparisons|compara[cç][oõ]es m[uú]ltiplas/i,
    reply: 'Si haces muchas comparaciones, es más probable que alguna salga “significativa” por casualidad. La corrección de Holm ajusta los p-valores para compensarlo.',
    links: [GLOSSARY('p-holm')],
  },
  {
    test: /cu[aá]ntos participantes|tama[nñ]o de (la )?muestra|poder estad|how many participants|sample size|quantos participantes|tamanho da amostra/i,
    reply: 'No hay un número único: depende de cuánta diferencia esperas. Como guía, con menos de 20 personas por condición solo se detectan diferencias grandes. Si el grupo es pequeño, preséntalo como exploratorio y apóyate en las conversaciones, no solo en los números.',
    links: [],
  },
  {
    test: /consentimiento|[eé]tic|datos personales|privacidad|consent|ethic|privacy|consentimento|privacidade/i,
    reply: 'Si la actividad es una investigación, pide consentimiento informado: en la campaña activa “Consentimiento informado” y agrega el enlace al documento. Evita pedir datos identificables y revisa qué proveedor de IA procesa las conversaciones.',
    links: [{ label: 'Editar una campaña', href: '/admin/campaigns' }],
  },
  {
    test: /qr|c[oó]digo|compartir|enlace|link|share|code|compartilh/i,
    reply: 'Cada campaña tiene un solo código y un QR para todos sus pasos. Lo encuentras en la lista de Campañas y puedes proyectarlo en grande desde En vivo con “Proyectar QR”.',
    links: [{ label: 'Ir a En vivo', href: '/admin' }],
  },
  {
    test: /descargar|exportar|datos|csv|excel|spss|python|r studio|download|export|data|baixar|dados/i,
    reply: 'En Resultados, “Descargar datos” entrega tablas listas para Excel, R o Python (una fila por sesión, por mensaje o por participante), junto con el diccionario que explica cada columna.',
    links: [{ label: 'Ir a Resultados', href: '/admin/results' }],
  },
  {
    test: /condici[oó]n|a\/b|comparar|versi[oó]n|condition|compare|condi[cç][aã]o|comparar/i,
    reply: 'Una condición es una versión de la experiencia: un caso y, si quieres, instrucciones propias para el asistente. Para poder atribuir diferencias, cambia una sola cosa entre condiciones (por ejemplo, solo las instrucciones del asistente). Cada participante recibe una al azar, de forma equilibrada.',
    links: [{ label: 'Crear campaña', href: '/admin/campaigns/new' }],
  },
  {
    test: /prompt|instrucciones del asistente|system|instructions|instru[cç][oõ]es/i,
    reply: 'Buenas instrucciones para el asistente son específicas y observables: qué rol tiene, qué debe preguntar antes de aconsejar, cuánto debe extenderse y qué no debe hacer. Pruébalas tú primero con “Ver como participante” y ajusta.',
    links: [],
  },
];

const PAGE_TIPS = [
  { test: /\/admin\/campaigns\/(new|[^/]+)/, reply: 'Tip para armar la campaña: empieza con un paso y dos condiciones que difieran en una sola cosa, y pruébalo tú antes de compartir el QR. Cuando funcione, agrega más pasos o condiciones.' },
  { test: /\/admin\/campaigns/, reply: 'Aquí ves todas tus campañas. Crea una nueva, edita una existente o copia el enlace para compartirla.' },
  { test: /\/admin\/results|\/admin\/sessions|\/admin\/analytics/, reply: 'Puedes descargar los datos, revisar cada conversación o pedir un análisis rápido. Si algo del análisis no se entiende, pregúntame por el término.' },
  { test: /\/admin\/settings/, reply: 'En Ajustes eliges el proveedor y el modelo de IA y pruebas la conexión. Revisa qué hace cada proveedor con los datos antes de usarlo con participantes.' },
  { test: /\/admin$/, reply: 'Esta es la vista en vivo: arriba verás qué requiere atención y abajo cómo avanza cada paso. Se actualiza sola cada pocos segundos.' },
];

export const SUGGESTIONS_BY_PAGE = [
  { test: /\/admin\/campaigns\/(new|[^/]+)/, items: ['¿Qué es una condición?', '¿Cómo redacto buenas instrucciones?', '¿Necesito consentimiento?'] },
  { test: /\/admin\/campaigns/, items: ['¿Cómo comparto la campaña?', '¿Qué es una condición?'] },
  { test: /\/admin\/(results|sessions|analytics)/, items: ['¿Cómo descargo los datos?', '¿Qué es el p-valor?', '¿Qué es el tamaño del efecto?'] },
  { test: /\/admin$/, items: ['¿Cómo proyecto el QR?', '¿Qué hago si nadie escribe?'] },
];

export function suggestionsForPage(page = '') {
  return SUGGESTIONS_BY_PAGE.find((s) => s.test.test(page))?.items || ['¿Cómo creo una campaña?', '¿Cómo descargo los datos?'];
}

/** Every Spanish text this module can return, so the i18n test can require translations for it. */
export const ASSISTANT_TEXT_KEYS = [
  ...RULES.flatMap((r) => [r.reply, ...r.links.map((l) => l.label)]),
  ...PAGE_TIPS.map((t) => t.reply),
  'Puedo ayudarte con el diseño de la campaña, con la vista en vivo, con la descarga de datos y con explicar términos estadísticos. Pregúntame con tus palabras.',
];

const identityTr = (text) => text;

/** Offline answer. Returns { reply, links }. `tr` translates the Spanish source text. */
export function deterministicAssistantReply(question = '', page = '', tr = identityTr) {
  const q = String(question);
  const rule = RULES.find((r) => r.test.test(q));
  if (rule) return { reply: tr(rule.reply), links: rule.links.map((l) => trLink(tr, l)) };
  const tip = PAGE_TIPS.find((t) => t.test.test(page));
  return {
    reply: `${tip ? `${tr(tip.reply)}\n\n` : ''}${tr('Puedo ayudarte con el diseño de la campaña, con la vista en vivo, con la descarga de datos y con explicar términos estadísticos. Pregúntame con tus palabras.')}`,
    links: [],
  };
}
