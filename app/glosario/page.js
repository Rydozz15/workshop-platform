'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BlueprintPanel,
  StatBadge,
  Field,
  MarginNote,
  LanguageSelector,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';

const GLOSSARY_ENTRIES = [
  {
    id: 'p',
    category: 'Inferencia y Error Familiar',
    symbol: 'p',
    title: 'Valor p (Significancia Estadística)',
    formula: 'P(|T| >= |t_obs| | H_0)',
    thresholds: 'p < 0.05 evidencia convencional contra H_0; reportar siempre junto a tamaño de efecto.',
    plain:
      'Indica qué tan probable sería observar una diferencia tan grande como la obtenida si en realidad ambos prompts funcionaran exactamente igual (solo por azar muestral).',
    citation: 'Wasserstein, R. L., & Lazar, N. A. (2016). The ASA Statement on p-Values. The American Statistician, 70(2), 129–133.',
  },
  {
    id: 'p-holm',
    category: 'Inferencia y Error Familiar',
    symbol: 'p_Holm',
    title: 'Corrección Secuencial de Holm-Bonferroni (FWER)',
    formula: 'p_adj,(i) = min(1, max_{j <= i} ((m - j + 1) * p_(j)))',
    thresholds: 'Controla la tasa de error familiar (FWER) con mayor potencia estadística que Bonferroni clásico.',
    plain:
      'Cuando comparas muchas métricas al mismo tiempo (por ejemplo 5 preguntas de encuesta), aumenta el riesgo de encontrar un falso positivo por pura casualidad. Holm-Bonferroni ajusta los p-valores ordenadamente para evitar falsas alarmas sin perder sensibilidad.',
    citation: 'Holm, S. (1979). A simple sequentially rejective multiple test procedure. Scandinavian Journal of Statistics, 6(2), 65–70.',
  },
  {
    id: 'welch-t',
    category: 'Pruebas Paramétricas',
    symbol: 't (Welch)',
    title: 'Prueba t de Welch para Varianzas Desiguales',
    formula: 't = (X_A - X_B) / sqrt(s_A^2/n_A + s_B^2/n_B)',
    thresholds: 'Recomendada para variables continuas simétricas sin asumir homocedasticidad.',
    plain:
      'Compara los promedios de dos grupos continuos (como tiempos de lectura o puntajes compuestos) corrigiendo automáticamente los grados de libertad cuando un grupo tiene mayor dispersión que el otro.',
    citation: 'Delacre, M., Lakens, D., & Leys, C. (2017). Why psychologists should by default use Welch’s t-test instead of Student’s t-test. IRSP, 30(1), 92–101.',
  },
  {
    id: 'd',
    category: 'Pruebas Paramétricas',
    symbol: 'd',
    title: 'd de Cohen (Tamaño de Efecto Paramétrico)',
    formula: 'd = (X_A - X_B) / s_pooled',
    thresholds: '|d| < 0.20 insignificante · 0.20 pequeño · 0.50 mediano · >= 0.80 grande.',
    plain:
      'Mide cuántas desviaciones estándar separan el promedio de la Condición A del de la Condición B. Permite saber si una diferencia es sustancial en la práctica, más allá del tamaño de la muestra.',
    citation: 'Cohen, J. (1988). Statistical Power Analysis for the Behavioral Sciences (2nd ed.). Lawrence Erlbaum.',
  },
  {
    id: 'u',
    category: 'Pruebas No Paramétricas (Ordinales)',
    symbol: 'U',
    title: 'Prueba U de Mann-Whitney con Corrección por Empates',
    formula: 'U_A = R_A - n_A(n_A + 1)/2',
    thresholds: 'Estándar obligatorio en LAK para ítems Likert individuales (1–5) o datos continuos asimétricos.',
    plain:
      'En lugar de promediar números de una encuesta Likert (donde la distancia entre "De acuerdo" y "Muy de acuerdo" no es exacta), ordena todas las respuestas por rangos para evaluar si una condición supera sistemáticamente a la otra.',
    citation: 'Mann, H. B., & Whitney, D. R. (1947). On a test of whether one of two random variables is stochastically larger than the other. Annals of Mathematical Statistics, 18(1), 50–60.',
  },
  {
    id: 'cliff-delta',
    category: 'Pruebas No Paramétricas (Ordinales)',
    symbol: 'δ',
    title: 'Delta de Cliff (Dominancia Estocástica No Paramétrica)',
    formula: 'δ = (2 * U_A) / (n_A * n_B) - 1 = #(x_A > x_B) - #(x_A < x_B) / (n_A * n_B)',
    thresholds: '|δ| < 0.147 insignificante · < 0.330 pequeño · < 0.474 mediano · >= 0.474 grande (Romano et al., 2006).',
    plain:
      'Va de -1 a +1 e indica la probabilidad neta de que un participante elegido al azar de un grupo tenga un valor superior al de otro grupo. Es el tamaño de efecto exacto emparejado con Mann-Whitney U para escalas Likert.',
    citation: 'Cliff, N. (1993). Dominance statistics: Ordinal analyses to answer ordinal questions. Psychological Bulletin, 114(3), 494–509; Romano et al. (2006).',
  },
  {
    id: 'ic-95',
    category: 'Inferencia y Error Familiar',
    symbol: 'IC 95%',
    title: 'Intervalo de Confianza al 95%',
    formula: 'Estimador ± 1.96 * SE',
    thresholds: 'Si el IC 95% de una diferencia o tamaño de efecto cruza 0, el efecto es compatible con ausencia de cambio.',
    plain:
      'Muestra el rango plausible donde se encuentra el efecto real. En muestras pequeñas de talleres educativos, un intervalo ancho advierte que se requieren más participantes para precisar la magnitud.',
    citation: 'Cumming, G. (2014). The New Statistics: Why and How. Psychological Science, 25(1), 7–29.',
  },
  {
    id: 'hake-g',
    category: 'Psicometría y Ganancia de Aprendizaje',
    symbol: 'g',
    title: 'Ganancia de Aprendizaje Normalizada de Hake',
    formula: 'g = (Post - Pre) / (Max - Pre)',
    thresholds: 'g < 0.30 baja · 0.30 <= g < 0.70 media · g >= 0.70 ganancia alta.',
    plain:
      'Calcula cuánto mejoró un participante entre la Etapa 1 y la Etapa 2 en proporción a todo el margen de mejora que tenía disponible según su puntaje inicial.',
    citation: 'Hake, R. R. (1998). Interactive-engagement versus traditional methods: A six-thousand-student survey. American Journal of Physics, 66(1), 64–74.',
  },
  {
    id: 'alpha',
    category: 'Psicometría y Ganancia de Aprendizaje',
    symbol: 'α',
    title: 'Alfa de Cronbach y Correlación Ítem-Total Corregida',
    formula: 'α = (k / (k - 1)) * (1 - sum(σ_j^2) / σ_total^2)',
    thresholds: 'α >= 0.70 aceptable · >= 0.80 bueno · r_it-c < 0 alerta posible ítem inverso sin recodificar.',
    plain:
      'Verifica si varias preguntas de una misma encuesta miden de forma coherente el mismo constructo antes de sumarlas o promediarlas en un puntaje único.',
    citation: 'Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. Psychometrika, 16(3), 297–334.',
  },
  {
    id: 'gwet-ac1',
    category: 'Confiabilidad Inter-Jueces (IRR)',
    symbol: 'AC₁ / κ',
    title: 'AC₁ de Gwet y Kappa de Cohen (Paradoja de Prevalencia)',
    formula: 'AC_1 = (p_a - p_e(Gwet)) / (1 - p_e(Gwet))',
    thresholds: '>= 0.60 sustancial · >= 0.80 acuerdo casi perfecto (estándar para Human vs. LLM-as-a-Judge).',
    plain:
      'Cuando dos evaluadores (o un humano y un juez IA) coinciden en más del 90% de los casos pero casi todos pertenecen a una misma categoría frecuente, Kappa de Cohen colapsa artificialmente. AC₁ de Gwet corrige esa distorsión.',
    citation: 'Gwet, K. L. (2008). Computing inter-rater reliability and its variance in the presence of high agreement. British Journal of Mathematical and Statistical Psychology, 61(1), 29–48.',
  },
  {
    id: 'r-vol',
    category: 'Analítica Conversacional',
    symbol: 'R_vol',
    title: 'Ratio de Volumen Verbal (Estudiante / Asistente)',
    formula: 'R_vol = Palabras_Estudiante / Palabras_Asistente',
    thresholds: 'R_vol < 0.20 pasividad receptiva · R_vol >= 0.40 co-construcción dialógica activa.',
    plain:
      'Compara cuánto escribe el estudiante respecto a cuánto texto genera el bot. Los prompts con indagación socrática suelen duplicar el protagonismo verbal del estudiante frente a bots que entregan sermones extensos.',
    citation: 'Chi, M. T. H., & Wylie, R. (2014). The ICAP framework: Linking cognitive engagement to active learning outcomes. Educational Psychologist, 49(4), 219–243.',
  },
  {
    id: 'mlu-w',
    category: 'Analítica Conversacional',
    symbol: 'MLU-w',
    title: 'Longitud Media de Enunciado en Palabras (MLU-w)',
    formula: 'MLU-w = Palabras_Estudiante / Turnos_Estudiante',
    thresholds: 'Evalúa la densidad de elaboración contextual aportada por turno.',
    plain:
      'Indica cuántas palabras en promedio contiene cada mensaje del participante, diferenciando respuestas monosilábicas ("sí", "ok") de explicaciones contextualizadas.',
    citation: 'Mercer, N., & Howe, C. (2012). Explaining the dialogic processes of teaching and learning. Learning, Culture and Social Interaction, 1(1), 12–21.',
  },
  {
    id: 'mattr',
    category: 'Analítica Conversacional',
    symbol: 'MATTR',
    title: 'Moving-Average Type-Token Ratio (Diversidad Léxica)',
    formula: 'MATTR_W = mean_{i=1..L-W+1} (|Vocab(t_i..t_{i+W-1})| / W)',
    thresholds: 'Ventanas W=25 y W=50; invariante ante diferencias en la longitud total del chat.',
    plain:
      'Mide la variedad de vocabulario del estudiante usando ventanas móviles de 25 o 50 palabras, evitando el sesgo del índice tradicional que penaliza injustamente las conversaciones más largas.',
    citation: 'Covington, M. A., & McFall, J. D. (2010). Cutting the Gordian knot: The moving-average type–token ratio (MATTR). Journal of Quantitative Linguistics, 17(2), 94–100.',
  },
];

