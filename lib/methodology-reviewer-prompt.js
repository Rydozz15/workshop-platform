/**
 * PromptSketch Methodological AI Assistants:
 * 1. Critical Methodological Peer Reviewer Assistant
 * 2. Pedagogical Study Design Copilot
 *
 * Provides both live LLM system/user prompts (supporting ES, EN, and PT-BR)
 * and deterministic mathematical fallback synthesis when operating offline
 * or without live API credentials.
 */

export const METHODOLOGY_REVIEWER_SYSTEM_PROMPT = `Eres un revisor metodológico senior de investigación en analítica del aprendizaje y tecnología educativa.
Tu rol NO es elogiar ni resumir superficialmente los resultados: debes auditar con rigor metodológico, psicométrico y pedagógico el experimento A/B de prompts educativos que se te presenta.

DIRECTRIZ DE IDIOMA / LANGUAGE DIRECTIVE / DIRETRIZ DE IDIOMA:
- Responde SIEMPRE en el idioma especificado en la solicitud o en el idioma en que el usuario formule su consulta:
  * Español ('es'): emite el dictamen en español académico formal estándar de publicación.
  * English ('en'): issue the critique in formal academic English adhering to academic peer-review standards.
  * Português do Brasil ('pt-BR' / 'pt'): emita o parecer técnico em português acadêmico rigoroso (padrão de publicação) com terminologia exata (poder amostral, tamanho do efeito, correlação item-total, confiabilidade inter-avaliadores, etc.).

Estructura siempre tu dictamen técnico bajo estas 5 secciones con viñetas concisas:
1. AUDITORÍA DE POTENCIA MUESTRAL Y VALIDEZ ESTADÍSTICA / SAMPLE POWER & STATISTICAL VALIDITY / AUDITORIA DE PODER AMOSTRAL:
   - Evalúa n_A y n_B. Si n < 20 por condición, advierte explícitamente sobre baja potencia estadística (riesgo de error Tipo II) y recomienda reportar el estudio como piloto exploratorio centrado en intervalos de confianza al 95% y magnitudes de efecto (δ de Cliff o d de Cohen) en lugar de depender exclusivamente de p-valores.
   - Verifica la pertinencia de las pruebas seleccionadas por el Gatekeeper (Mann-Whitney U + δ de Cliff para escalas ordinales o distribuciones asimétricas; Welch t + d de Cohen para continuas normales) y el impacto de la corrección secuencial de Holm-Bonferroni (tamaño de familia m).
2. PSICOMETRÍA, EFECTO TECHO Y CONFIABILIDAD (α / IRR) / PSYCHOMETRICS & CEILING EFFECTS / PSICOMETRIA E EFEITO TETO:
   - Examina si las medianas o medias cercanas al máximo de la escala sugieren efecto techo de deseabilidad social o complacencia frente a la IA ("sycophancy bias").
   - Evalúa α de Cronbach (consistencia interna >= 0.70, posibles ítems inversos omitidos si r_it-c < 0) y, si hay datos de jueces, contrasta κ de Cohen frente a AC₁ de Gwet ante posibles paradojas de prevalencia.
3. DINÁMICA DIALÓGICA Y COGNICIÓN (R_vol, MLU-w, MATTR, CONECTORES) / DIALOGIC DYNAMICS / DINÂMICA DIALÓGICA:
   - Analiza el equilibrio de protagonismo verbal (R_vol estudiante/asistente). Advierte si el andamiaje socrático o exploratorio genera respuestas excesivamente verbosas del bot o fatiga interactiva ("Engaged Tailspin": más turnos sin resolución aplicable).
   - Cruza diversidad léxica (MATTR) y densidad de conectores causales/adversativos/metacognitivos con la percepción autorreportada: señala divergencias entre "sentirse cómodo" y elaborar razonamiento profundo.
4. LATENCIA NORMALIZADA Y PROCESAMIENTO DE LECTURA / NORMALIZED LATENCY / LATÊNCIA NORMALIZADA:
   - Evalúa la latencia de lectura normalizada (ms/palabra) y la tasa de lectura omitida (< 100 ms/palabra) o inactividad de pestaña. Distingue tiempo de lectura del output del LLM frente a tiempo de formulación del estudiante.
5. RECOMENDACIONES DE REDISEÑO DE PROMPT Y PROTOCOLO EXPERIMENTAL / ACTIONABLE RECOMMENDATIONS / RECOMENDAÇÕES ACIONÁVEIS:
   - Entrega 2 a 3 modificaciones concretas y accionables sobre el System Prompt (ej. criterios explícitos de transición Explore -> Build, límite de palabras por turno, una sola pregunta focalizada) y sobre el diseño del instrumento para una entrega lista para revisión por pares en revisión por pares.`;

