/**
 * Short glossary used by the <Abbr/> popovers. Spanish source text; the popover translates name,
 * definition and interpretation with tr(), so every string is listed in ABBR_TEXT_KEYS for the i18n test.
 */
export const GLOSSARY_TERMS = {
  p: {
    symbol: 'p',
    name: 'p-valor',
    definition: 'Probabilidad de observar los datos obtenidos (o más extremos) si la hipótesis nula fuera cierta.',
    interpretation: 'Umbral alfa típico: p < 0.05 indica significancia estadística.',
    link: '/glosario#p',
  },
  'p-holm': {
    symbol: 'p (Holm)',
    name: 'p-valor ajustado por Holm-Bonferroni',
    definition: 'Corrección secuencial descendente que controla la tasa de error familiar (FWER) al evaluar múltiples hipótesis.',
    interpretation: 'Ajuste monótono: p_adj,i >= p_adj,i-1.',
    link: '/glosario#p-holm',
  },
  u: {
    symbol: 'U',
    name: 'Estadístico U de Mann-Whitney',
    definition: 'Prueba no paramétrica para contrastar si dos muestras independientes provienen de poblaciones con la misma distribución.',
    interpretation: 'Robusto ante no-normalidad y datos ordinales tipo Likert.',
    link: '/glosario#u',
  },
  d: {
    symbol: 'd',
    name: 'd de Cohen',
    definition: 'Diferencia estandarizada de medias entre dos condiciones.',
    interpretation: '0.2 pequeño, 0.5 mediano, 0.8 grande.',
    link: '/glosario#d',
  },
  'cliff-delta': {
    symbol: 'δ',
    name: 'δ de Cliff (Cliff\'s Delta)',
    definition: 'Medida no paramétrica del tamaño del efecto: δ = 1 - 2U / (n_A * n_B).',
    interpretation: '< 0.147 insignificante, < 0.33 pequeño, < 0.474 mediano, >= 0.474 grande (Romano et al., 2006).',
    link: '/glosario#cliff-delta',
  },
  delta: {
    symbol: 'δ',
    name: 'δ de Cliff (Cliff\'s Delta)',
    definition: 'Medida no paramétrica del tamaño del efecto: δ = 1 - 2U / (n_A * n_B).',
    interpretation: '< 0.147 insignificante, < 0.33 pequeño, < 0.474 mediano, >= 0.474 grande (Romano et al., 2006).',
    link: '/glosario#cliff-delta',
  },
  alpha: {
    symbol: 'α',
    name: 'Alfa de Cronbach',
    definition: 'Coeficiente de fiabilidad y consistencia interna para escalas multi-ítem.',
    interpretation: 'α >= 0.70 aceptable, α >= 0.80 bueno para instrumentos de investigación.',
    link: '/glosario#alpha',
  },
  'gwet-ac1': {
    symbol: 'AC₁',
    name: 'AC₁ de Gwet',
    definition: 'Coeficiente de fiabilidad inter-juez robusto ante la paradoja de prevalencia (alta concordancia con kappa baja).',
    interpretation: 'Complementa a Cohen\'s kappa ante distribuciones desbalanceadas.',
    link: '/glosario#gwet-ac1',
  },
  ac1: {
    symbol: 'AC₁',
    name: 'AC₁ de Gwet',
    definition: 'Coeficiente de fiabilidad inter-juez robusto ante la paradoja de prevalencia.',
    interpretation: 'Complementa a Cohen\'s kappa ante distribuciones desbalanceadas.',
    link: '/glosario#gwet-ac1',
  },
  mattr: {
    symbol: 'MATTR',
    name: 'Moving-Average Type-Token Ratio',
    definition: 'Medida de diversidad léxica independiente de la longitud del texto usando ventanas deslizantes (W=25, 50).',
    interpretation: 'Valores mayores reflejan mayor riqueza de vocabulario en el diálogo.',
    link: '/glosario#mattr',
  },
  'ic-95': {
    symbol: 'IC 95%',
    name: 'Intervalo de Confianza al 95%',
    definition: 'Rango de valores que contiene el parámetro poblacional verdadero con 95% de confianza bajo muestreo repetido.',
    interpretation: 'Si el IC para una diferencia incluye 0, no hay evidencia suficiente de efecto.',
    link: '/glosario#ic-95',
  },
  'hake-g': {
    symbol: 'g',
    name: 'Ganancia normalizada de Hake',
    definition: 'Fracción de la ganancia máxima posible alcanzada entre pre-test y post-test: g = (post - pre) / (max - pre).',
    interpretation: '< 0.3 baja, 0.3-0.7 media, > 0.7 alta ganancia de aprendizaje.',
    link: '/glosario#hake-g',
  },
  'mlu-w': {
    symbol: 'MLU-w',
    name: 'Mean Length of Utterance in words',
    definition: 'Longitud media de los enunciados del estudiante medida en palabras.',
    interpretation: 'Indicador de elaboración conceptual y profundidad conversacional.',
    link: '/glosario#mlu-w',
  },
  'r-vol': {
    symbol: 'R_vol',
    name: 'Verbal Volume Ratio',
    definition: 'Proporción del volumen verbal total generado por el estudiante respecto al chatbot.',
    interpretation: 'R_vol > 1.0 indica mayor protagonismo discursivo del estudiante.',
    link: '/glosario#r-vol',
  },
};

export const ABBR_FALLBACKS = {
  name: 'Término estadístico',
  definition: 'Definición detallada disponible en el glosario de investigación.',
  link: 'Consultar en el glosario completo →',
};

export const ABBR_TEXT_KEYS = [
  ...new Set([
    ...Object.values(GLOSSARY_TERMS).flatMap((t) => [t.name, t.definition, t.interpretation]),
    ...Object.values(ABBR_FALLBACKS),
  ]),
].filter(Boolean);