export default function GlosarioPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(GLOSSARY_ENTRIES.map((e) => e.category)));
    return ['Todas', ...unique];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY_ENTRIES.filter((entry) => {
      const catMatch = selectedCategory === 'Todas' || entry.category === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.symbol.toLowerCase().includes(q) ||
        entry.plain.toLowerCase().includes(q) ||
        entry.id.toLowerCase().includes(q)
      );
    });
  }, [query, selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Navigation */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-line-control">
        <div>
          <span className="font-ui-mono text-xs uppercase tracking-wider text-cobalt font-semibold">
            MOD_06 // REFERENCIA METODOLÓGICA ABIERTA
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1 m-0">
            Glosario Estadístico y de Learning Analytics
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LanguageSelector compact={true} />
          <Link
            href="/"
            className="min-h-[44px] px-3.5 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs text-ink inline-flex items-center gap-1.5"
          >
            <CadIcon name="Home" size={14} />
            <span>Inicio</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="min-h-[44px] px-3.5 py-2 border border-cobalt bg-cobalt text-paper hover:bg-cobalt-hover font-ui-mono text-xs font-medium inline-flex items-center gap-1.5"
          >
            <CadIcon name="BarChart2" size={14} />
            <span>Ir al Panel Estadístico</span>
          </Link>
        </div>
      </header>

      {/* Filter & Search Bar */}
      <BlueprintPanel
        codeTag="FILTRO_GLOSARIO"
        title="Consulta de Fórmulas, Umbrales e Interpretación Sencilla"
        headerSlot={
          <MarginNote tone="cobalt" rotate={-1.5}>
            ESTÁNDAR LAK / AIED
          </MarginNote>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <Field label="Buscar indicador, símbolo o concepto" className="mb-0">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej. Cliff, Holm, Likert, Gwet, MATTR..."
                className="ps-field__control w-full font-body text-sm text-ink bg-paper border border-line-control px-3 py-2"
              />
            </Field>
          </div>
          <div className="md:col-span-6 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[44px] px-3 py-1.5 border font-ui-mono text-xs ${
                    active
                      ? 'bg-cobalt text-paper border-cobalt font-semibold'
                      : 'bg-paper-subtle text-ink border-line-control hover:bg-paper'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </BlueprintPanel>

      {/* Glossary Cards */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <article key={item.id} id={item.id} className="scroll-mt-24">
            <BlueprintPanel
              codeTag={item.symbol}
              title={item.title}
              subtitle={item.category}
              headingLevel={2}
              headerSlot={<StatBadge label="Ancla" value={item.id} variant="cobalt" />}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-paper-subtle border border-line-control">
                    <div className="font-ui-mono text-xs uppercase text-ink-2 mb-1">
                      Definición matemática
                    </div>
                    <code className="font-stat text-xs sm:text-sm font-semibold text-ink break-words">
                      {item.formula}
                    </code>
                  </div>
                  <div className="p-3 bg-paper-subtle border border-line-control">
                    <div className="font-ui-mono text-xs uppercase text-ink-2 mb-1">
                      Criterios de interpretación
                    </div>
                    <p className="font-ui-mono text-xs text-ink m-0 leading-relaxed">
                      {item.thresholds}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-cobalt-tint border-l-4 border-cobalt">
                  <p className="font-body text-sm text-ink leading-relaxed m-0">
                    <strong className="font-ui-mono text-xs uppercase tracking-wider text-cobalt mr-1.5">
                      En palabras simples:
                    </strong>
                    {item.plain}
                  </p>
                </div>

                <footer className="pt-2 border-t border-dotted border-rule font-ui-mono text-xs text-ink-2">
                  Referencia canónica: {item.citation}
                </footer>
              </div>
            </BlueprintPanel>
          </article>
        ))}
      </div>
    </div>
  );
}