export const STUDY_DESIGN_COPILOT_SYSTEM_PROMPT = `Eres un Experto en diseño de experiencias de aprendizaje con IA y en diseño experimental educativo.
Dado un objetivo de investigación o problema pedagógico descrito por el investigador, diseña un protocolo experimental riguroso de comparación A/B (o pre/post encadenado) listo para ejecutarse en PromptSketch.

DIRECTRIZ DE IDIOMA / LANGUAGE DIRECTIVE:
- Genera todos los campos textuales del objeto JSON (title, hypothesis, onboarding_instructions, condition_a_name, condition_a_prompt, condition_b_name, condition_b_prompt, case_title, case_content, survey_config con sus textos, opciones y etiquetas minLabel/maxLabel) en el idioma solicitado por el usuario o en el idioma activo indicado (Español, English o Português do Brasil).
- Si el objetivo está escrito en portugués o se solicita 'pt-BR', genera el JSON íntegramente en portugués de Brasil.
- Si el objetivo está escrito en inglés o se solicita 'en', genera el JSON íntegramente en inglés.
- Si el objetivo está en español o se solicita 'es', genera el JSON en español.

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin bloques markdown adicionales) con la siguiente estructura exacta:
{
  "title": "Título conciso del estudio experimental",
  "hypothesis": "Hipótesis direccional falsable especificando variable independiente (andamiaje del prompt) y variables dependientes (conductuales/dialógicas y autorreporte).",
  "analysis_type": "preregistrado",
  "onboarding_instructions": "Instrucciones claras y neutrales para los participantes antes de iniciar la conversación (sin revelar la condición asignada).",
  "condition_a_name": "Condición A · Línea Base Directa",
  "condition_a_prompt": "System prompt neutral de control que responde en el mismo idioma del estudiante sin andamiaje adicional.",
  "condition_b_name": "Condición B · Andamiaje Pedagógico Estructurado",
  "condition_b_prompt": "System prompt experimental detallado con reglas explícitas de indagación contextual previa (Explore Mode) y criterios observables de transición a consejo o síntesis (Build Mode), limitando la extensión por turno para evitar fatiga.",
  "case_title": "Título de la viñeta o escenario de aprendizaje",
  "case_content": "Descripción realista del caso o problema que el estudiante resolverá o discutirá con el asistente.",
  "survey_config": [
    {
      "id": "applicability",
      "text": "Las orientaciones del asistente fueron aplicables al contexto específico del problema.",
      "type": "likert",
      "scale": [1, 2, 3, 4, 5],
      "minLabel": "Totalmente en desacuerdo",
      "maxLabel": "Totalmente de acuerdo"
    },
    {
      "id": "contextual_understanding",
      "text": "El asistente indagó y comprendió los detalles clave antes de proponer una solución.",
      "type": "likert",
      "scale": [1, 2, 3, 4, 5],
      "minLabel": "Totalmente en desacuerdo",
      "maxLabel": "Totalmente de acuerdo"
    },
    {
      "id": "cognitive_effort",
      "text": "La conversación me llevó a justificar mis ideas y reflexionar críticamente.",
      "type": "likert",
      "scale": [1, 2, 3, 4, 5],
      "minLabel": "Totalmente en desacuerdo",
      "maxLabel": "Totalmente de acuerdo"
    },
    {
      "id": "premature_solution_rev",
      "text": "El asistente entregó respuestas genéricas inmediatas sin preguntar por mi contexto (ítem inverso).",
      "type": "likert",
      "scale": [1, 2, 3, 4, 5],
      "minLabel": "Totalmente en desacuerdo",
      "maxLabel": "Totalmente de acuerdo",
      "reverse": true
    },
    {
      "id": "behaviors_observed",
      "text": "Durante la interacción, el asistente realizó las siguientes acciones observables:",
      "type": "checklist",
      "options": [
        "Formuló una pregunta diagnóstica sobre el contexto antes de aconsejar",
        "Validó la dificultad del escenario sin asumir hechos no mencionados",
        "Conectó su propuesta final con los detalles que aporté en mis turnos",
        "Entregó una lista extensa de pasos genéricos en el primer turno"
      ]
    },
    {
      "id": "open_reflection",
      "text": "¿Qué aspecto de la interacción ayudó u obstaculizó tu comprensión del problema?",
      "type": "text"
    }
  ]
}`;

/**
 * Builds message array for Critical Methodological Reviewer call with explicit locale direction.
 */
export function buildLakReviewerMessages(payload = {}, lang = 'es') {
  const summaryText = JSON.stringify(payload, null, 2);
  const langDirective =
    lang === 'pt-BR' || lang === 'pt'
      ? 'DIRETRIZ DE IDIOMA OBRIGATÓRIA: Responda integralmente em Português do Brasil mantendo o rigor analítico dos periódicos e congressos da área.'
      : lang === 'en'
      ? 'MANDATORY LANGUAGE DIRECTIVE: Please issue your methodological review critique strictly in academic English adhering to academic peer-review conventions.'
      : 'DIRECTRIZ DE IDIOMA OBLIGATORIA: Por favor emite tu dictamen metodológico estrictamente en español académico estándar de publicación.';

  return [
    { role: 'system', content: METHODOLOGY_REVIEWER_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Audita críticamente los siguientes resultados empíricos calculados en PromptSketch y emite tu dictamen metodológico para publicación académica.\n\n${langDirective}\n\nResultados del experimento:\n${summaryText}`,
    },
  ];
}

/**
 * Deterministic, mathematically grounded peer-review synthesis when AI provider
 * is running in local contingency / offline mode. Supports ES, EN, and PT-BR.
 */
export function generateDeterministicLakCritique(payload = {}, lang = 'es') {
  const isEn = lang === 'en';
  const isPt = lang === 'pt-BR' || lang === 'pt';

  const nA = payload.sampleSize?.nA ?? 0;
  const nB = payload.sampleSize?.nB ?? 0;
  const totalN = nA + nB;
  const familySize = payload.familySize ?? 0;
  const analysisType = payload.analysisType || (isPt ? 'exploratório' : isEn ? 'exploratory' : 'exploratorio');
  const alphaVal = payload.cronbachAlpha?.alpha;
  const rVolA = payload.dialogic?.conditionA?.verbalVolumeRatio;
  const rVolB = payload.dialogic?.conditionB?.verbalVolumeRatio;
  const mattrA = payload.dialogic?.conditionA?.mattr25;
  const mattrB = payload.dialogic?.conditionB?.mattr25;
  const skippedB = payload.dialogic?.conditionB?.skippedReadingRatio;
  const irr = payload.irr;

  const lines = [];

  if (isPt) {
    // PORTUGUÊS (BRASIL)
    lines.push('### 1. Auditoria de Poder Amostral e Validade Estatística');
    if (nA < 20 || nB < 20) {
      lines.push(
        `- **Alerta de amostra reduzida ($n_A = ${nA}$, $n_B = ${nB}$, $N_{\\text{total}} = ${totalN}$):** Com menos de 20 observações por braço, o poder estatístico $(1 - \\beta)$ para detectar efeitos médios com ajuste familiar é restrito. Em um artigo para publicación académica, deve-se declarar explicitamente como **estudo piloto ${analysisType}** e priorizar **$\\delta$ de Cliff** e **IC 95%** em vez de confiar estritamente em p-valores.`
      );
    } else {
      lines.push(
        `- **Equilíbrio amostral adequado ($n_A = ${nA}$, $n_B = ${nB}$):** A amostra permite estimativas assintóticas estáveis com controle de taxa de erro familiar por Holm-Bonferroni ($m = ${familySize}$ contrastes).`
      );
    }
    lines.push(
      `- **Fidelidade de escala e pressupostos:** O Gatekeeper direciona corretamente os itens ordinais para **Mann-Whitney $U$ + $\\delta$ de Cliff**, evitando objeções de revisores sobre o uso indevido de t de Student e d de Cohen em escalas discretas assimétricas.`
    );

    lines.push('\n### 2. Psicometria, Efeito Teto e Concordância Inter-Avaliadores');
    if (typeof alphaVal === 'number') {
      if (alphaVal < 0.7) {
        lines.push(
          `- **Consistência interna sub-limiar ($\\alpha = ${alphaVal.toFixed(3)} < 0.70$):** Não se recomenda calcular pontuação composta única até revisar correlações item-total corrigidas ($r_{it-c}$) ou adicionar itens unidimensionais com controle invertido.`
        );
      } else {
        lines.push(
          `- **Consistência interna aceitável ($\\alpha = ${alphaVal.toFixed(3)} \\ge 0.70$):** O instrumento multi-item exibe covariância interna suficiente para apoiar um escore composto.`
        );
      }
    } else {
      lines.push(
        `- **Diagnóstico de escala:** Recomenda-se incluir ao menos um item codificado inversamente para mitigar aquiescência e efeito teto em avaliações de assistentes generativos.`
      );
    }

    if (irr && irr.canCompute) {
      lines.push(
        `- **Calibração Inter-Avaliadores ($\\kappa = ${irr.cohenKappa.toFixed(3)}$, $AC_1 = ${irr.gwetsAC1.toFixed(3)}$):** ${
          irr.prevalenceWarning
            ? 'Detectada assimetria marginal severa (paradoxo da prevalência): reporte obrigatoriamente $AC_1$ de Gwet junto à concordância percentual.'
            : 'Convergência consistente entre $\\kappa$ de Cohen e $AC_1$ de Gwet validando a rotulagem dedutiva.'
        }`
      );
    }

    lines.push('\n### 3. Dinâmica Dialógica e Esforço Cognitivo');
    if (typeof rVolA === 'number' && typeof rVolB === 'number') {
      lines.push(
        `- **Protagonismo discursivo ($R_{\\text{vol}}$ Condição A = ${rVolA.toFixed(2)} vs. Condição B = ${rVolB.toFixed(2)}):** ${
          rVolB > rVolA
            ? 'O andaime da Condição B eleva a produção verbal relativa do estudante frente ao assistente, indicando agência dialógica.'
            : 'O bot ainda domina o volume textual; convém restringir respostas a 2 parágrafos curtos.'
        }`
      );
    }
    if (typeof mattrA === 'number' && typeof mattrB === 'number') {
      lines.push(
        `- **Diversidade lexical ($\\text{MATTR}_{25}$ A = ${mattrA.toFixed(3)} vs. B = ${mattrB.toFixed(3)}):** Verifique se os turnos adicionais refletem elaboração contextual genuína e não fadiga conversacional (*Engaged Tailspin*).`
      );
    }

    lines.push('\n### 4. Latência Normalizada e Processamento de Leitura');
    if (typeof skippedB === 'number' && skippedB > 0.2) {
      lines.push(
        `- **Alerta de leitura superficial:** ${(skippedB * 100).toFixed(1)}% dos turnos na Condição B exibem latência $< 100\\text{ ms/palavra}$, indicando leitura rápida de blocos longos gerados pelo bot.`
      );
    } else {
      lines.push(
        `- **Ritmo de leitura controlado:** A métrica em ms/palavra separa a extensão gerada pelo LLM do tempo de formulação do estudante, controlando vieses de tamanho entre condições.`
      );
    }

    lines.push('\n### 5. Recomendações Acionáveis para Manuscrito e Redesenho');
    lines.push(
      '- **Transição explícita (Explore → Build):** Mantenha no máximo 1 pergunta diagnóstica por turno e exija evidência contextual nova antes de aconselhar, evitando loops de indagação.'
    );
    lines.push(
      '- **Triangulação de evidências:** No manuscrito, reporte tabelas `booktabs` com $p_{\\text{Holm}}$ e rastros codificados, contrastando autorrelato com marcadores epistêmicos objetivos.'
    );
  } else if (isEn) {
    // ENGLISH
    lines.push('### 1. Sample Power & Statistical Validity Audit');
    if (nA < 20 || nB < 20) {
      lines.push(
        `- **Small sample warning ($n_A = ${nA}$, $n_B = ${nB}$, $N_{\\text{total}} = ${totalN}$):** With fewer than 20 observations per arm, statistical power $(1 - \\beta)$ to detect medium effects under family-wise adjustment is limited. In a research paper, explicitly report this as an **${analysisType} pilot study** and prioritize **Cliff\'s $\\delta$** and **95% CIs** over raw p-value thresholds.`
      );
    } else {
      lines.push(
        `- **Adequate sample balance ($n_A = ${nA}$, $n_B = ${nB}$):** Sample size supports asymptotic estimates with Holm-Bonferroni family-wise error rate control ($m = ${familySize}$ contrasts).`
      );
    }
    lines.push(
      `- **Scale fidelity & assumptions:** The Gatekeeper appropriately routes discrete Likert items to **Mann-Whitney $U$ + Cliff\'s $\\delta$**, avoiding reviewer objections regarding parametric means and Cohen\'s d on skewed ordinal scales.`
    );

    lines.push('\n### 2. Psychometrics, Ceiling Effects & Inter-Rater Reliability');
    if (typeof alphaVal === 'number') {
      if (alphaVal < 0.7) {
        lines.push(
          `- **Sub-threshold internal consistency ($\\alpha = ${alphaVal.toFixed(3)} < 0.70$):** Averaging survey items into a single composite score is discouraged until corrected item-total correlations ($r_{it-c}$) are inspected or unidimensional items with reverse controls are added.`
        );
      } else {
        lines.push(
          `- **Acceptable internal consistency ($\\alpha = ${alphaVal.toFixed(3)} \\ge 0.70$):** Multi-item scale exhibits adequate internal covariance to support a composite score index.`
        );
      }
    } else {
      lines.push(
        `- **Instrument diagnostics:** Incorporating at least one reverse-coded item is recommended to detect acquiescence and mitigate ceiling effects typical of generative AI feedback.`
      );
    }

    if (irr && irr.canCompute) {
      lines.push(
        `- **Inter-Rater Reliability ($\\kappa = ${irr.cohenKappa.toFixed(3)}$, $AC_1 = ${irr.gwetsAC1.toFixed(3)}$):** ${
          irr.prevalenceWarning
            ? 'Severe marginal asymmetry detected (prevalence paradox): reporting Gwet\'s $AC_1$ alongside observed percent agreement is mandatory.'
            : 'Consistent convergence between Cohen\'s $\\kappa$ and Gwet\'s $AC_1$ validating deductive qualitative codes.'
        }`
      );
    }

    lines.push('\n### 3. Dialogic Dynamics & Cognitive Effort');
    if (typeof rVolA === 'number' && typeof rVolB === 'number') {
      lines.push(
        `- **Discursive protagonism ($R_{\\text{vol}}$ Condition A = ${rVolA.toFixed(2)} vs. Condition B = ${rVolB.toFixed(2)}):** ${
          rVolB > rVolA
            ? 'Condition B scaffolding enhances student verbal volume relative to the assistant, indicating learner agency.'
            : 'The assistant still accounts for most verbal volume; limit bot output to at most 2 brief paragraphs.'
        }`
      );
    }
    if (typeof mattrA === 'number' && typeof mattrB === 'number') {
      lines.push(
        `- **Lexical diversity ($\\text{MATTR}_{25}$ A = ${mattrA.toFixed(3)} vs. B = ${mattrB.toFixed(3)}):** Cross-reference this lexical richness with qualitative codes to verify that turns reflect genuine context and not interactive fatigue (*Engaged Tailspin*).`
      );
    }

    lines.push('\n### 4. Normalized Latency & Reading Processing');
    if (typeof skippedB === 'number' && skippedB > 0.2) {
      lines.push(
        `- **Skimmed reading warning:** ${(skippedB * 100).toFixed(1)}% of turns in Condition B show latency $< 100\\text{ ms/word}$, indicating fast scanning of extensive LLM outputs.`
      );
    } else {
      lines.push(
        `- **Controlled reading pace:** Normalization in ms/word isolates LLM output length from student formulation latency, controlling for text length bias across conditions.`
      );
    }

    lines.push('\n### 5. Actionable Recommendations for Manuscript & Redesign');
    lines.push(
      '- **Explicit transition criterion (Explore → Build):** Maintain at most 1 diagnostic question per turn during exploratory inquiry, requiring concrete evidence before prescribing advice.'
    );
    lines.push(
      '- **Triangulated reporting:** In your manuscript, pair `booktabs` tables ($p_{\\text{Holm}}$) with turn-level conversational traces, contrasting perceived utility with objective epistemic markers.'
    );
  } else {
    // ESPAÑOL (Default)
    lines.push('### 1. Auditoría de Potencia Muestral y Validez Estadística');
    if (nA < 20 || nB < 20) {
      lines.push(
        `- **Alerta de muestra pequeña ($n_A = ${nA}$, $n_B = ${nB}$, $N_{\\text{total}} = ${totalN}$):** Con menos de 20 observaciones por brazo, la potencia estadística $(1 - \\beta)$ para detectar efectos medianos tras ajuste familiar es limitada. En un manuscrito de investigación debe declararse explícitamente como **estudio piloto ${analysisType}** y priorizar la interpretación de **$\\delta$ de Cliff** e **IC 95%** por sobre el umbral dicotómico $p < 0.05$.`
      );
    } else {
      lines.push(
        `- **Balance muestral adecuado ($n_A = ${nA}$, $n_B = ${nB}$):** La muestra permite estimaciones asintóticas estables con control de tasa de error familiar mediante Holm-Bonferroni ($m = ${familySize}$ contrastes simultáneos).`
      );
    }
    lines.push(
      `- **Fidelidad de escala y supuestos:** El Gatekeeper desvía correctamente los ítems Likert discretos a **Mann-Whitney $U$ + $\\delta$ de Cliff**, evitando la objeción clásica de revisores sobre el uso indebido de medias paramétricas y $d$ de Cohen en escalas ordinales asimétricas.`
    );

    lines.push('\n### 2. Psicometría, Efecto Techo y Acuerdo Inter-Jueces');
    if (typeof alphaVal === 'number') {
      if (alphaVal < 0.7) {
        lines.push(
          `- **Consistencia interna sub-umbral ($\\alpha = ${alphaVal.toFixed(3)} < 0.70$):** No se recomienda promediar los ítems Likert en un puntaje compuesto único hasta revisar correlaciones ítem-total corregidas ($r_{it-c}$) o incorporar al menos 4 ítems unidimensionales con un ítem inverso de control.`
        );
      } else {
        lines.push(
          `- **Consistencia interna aceptable ($\\alpha = ${alphaVal.toFixed(3)} \\ge 0.70$):** El instrumento multi-ítem exhibe covarianza interna suficiente para respaldar un índice compuesto complementario.`
        );
      }
    } else {
      lines.push(
        `- **Diagnóstico de instrumento:** Se sugiere incluir al menos un ítem codificado inversamente para detectar aquiescencia automática y mitigar el efecto techo habitual en evaluaciones de satisfacción con asistentes generativos.`
      );
    }

    if (irr && irr.canCompute) {
      lines.push(
        `- **Calibración Inter-Jueces ($\\kappa = ${irr.cohenKappa.toFixed(3)}$, $AC_1 = ${irr.gwetsAC1.toFixed(3)}$):** ${
          irr.prevalenceWarning
            ? 'Se detecta asimetría marginal severa (paradoja de prevalencia): reporte obligatoriamente $AC_1$ de Gwet junto al acuerdo porcentual observado.'
            : 'Convergencia consistente entre $\\kappa$ de Cohen y $AC_1$ de Gwet para validar el etiquetado deductivo.'
        }`
      );
    }

    lines.push('\n### 3. Dinámica Dialógica y Esfuerzo Cognitivo');
    if (typeof rVolA === 'number' && typeof rVolB === 'number') {
      lines.push(
        `- **Protagonismo discursivo ($R_{\\text{vol}}$ Condición A = ${rVolA.toFixed(2)} vs. Condición B = ${rVolB.toFixed(2)}):** ${
          rVolB > rVolA
            ? 'El andamiaje de la Condición B incrementa la producción verbal relativa del participante frente al asistente, señal positiva de agencia dialógica.'
            : 'El asistente aún concentra gran parte del volumen léxico; conviene acotar la longitud máxima por respuesta del bot a 2 párrafos breves.'
        }`
      );
    }
    if (typeof mattrA === 'number' && typeof mattrB === 'number') {
      lines.push(
        `- **Diversidad léxica invariante ($\\text{MATTR}_{25}$ A = ${mattrA.toFixed(3)} vs. B = ${mattrB.toFixed(3)}):** Contraste esta riqueza léxica con las notas cualitativas para verificar que los turnos adicionales reflejen elaboración contextual genuina y no fatiga conversacional (*Engaged Tailspin*).`
      );
    }

    lines.push('\n### 4. Latencia Normalizada y Procesamiento de Lectura');
    if (typeof skippedB === 'number' && skippedB > 0.2) {
      lines.push(
        `- **Alerta de lectura superficial:** Un ${(skippedB * 100).toFixed(1)}% de los turnos en Condición B presenta latencia $< 100\\text{ ms/palabra}$, indicando posible escaneo rápido de bloques extensos generados por el modelo.`
      );
    } else {
      lines.push(
        `- **Ritmo de lectura controlado:** La normalización en ms/palabra separa la extensión del texto generado por el LLM del tiempo de formulación del estudiante, controlando el sesgo de longitud entre condiciones.`
      );
    }

    lines.push('\n### 5. Recomendaciones Accionables para el Manuscrito y Rediseño');
    lines.push(
      '- **Regla explícita de transición (Explore → Build):** Mantenga un máximo de 1 pregunta diagnóstica por turno en fase exploratoria y exija evidencia contextual nueva antes de pasar a recomendaciones, evitando bucles de indagación indefinidos.'
    );
    lines.push(
      '- **Triangulación conductual-perceptual:** En la sección de Resultados, reporte en paralelo la tabla `booktabs` con $p_{\\text{Holm}}$ y las trazas codificadas (`tidy_turns.csv`), contrastando la percepción subjetiva con marcadores epistémicos objetivos.'
    );
  }

  return lines.join('\n');
}

/**
 * Deterministic fallback for Study Design Copilot when no live LLM key is active.
 * Generates localized study protocol objects in ES, EN, or PT-BR.
 */
export function generateDeterministicStudyDesign(goal = '', lang = 'es') {
  const isEn = lang === 'en';
  const isPt = lang === 'pt-BR' || lang === 'pt';

  const defaultGoal = isPt
    ? 'Andaimes socráticos para resolução de problemas complexos no ensino superior'
    : isEn
    ? 'Socratic scaffolding for complex problem solving in higher education'
    : 'Andamiaje socrático para resolución de problemas complejos en educación superior';

  const cleanGoal = (goal || defaultGoal).trim();

  if (isPt) {
    return {
      title: `Estudo A/B: ${cleanGoal.slice(0, 68)}`,
      hypothesis:
        'Participantes atribuídos à Condição B (andaime Explore-before-Build com investigação contextual prévia) exibirão maior proporção de elaboração epistêmica (R_vol, MATTR e conectores causais) e maior aplicabilidade percebida (δ de Cliff > 0.33) do que participantes na Condição A (resposta direta).',
      analysis_type: 'preregistrado',
      onboarding_instructions:
        '1) Leia com atenção o cenário do caso antes de enviar a primeira mensagem. 2) Interaja com o assistente por ao menos 3 turnos trazendo detalhes concretos da situação. 3) Ao concluir, responda com sinceridade o questionário breve.',
      condition_a_name: 'Condição A · Linha de Base Direta',
      condition_a_prompt:
        'Responda sempre no mesmo idioma em que o estudante escrever, de forma clara, prestativa e direta.',
      condition_b_name: 'Condição B · Andaime Explore-before-Build',
      condition_b_prompt: `Você é um tutor pedagógico especializado em: ${cleanGoal}.\n\nREGRA CRÍTICA DE SELEÇÃO DE MODO:\nA cada turno, avalie a mensagem do estudante e opere em UM dos seguintes modos:\n\nMODO INVESTIGAR (quando a postagem for incompleta, ambígua ou carecer de contexto):\n- Valide brevemente o ponto de partida sem presumir fatos não informados.\n- NÃO entregue a solução completa ainda. Formule exatamente UMA pergunta focalizada para compreender o raciocínio ou restrições do caso.\n\nMODO CONSTRUIR (apenas quando o estudante responder à investigação com dados ou tentativas concretas):\n- Conecte sua orientação com os elementos trazidos pelo estudante.\n- Proponha no máximo 2 estratégias acionáveis e verifique a viabilidade.\n\nRESTRIÇÃO: Máximo de 2 parágrafos curtos por turno. Responda sempre no idioma do estudante.`,
      case_title: 'Caso Experimental: Dilema Aplicado de Tomada de Decisão',
      case_content: `Contexto do cenário (${cleanGoal}): Você enfrenta uma situação complexa onde critérios acadêmicos válidos entram em tensão e precisa estruturar uma decisão fundamentada. Inicie a conversa apresentando sua dúvida principal e avalie as alternativas sugeridas pelo assistente.`,
      survey_config: [
        {
          id: 'applicable',
          text: 'As orientações do assistente foram aplicáveis às restrições do meu caso.',
          type: 'likert',
          scale: [1, 2, 3, 4, 5],
          minLabel: 'Discordo totalmente',
          maxLabel: 'Concordo totalmente',
        },
        {
          id: 'understood',
          text: 'O assistente compreendeu minha situação antes de sugerir soluções.',
          type: 'likert',
          scale: [1, 2, 3, 4, 5],
          minLabel: 'Discordo totalmente',
          maxLabel: 'Concordo totalmente',
        },
        {
          id: 'critical_reflection',
          text: 'O diálogo me estimulou a justificar minhas ideias e refletir criticamente.',
          type: 'likert',
          scale: [1, 2, 3, 4, 5],
          minLabel: 'Discordo totalmente',
          maxLabel: 'Concordo totalmente',
        },
        {
          id: 'generic_rev',
          text: 'Senti que o assistente deu respostas genéricas sem ouvir meus detalhes (item inverso).',
          type: 'likert',
          scale: [1, 2, 3, 4, 5],
          minLabel: 'Discordo totalmente',
          maxLabel: 'Concordo totalmente',
          reverse: true,
        },
        {
          id: 'checklist',
          text: 'Durante a conversa, o assistente... (marque todas as aplicáveis)',
          type: 'checklist',
          options: [
            'Perguntou sobre meu contexto antes de aconselhar',
            'Validou a complexidade da situação sem inventar premissas',
            'Adaptou as sugestões aos dados que compartilhei no chat',
            'Entregou imediatamente uma lista de soluções sem fazer perguntas',
          ],
        },
        {
          id: 'qualitative',
          text: 'Por que este assistente seria útil (ou não) em uma situação prática real semelhante?',
          type: 'text',
        },
      ],
    };
  }

  if (isEn) {
    return {
      title: `A/B Study: ${cleanGoal.slice(0, 68)}`,
      hypothesis:
        'Participants assigned to Condition B (Explore-before-Build scaffolding with contextual inquiry) will show greater epistemic elaboration (R_vol, MATTR, and causal connectors) and higher perceived applicability (Cliff\'s δ > 0.33) compared to Condition A (direct advice).',
      analysis_type: 'preregistrado',
      onboarding_instructions:
        '1) Carefully read the scenario case before typing your first message. 2) Converse with the assistant for at least 3 turns providing concrete context as in a real academic setting. 3) Complete the short post-session survey honestly.',
      condition_a_name: 'Condition A · Direct Baseline',
      condition_a_prompt:
        'Always respond in the same language the student uses, clearly, cordially, and directly addressing their question.',
      condition_b_name: 'Condition B · Explore-before-Build Scaffolding',
      condition_b_prompt: `You are an instructional tutor specializing in: ${cleanGoal}.\n\nMODE SELECTION RULE:\nIn each turn evaluate student input and operate in ONE mode:\n\nEXPLORE MODE (when student prompt is incomplete, ambiguous, or lacks context):\n- Briefly validate their starting point without assuming unstated facts.\n- Do NOT provide full solution yet. Ask exactly ONE focused diagnostic question.\n\nBUILD MODE (only when student answers with concrete details or reasoning):\n- Explicitly connect advice to student input.\n- Offer at most 2 actionable strategies and verify feasibility.\n\nLENGTH CONSTRAINT: Max 2 short paragraphs per turn. Always reply in student's language.`,
      case_title: 'Experimental Case: Applied Decision-Making Scenario',
      case_content: `Scenario context (${cleanGoal}): You are facing a complex challenge where two competing criteria are in tension, and you must structure a reasoned decision. Start by explaining your core question to the assistant and evaluate the pedagogical dialogue that follows.`,
      survey_config: [
        {
          id: 'applicable',
          text: 'The assistant\'s advice was applicable to my specific problem constraints.',
          type: 'likert',
          scale: [1, 2, 3, 4, 5],
          minLabel: 'Strongly disagree',
          maxLabel: 'Strongly agree',
        },
        {
          id: 'understood',
          text: 'The assistant understood my context before proposing recommendations.',
          type: 'likert',
          scale: [1, 2, 3, 4, 5],
          minLabel: 'Strongly disagree',
          maxLabel: 'Strongly agree',
        },
        {
          id: 'critical_reflection',
          text: 'The dialogue challenged my assumptions and encouraged critical reflection.',
          type: 'likert',
          scale: [1, 2, 3, 4, 5],
          minLabel: 'Strongly disagree',
          maxLabel: 'Strongly agree',
        },
        {
          id: 'generic_rev',
          text: 'The assistant provided generic responses without asking about my context (reverse item).',
          type: 'likert',
          scale: [1, 2, 3, 4, 5],
          minLabel: 'Strongly disagree',
          maxLabel: 'Strongly agree',
          reverse: true,
        },
        {
          id: 'checklist',
          text: 'During the interaction, the assistant... (check all that apply)',
          type: 'checklist',
          options: [
            'Asked a diagnostic question before advising',
            'Acknowledged problem constraints without assuming unstated facts',
            'Tailored recommendations to details I shared in the chat',
            'Delivered an immediate generic list of steps without asking questions',
          ],
        },
        {
          id: 'qualitative',
          text: 'Why would this assistant be helpful (or unhelpful) in a similar real situation?',
          type: 'text',
        },
      ],
    };
  }

  // Default: ESPAÑOL
  return {
    title: `Estudio A/B: ${cleanGoal.slice(0, 68)}`,
    hypothesis:
      'Los participantes asignados a la Condición B (andamiaje Explore-before-Build con indagación contextual previa) exhibirán mayor proporción de elaboración epistémica (R_vol, MATTR y conectores causales) y mayor aplicabilidad percibida (δ de Cliff > 0.33) que quienes interactúen con la Condición A (respuesta directa sin indagación).',
    analysis_type: 'preregistrado',
    onboarding_instructions:
      '1) Lee atentamente el escenario del caso antes de escribir tu primer mensaje. 2) Interactúa con el asistente durante al menos 3 turnos aportando detalles concretos como lo harías en una situación académica real. 3) Al finalizar, responde la evaluación breve con total honestidad; no existen respuestas correctas o incorrectas.',
    condition_a_name: 'Condición A · Línea Base Directa',
    condition_a_prompt:
      'Responde siempre en el mismo idioma en que escribe el estudiante, de manera clara, cordial y directa frente a su consulta.',
    condition_b_name: 'Condición B · Andamiaje Explore-before-Build',
    condition_b_prompt: `Eres un tutor pedagógico especializado en: ${cleanGoal}.\n\nREGLA DE SELECCIÓN DE MODO (CRÍTICA):\nEn cada turno evalúa la intervención del estudiante y opera en UNO de estos dos modos (por defecto MODO EXPLORAR):\n\nMODO EXPLORAR (cuando el planteamiento inicial es incompleto, ambiguo o carece de contexto específico):\n- Valida brevemente el punto de partida sin asumir hechos no mencionados.\n- NO entregues la solución completa todavía. Formula exactamente UNA pregunta focalizada para comprender el razonamiento previo o las restricciones del caso.\n\nMODO CONSTRUIR (solo cuando el estudiante ya respondió tu indagación aportando criterios, datos o intentos concretos):\n- Conecta explícitamente tu orientación con los elementos aportados por el estudiante.\n- Propón máximo 2 estrategias accionables y cierra verificando su viabilidad.\n\nRESTRICCIÓN DE EXTENSIÓN: Máximo 2 párrafos breves por turno. Responde siempre en el idioma del estudiante.`,
    case_title: 'Caso Experimental: Dilema Aplicado de Toma de Decisiones',
    case_content: `Contexto del escenario (${cleanGoal}): Te enfrentas a una situación compleja donde dos criterios válidos entran en tensión y debes estructurar una decisión fundamentada antes de tu próxima revisión académica. Inicia la conversación planteando tu inquietud principal al asistente y evalúa las alternativas que surjan en el diálogo.`,
    survey_config: [
      {
        id: 'applicable',
        text: 'Las orientaciones recibidas fueron aplicables a las restricciones concretas de mi caso.',
        type: 'likert',
        scale: [1, 2, 3, 4, 5],
        minLabel: 'Totalmente en desacuerdo',
        maxLabel: 'Totalmente de acuerdo',
      },
      {
        id: 'understood',
        text: 'El asistente comprendió mi situación específica antes de ofrecer recomendaciones.',
        type: 'likert',
        scale: [1, 2, 3, 4, 5],
        minLabel: 'Totalmente en desacuerdo',
        maxLabel: 'Totalmente de acuerdo',
      },
      {
        id: 'critical_reflection',
        text: 'El diálogo me ayudó a cuestionar supuestos o estructurar mejor mis propios argumentos.',
        type: 'likert',
        scale: [1, 2, 3, 4, 5],
        minLabel: 'Totalmente en desacuerdo',
        maxLabel: 'Totalmente de acuerdo',
      },
      {
        id: 'generic_rev',
        text: 'Sentí que el asistente dio respuestas prefabricadas sin escuchar mis detalles (ítem inverso).',
        type: 'likert',
        scale: [1, 2, 3, 4, 5],
        minLabel: 'Totalmente en desacuerdo',
        maxLabel: 'Totalmente de acuerdo',
        reverse: true,
      },
      {
        id: 'checklist',
        text: 'Durante la conversación, el asistente... (marca todas las que correspondan)',
        type: 'checklist',
        options: [
          'Preguntó por mi contexto o intentos previos antes de aconsejar',
          'Validó la complejidad de la situación sin inventar supuestos',
          'Adaptó su sugerencia a los datos que entregué en el chat',
          'Entregó una lista inmediata de soluciones sin hacer preguntas',
        ],
      },
      {
        id: 'qualitative',
        text: '¿Por qué este asistente te resultaría útil (o no) en una situación real similar?',
        type: 'text',
      },
    ],
  };
}
