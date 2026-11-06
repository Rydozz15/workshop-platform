'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BlueprintPanel,
  SplitButton,
  StatBadge,
  TitleBlock,
  DataTable,
  ChartFrame,
  Abbr,
  Disclosure,
} from '@/components/ui/blueprint';
import CadIcon from '@/components/ui/cad-icon';

import {
  mean,
  computeSampleMoments,
  shapiroWilk,
  leveneTest,
  runAssumptionGatekeeper,
  runWelchTTest,
  runMannWhitneyU,
  applyHolmBonferroni,
} from '@/lib/stats';
import { calculateCronbachAlpha, calculateHakeGain } from '@/lib/psychometrics';
import { calculateIRR } from '@/lib/irr';
import { analyzeConversation } from '@/lib/chat-analytics';
import { generateBooktabsTable } from '@/lib/latex-generator';
import { useLanguage, useTr } from '@/lib/i18n/context';

/**
 * Resolves a survey answer from a session regardless of whether keys are stored
 * by question ID (new sessions) or by question text / exported Supabase header (ISDDE benchmark).
 */
function resolveSurveyValue(session, question) {
  const answers = session?.survey_answers || session?.survey_responses;
  if (!answers || typeof answers !== 'object' || !question) return undefined;

  if (question.id && answers[question.id] !== undefined) {
    return answers[question.id];
  }
  if (question.text && answers[question.text] !== undefined) {
    return answers[question.text];
  }
  if (question.text) {
    const prefix = question.text.trim().toLowerCase().slice(0, 36);
    for (const [k, val] of Object.entries(answers)) {
      const cleanKey = k.trim().toLowerCase();
      if (cleanKey.startsWith(prefix) || cleanKey.includes(prefix)) {
        return val;
      }
    }
  }
  return undefined;
}

function toNumericRating(val) {
  if (typeof val === 'number' && !isNaN(val) && isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val.trim());
    if (!isNaN(parsed) && isFinite(parsed)) return parsed;
  }
  return null;
}

function mapIsddeOutcomeConstruct(label = '') {
  const s = String(label).toLowerCase();
  if (s.includes('actionable') || s.includes('enriched')) return 'Orientacion_Enriquecida';
  if (s.includes('abandon') || s.includes('fatigue')) return 'Abandono_Fatiga';
  return 'Respuesta_Superficial';
}

function mapIsddeFlowConstruct(label = '') {
  const s = String(label).toLowerCase();
  if (s.includes('productive') || s.includes('engaged conversation')) return 'Indagacion_Productiva';
  if (s.includes('fatigue') || s.includes('tailspin')) return 'Fatiga_Bucle';
  return 'Directo_Superficial';
}

const PREVALENCE_DEMO_CSV = [
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Indagacion_Contextual',
  'Indagacion_Contextual,Directo_Sin_Indagacion',
  'Directo_Sin_Indagacion,Indagacion_Contextual',
  'Directo_Sin_Indagacion,Directo_Sin_Indagacion',
].join('\n');

const TIER_SPANISH = {
  negligible: 'Insignificante',
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
};


/** Collapsible analysis block: plain-language question as the title, details on demand. */
function AnalysisSection({ title, summary, defaultOpen = false, badge = null, children }) {
  return (
    <Disclosure title={title} summary={summary} defaultOpen={defaultOpen}>
      {badge && <div className="mb-3">{badge}</div>}
      <div className="space-y-4">{children}</div>
    </Disclosure>
  );
}

export default function AnalyticsPage() {
  const tr = useTr();
  const { locale } = useLanguage();
  const [raw, setRaw] = useState({
    workshops: [],
    sessions: [],
    versions: [],
    telemetry: [],
    irrCalibration: null,
  });
  const [loading, setLoading] = useState(true);
  const [statusBanner, setStatusBanner] = useState(null);

  // Comparison Axis State
  const [compareAxis, setCompareAxis] = useState('campaigns'); // 'campaigns' | 'versions'
  const [campaignAId, setCampaignAId] = useState('');
  const [campaignBId, setCampaignBId] = useState('');
  const [versionScopeWorkshopId, setVersionScopeWorkshopId] = useState('');
  const [versionAId, setVersionAId] = useState('');
  const [versionBId, setVersionBId] = useState('');

  // Chart metric focus
  const [selectedChartMetricKey, setSelectedChartMetricKey] = useState('');

  // IRR Calibration Mode
  const [irrMode, setIrrMode] = useState('isdde_outcome'); // 'isdde_outcome' | 'isdde_flow' | 'prevalence_demo' | 'custom'
  const [customIrrCsv, setCustomIrrCsv] = useState(PREVALENCE_DEMO_CSV);

  // LaTeX drawer & copy state
  const [showLatexModal, setShowLatexModal] = useState(false);
  const [copiedLatex, setCopiedLatex] = useState(false);

  // Methodological reviewer state
  const [lakLoading, setLakLoading] = useState(false);
  const [lakReview, setLakReview] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      const ws = Array.isArray(json.workshops) ? json.workshops : [];
      const vs = Array.isArray(json.versions) ? json.versions : [];
      const ss = Array.isArray(json.sessions) ? json.sessions : [];

      // Sort chained steps naturally so Step 1 = A and Step 2 = B by default
      const sortedWs = [...ws].sort((a, b) => {
        if (a.chain_id && a.chain_id === b.chain_id) {
          return (a.chain_order || 1) - (b.chain_order || 1);
        }
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      });

      setRaw({
        workshops: sortedWs,
        sessions: ss,
        versions: vs,
        telemetry: Array.isArray(json.telemetry) ? json.telemetry : [],
        irrCalibration: json.irrCalibration || null,
      });

      if (sortedWs.length >= 2) {
        setCampaignAId((prev) => prev || sortedWs[0].id);
        setCampaignBId((prev) => prev || sortedWs[1].id);
      } else if (sortedWs.length === 1) {
        setCampaignAId((prev) => prev || sortedWs[0].id);
        setCampaignBId((prev) => prev || sortedWs[0].id);
        if (vs.length >= 2) {
          setCompareAxis('versions');
        }
      }

      if (vs.length >= 2) {
        setVersionAId((prev) => prev || vs[0].id);
        setVersionBId((prev) => prev || vs[1].id);
      } else if (vs.length === 1) {
        setVersionAId((prev) => prev || vs[0].id);
        setVersionBId((prev) => prev || vs[0].id);
      }
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: tr('Error al cargar motor analítico: {p0}', { p0: err.message }),
      });
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && showLatexModal) {
        setShowLatexModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showLatexModal]);

  // 1. Resolve Condition A & Condition B cohorts
  const cohortData = useMemo(() => {
    const { workshops, sessions, versions } = raw;

    if (compareAxis === 'campaigns') {
      const wA = workshops.find((w) => w.id === campaignAId) || workshops[0] || null;
      const wB = workshops.find((w) => w.id === campaignBId) || workshops[1] || wA;
      const sessA = wA ? sessions.filter((s) => s.workshop_id === wA.id) : [];
      const sessB = wB ? sessions.filter((s) => s.workshop_id === wB.id) : [];
      return {
        labelA: wA ? wA.name : tr('Condición A'),
        labelB: wB ? wB.name : tr('Condición B'),
        analysisType: wB?.analysis_type || wA?.analysis_type || 'preregistrado',
        hypothesis: wB?.hypothesis || wA?.hypothesis || '',
        surveyConfigA: wA?.survey_config || [],
        surveyConfigB: wB?.survey_config || [],
        sessionsA: sessA,
        sessionsB: sessB,
      };
    }

    // Compare two versions/scenarios
    const vA = versions.find((v) => v.id === versionAId) || versions[0] || null;
    const vB = versions.find((v) => v.id === versionBId) || versions[1] || vA;
    const scopedSessions = versionScopeWorkshopId
      ? sessions.filter((s) => s.workshop_id === versionScopeWorkshopId)
      : sessions;
    const scopedWorkshop = versionScopeWorkshopId
      ? workshops.find((w) => w.id === versionScopeWorkshopId)
      : workshops[0];

    return {
      labelA: vA ? vA.title : 'Escenario A',
      labelB: vB ? vB.title : 'Escenario B',
      analysisType: scopedWorkshop?.analysis_type || 'exploratorio',
      hypothesis: scopedWorkshop?.hypothesis || '',
      surveyConfigA: scopedWorkshop?.survey_config || [],
      surveyConfigB: scopedWorkshop?.survey_config || [],
      sessionsA: vA ? scopedSessions.filter((s) => s.version_id === vA.id) : [],
      sessionsB: vB ? scopedSessions.filter((s) => s.version_id === vB.id) : [],
    };
  }, [
    raw,
    compareAxis,
    campaignAId,
    campaignBId,
    versionScopeWorkshopId,
    versionAId,
    versionBId,
  ]);

  // 2. Dialogic & Observability Metrics per session and per condition
  const dialogicSummary = useMemo(() => {
    const summarizeCohort = (sessList) => {
      const analyzed = sessList.map((s) => ({
        session: s,
        chat: analyzeConversation(s.messages || []),
      }));

      const n = analyzed.length;
      const rVolArr = analyzed.map((x) => x.chat.verbalVolumeRatio);
      const mluArr = analyzed.map((x) => x.chat.studentMluW);
      const mattr25Arr = analyzed.map((x) => x.chat.mattr25);
      const mattr50Arr = analyzed.map((x) => x.chat.mattr50);
      const stuWordsArr = analyzed.map((x) => x.chat.studentWords);
      const botWordsArr = analyzed.map((x) => x.chat.botWords);
      const causalArr = analyzed.map((x) => x.chat.epistemicConnectors.causalDensity);
      const advArr = analyzed.map((x) => x.chat.epistemicConnectors.adversativeDensity);
      const metaArr = analyzed.map((x) => x.chat.epistemicConnectors.metacognitiveDensity);
      const epistemicTotalArr = analyzed.map(
        (x) =>
          x.chat.epistemicConnectors.causalDensity +
          x.chat.epistemicConnectors.adversativeDensity +
          x.chat.epistemicConnectors.metacognitiveDensity
      );
      const readingLatArr = analyzed
        .map((x) => x.chat.avgReadingLatency)
        .filter((v) => v > 0);

      let promptTokens = 0;
      let completionTokens = 0;
      let totalCostUsd = 0;
      const ttftArr = [];

      sessList.forEach((s) => {
        (s.messages || []).forEach((m) => {
          const tel = m.telemetry || m.metadata?.telemetry;
          if (tel) {
            promptTokens += Number(tel.prompt_tokens || 0);
            completionTokens += Number(tel.completion_tokens || 0);
            totalCostUsd += Number(tel.cost_usd || 0);
            if (tel.ttft_ms) ttftArr.push(Number(tel.ttft_ms));
          } else if (m.role === 'assistant') {
            // Token estimation fallback for historical benchmark transcripts (~1.32 tokens/word)
            const wc = (m.content || '').trim().split(/\s+/).filter(Boolean).length;
            completionTokens += Math.round(wc * 1.32);
          } else if (m.role === 'user') {
            const wc = (m.content || '').trim().split(/\s+/).filter(Boolean).length;
            promptTokens += Math.round(wc * 1.32);
          }
        });
      });

      return {
        n,
        analyzed,
        rVolArr,
        mluArr,
        mattr25Arr,
        mattr50Arr,
        stuWordsArr,
        botWordsArr,
        epistemicTotalArr,
        verbalVolumeRatio: mean(rVolArr),
        studentMluW: mean(mluArr),
        mattr25: mean(mattr25Arr),
        mattr50: mean(mattr50Arr),
        meanStudentWords: mean(stuWordsArr),
        meanBotWords: mean(botWordsArr),
        causalDensity: mean(causalArr),
        adversativeDensity: mean(advArr),
        metacognitiveDensity: mean(metaArr),
        avgReadingLatencyMsPerWord: readingLatArr.length > 0 ? mean(readingLatArr) : 0,
        skippedReadingRatio: mean(analyzed.map((x) => x.chat.skippedReadingRatio)),
        outlierTurnsTotal: analyzed.reduce((acc, x) => acc + x.chat.outlierTurns, 0),
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCostUsd:
          totalCostUsd > 0
            ? totalCostUsd
            : (promptTokens * 0.59 + completionTokens * 0.79) / 1_000_000,
        meanTtftMs: ttftArr.length > 0 ? mean(ttftArr) : null,
      };
    };

    return {
      A: summarizeCohort(cohortData.sessionsA),
      B: summarizeCohort(cohortData.sessionsB),
    };
  }, [cohortData]);

  // 3. Assumption Gatekeeper + Inferential Family + Holm-Bonferroni Adjustment
  const inferentialBundle = useMemo(() => {
    const candidateSeries = [];

    // 3A. Shared Likert survey items
    const configMap = new Map();
    (cohortData.surveyConfigA || []).forEach((q) => {
      if (q.type === 'likert') configMap.set(q.id || q.text, q);
    });
    (cohortData.surveyConfigB || []).forEach((q) => {
      if (q.type === 'likert' && !configMap.has(q.id || q.text)) {
        configMap.set(q.id || q.text, q);
      }
    });

    for (const [key, q] of configMap.entries()) {
      const valsA = cohortData.sessionsA
        .map((s) => toNumericRating(resolveSurveyValue(s, q)))
        .filter((v) => v !== null);
      const valsB = cohortData.sessionsB
        .map((s) => toNumericRating(resolveSurveyValue(s, q)))
        .filter((v) => v !== null);

      if (valsA.length > 0 && valsB.length > 0) {
        candidateSeries.push({
          key: `likert_${key}`,
          name: q.text || key,
          scaleHint: 'ordinal',
          groupA: valsA,
          groupB: valsB,
        });
      }
    }

    // 3B. Continuous Conversational & Behavioral Metrics
    const continuousDefs = [
      {
        key: 'verbal_volume_ratio',
        name: 'Protagonismo Verbal Estudiante/IA (R_vol)',
        groupA: dialogicSummary.A.rVolArr,
        groupB: dialogicSummary.B.rVolArr,
      },
      {
        key: 'student_mlu_w',
        name: tr('Longitud Media de Enunciado Estudiantil (MLU-w)'),
        groupA: dialogicSummary.A.mluArr,
        groupB: dialogicSummary.B.mluArr,
      },
      {
        key: 'mattr_25',
        name: tr('Diversidad Léxica Invariante (MATTR W=25)'),
        groupA: dialogicSummary.A.mattr25Arr,
        groupB: dialogicSummary.B.mattr25Arr,
      },
      {
        key: 'epistemic_density',
        name: tr('Densidad Epistémica Total (conectores / 100 palabras)'),
        groupA: dialogicSummary.A.epistemicTotalArr,
        groupB: dialogicSummary.B.epistemicTotalArr,
      },
    ];

    continuousDefs.forEach((def) => {
      if (def.groupA.length >= 2 && def.groupB.length >= 2) {
        candidateSeries.push({
          ...def,
          scaleHint: 'continuous',
        });
      }
    });

    // Run Gatekeeper + Selected Test on every series
    const rawEvaluations = candidateSeries.map((item) => {
      const gate = runAssumptionGatekeeper({
        groupA: item.groupA,
        groupB: item.groupB,
        metricName: item.name,
        scaleType: item.scaleHint,
      });

      const swA = shapiroWilk(item.groupA);
      const swB = shapiroWilk(item.groupB);
      const lev = leveneTest(item.groupA, item.groupB);
      const momA = computeSampleMoments(item.groupA);
      const momB = computeSampleMoments(item.groupB);

      if (gate.recommendedTest === 'welch_t') {
        const welch = runWelchTTest(item.groupA, item.groupB);
        if (welch.canCompute) {
          return {
            ...item,
            gate,
            swA,
            swB,
            lev,
            momA,
            momB,
            testUsed: 'welch_t',
            pValue: welch.pValue,
            statSymbol: 't',
            statVal: welch.t,
            df: welch.df,
            meanA: welch.meanA,
            meanB: welch.meanB,
            sdA: welch.sdA,
            sdB: welch.sdB,
            cohensD: welch.cohensD,
            dCi: welch.dCi,
            effectLabel: `d = ${welch.cohensD >= 0 ? '+' : ''}${welch.cohensD.toFixed(2)}`,
            effectCiLabel: `[${welch.dCi[0].toFixed(2)}, ${welch.dCi[1].toFixed(2)}]`,
            magnitudeTier: welch.tier,
          };
        }
      }

      // Non-parametric Mann-Whitney U + Cliff's delta
      const mwu = runMannWhitneyU(item.groupA, item.groupB);
      return {
        ...item,
        gate,
        swA,
        swB,
        lev,
        momA,
        momB,
        testUsed: 'mann_whitney_u',
        pValue: mwu.pValue,
        statSymbol: 'U',
        statVal: mwu.uA,
        meanA: momA ? momA.mean : mean(item.groupA),
        meanB: momB ? momB.mean : mean(item.groupB),
        sdA: momA ? momA.sd : 0,
        sdB: momB ? momB.sd : 0,
        medianA: mwu.medianA,
        medianB: mwu.medianB,
        cliffsDelta: mwu.cliffsDelta,
        deltaCi: mwu.deltaCi,
        effectLabel:
          mwu.cliffsDelta !== null
            ? `δ = ${mwu.cliffsDelta >= 0 ? '+' : ''}${mwu.cliffsDelta.toFixed(2)}`
            : 'N/A',
        effectCiLabel: mwu.deltaCi
          ? `[${mwu.deltaCi[0].toFixed(2)}, ${mwu.deltaCi[1].toFixed(2)}]`
          : '',
        magnitudeTier: mwu.romanoMagnitude || 'negligible',
      };
    });

    const holmAdjusted = applyHolmBonferroni(rawEvaluations);
    return holmAdjusted;
  }, [cohortData, dialogicSummary, tr]);

  // Keep selectedChartMetricKey synced
  useEffect(() => {
    if (
      inferentialBundle.length > 0 &&
      !inferentialBundle.some((r) => r.key === selectedChartMetricKey)
    ) {
      setSelectedChartMetricKey(inferentialBundle[0].key);
    }
  }, [inferentialBundle, selectedChartMetricKey]);

  // 4. Behavioral Checklist Comparison (e.g. Contextual Inquiry 0% vs 89% in ISDDE)
  const checklistComparison = useMemo(() => {
    const checklistQ =
      (cohortData.surveyConfigA || []).find((q) => q.type === 'checklist') ||
      (cohortData.surveyConfigB || []).find((q) => q.type === 'checklist');
    if (!checklistQ) return [];

    const optionsSet = new Set(checklistQ.options || []);
    const collectSelections = (sessList) =>
      sessList.map((s) => {
        const v = resolveSurveyValue(s, checklistQ);
        if (Array.isArray(v)) {
          v.forEach((opt) => optionsSet.add(opt));
          return v;
        }
        return [];
      });

    const selA = collectSelections(cohortData.sessionsA);
    const selB = collectSelections(cohortData.sessionsB);
    const nA = Math.max(1, cohortData.sessionsA.length);
    const nB = Math.max(1, cohortData.sessionsB.length);

    return Array.from(optionsSet).map((opt, idx) => {
      const countA = selA.filter((arr) => arr.includes(opt)).length;
      const countB = selB.filter((arr) => arr.includes(opt)).length;
      const pctA = Math.round((countA / nA) * 100);
      const pctB = Math.round((countB / nB) * 100);
      return {
        id: idx + 1,
        behavior: opt,
        condA: `${countA}/${cohortData.sessionsA.length} (${pctA}%)`,
        condB: `${countB}/${cohortData.sessionsB.length} (${pctB}%)`,
        deltaPct: `${pctB - pctA >= 0 ? '+' : ''}${pctB - pctA} pp`,
      };
    });
  }, [cohortData]);

  // 5. Psychometrics: Cronbach's Alpha & Paired Hake's Normalized Gain
  const psychometricsBundle = useMemo(() => {
    const likertQuestions = (cohortData.surveyConfigB?.length
      ? cohortData.surveyConfigB
      : cohortData.surveyConfigA || []
    ).filter((q) => q.type === 'likert');

    // Build N x k matrix across combined completed sessions
    const combinedSessions = [...cohortData.sessionsA, ...cohortData.sessionsB];
    const matrix = [];
    const reverseIndices = [];

    likertQuestions.forEach((q, idx) => {
      if (q.reverse) reverseIndices.push(idx);
    });

    combinedSessions.forEach((s) => {
      const row = likertQuestions.map((q) => toNumericRating(resolveSurveyValue(s, q)));
      if (row.length >= 2 && row.every((v) => v !== null)) {
        matrix.push(row);
      }
    });

    const alphaRes = calculateCronbachAlpha(matrix, reverseIndices, 1, 5);

    // Paired Hake Gain across chain_user_id between Condition A and Condition B
    const mapA = new Map();
    cohortData.sessionsA.forEach((s) => {
      if (s.chain_user_id) mapA.set(s.chain_user_id, s);
    });

    const preScores = [];
    const postScores = [];

    cohortData.sessionsB.forEach((sB) => {
      if (!sB.chain_user_id || !mapA.has(sB.chain_user_id)) return;
      const sA = mapA.get(sB.chain_user_id);

      const getComposite = (sess) => {
        const vals = likertQuestions
          .map((q) => {
            const rawNum = toNumericRating(resolveSurveyValue(sess, q));
            if (rawNum === null) return null;
            return q.reverse ? 6 - rawNum : rawNum;
          })
          .filter((v) => v !== null);
        return vals.length > 0 ? mean(vals) : null;
      };

      const pre = getComposite(sA);
      const post = getComposite(sB);
      if (pre !== null && post !== null) {
        preScores.push(pre);
        postScores.push(post);
      }
    });

    const hakeRes = calculateHakeGain(preScores, postScores, 5.0);

    return {
      likertQuestions,
      alphaRes,
      hakeRes,
    };
  }, [cohortData]);

  // 6. Inter-Rater Reliability (IRR) Calibration
  const irrResult = useMemo(() => {
    const pairs = raw.irrCalibration?.pairs || [];

    if (irrMode === 'isdde_outcome' && pairs.length > 0) {
      const outcomePairs = pairs.filter((p) => p.dimension === 'outcome');
      const r1 = outcomePairs.map((p) => mapIsddeOutcomeConstruct(p.rater_human));
      const r2 = outcomePairs.map((p) => mapIsddeOutcomeConstruct(p.rater_llm));
      return {
        title: tr('ISDDE Humano vs. LLM-as-a-Judge (Dimensión: Resultado de Sesión)'),
        ...calculateIRR(r1, r2),
      };
    }

    if (irrMode === 'isdde_flow' && pairs.length > 0) {
      const flowPairs = pairs.filter((p) => p.dimension === 'flow_pattern');
      const r1 = flowPairs.map((p) => mapIsddeFlowConstruct(p.rater_human));
      const r2 = flowPairs.map((p) => mapIsddeFlowConstruct(p.rater_llm));
      return {
        title: tr('ISDDE Humano vs. LLM-as-a-Judge (Dimensión: Patrón Dialógico)'),
        ...calculateIRR(r1, r2),
      };
    }

    const sourceCsv = irrMode === 'prevalence_demo' ? PREVALENCE_DEMO_CSV : customIrrCsv;
    const r1 = [];
    const r2 = [];
    sourceCsv
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const parts = line.split(',').map((s) => s.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          r1.push(parts[0]);
          r2.push(parts[1]);
        }
      });

    return {
      title:
        irrMode === 'prevalence_demo'
          ? tr('Demostración de Paradoja de Prevalencia (90% Categoría Dominante)')
          : tr('Calibración Personalizada de Jueces (CSV)'),
      ...calculateIRR(r1, r2),
    };
  }, [raw.irrCalibration, irrMode, customIrrCsv, tr]);

  // 7. Publication-grade LaTeX booktabs snippet
  const latexCode = useMemo(() => {
    const continuous = inferentialBundle.filter((r) => r.testUsed === 'welch_t');
    const ordinal = inferentialBundle.filter((r) => r.testUsed === 'mann_whitney_u');
    return generateBooktabsTable(
      { continuous, ordinal },
      {
        caption: tr('Comparación Experimental: {p0} vs. {p1}.', { p0: cohortData.labelA, p1: cohortData.labelB }),
        label: 'tab:promptsketch_ab_results',
        familySize: inferentialBundle.length,
      }
    );
  }, [inferentialBundle, cohortData, tr]);

  const copyLatexToClipboard = () => {
    navigator.clipboard.writeText(latexCode);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2200);
  };

  const downloadLatexFile = () => {
    const blob = new Blob([latexCode], { type: 'application/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptsketch_results_booktabs.tex';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // 8. Methodological reviewer assistant invocation
  const handleRunLakReview = async () => {
    setLakLoading(true);
    try {
      const metricsPayload = {
        conditionA: cohortData.labelA,
        conditionB: cohortData.labelB,
        analysisType: cohortData.analysisType,
        hypothesis: cohortData.hypothesis,
        sampleSize: {
          nA: cohortData.sessionsA.length,
          nB: cohortData.sessionsB.length,
        },
        familySize: inferentialBundle.length,
        inferentialTests: inferentialBundle.map((r) => ({
          metric: r.name,
          scale: r.gate.scaleType,
          test: r.testUsed,
          meanOrMedianA: r.medianA !== undefined ? r.medianA : r.meanA,
          meanOrMedianB: r.medianB !== undefined ? r.medianB : r.meanB,
          effect: r.effectLabel,
          ci95: r.effectCiLabel,
          pRaw: r.pValue,
          pHolm: r.adjustedP,
          significant: r.significant,
        })),
        cronbachAlpha: psychometricsBundle.alphaRes.canCompute
          ? {
              alpha: psychometricsBundle.alphaRes.alpha,
              k: psychometricsBundle.alphaRes.k,
              reverseSuspected: psychometricsBundle.alphaRes.reverseCodingOmissionSuspected,
            }
          : null,
        hakeGain: psychometricsBundle.hakeRes.canCompute
          ? {
              gClass: psychometricsBundle.hakeRes.gClass,
              tier: psychometricsBundle.hakeRes.tier,
              pairedN: psychometricsBundle.hakeRes.n,
            }
          : null,
        dialogic: {
          conditionA: {
            verbalVolumeRatio: dialogicSummary.A.verbalVolumeRatio,
            studentMluW: dialogicSummary.A.studentMluW,
            mattr25: dialogicSummary.A.mattr25,
            causalDensity: dialogicSummary.A.causalDensity,
            skippedReadingRatio: dialogicSummary.A.skippedReadingRatio,
          },
          conditionB: {
            verbalVolumeRatio: dialogicSummary.B.verbalVolumeRatio,
            studentMluW: dialogicSummary.B.studentMluW,
            mattr25: dialogicSummary.B.mattr25,
            causalDensity: dialogicSummary.B.causalDensity,
            skippedReadingRatio: dialogicSummary.B.skippedReadingRatio,
          },
        },
        irr: irrResult.canCompute
          ? {
              canCompute: true,
              observedAgreement: irrResult.observedAgreement,
              cohenKappa: irrResult.cohenKappa,
              gwetsAC1: irrResult.gwetsAC1,
              prevalenceWarning: irrResult.prevalenceWarning,
            }
          : null,
      };

      const res = await fetch('/api/admin/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'lak-review',
          metricsPayload,
          lang: locale,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || tr('Error en la revisión metodológica'));
      setLakReview(json);
    } catch (err) {
      setStatusBanner({
        tone: 'verm',
        text: tr('Error al consultar el revisor metodológico: {p0}', { p0: err.message }),
      });
    } finally {
      setLakLoading(false);
    }
  };

  if (loading) {
    return (
      <BlueprintPanel codeTag="MOD_05" title={tr('Calculando diagnósticos de supuestos e inferencia')}>
        <p className="font-ui-mono text-xs text-ink-2 py-8 text-center">{tr('Ejecutando Gatekeeper estadístico, Holm-Bonferroni, psicometría y analítica conversacional...')}</p>
      </BlueprintPanel>
    );
  }

  const activeChartRow =
    inferentialBundle.find((r) => r.key === selectedChartMetricKey) ||
    inferentialBundle[0] ||
    null;

  const significantCount = inferentialBundle.filter((r) => r.significant).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line-control pb-4">
        <div>
          <h1 className="ps-h1">{tr('Análisis detallado')}</h1>
          <p className="ps-lead mt-1 max-w-3xl">{tr('Para quien quiere revisar las pruebas con calma. Si solo buscas una primera lectura, ve a Resultados.')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowLatexModal(true)}
            disabled={inferentialBundle.length === 0}
            className="min-h-[44px] px-3.5 inline-flex items-center gap-2 border border-line-control bg-paper hover:bg-paper-subtle font-ui-mono text-xs font-semibold uppercase text-ink"
          >
            <CadIcon name="FileText" size={14} className="text-cobalt" />
            <span>{tr('Tabla LaTeX booktabs (.tex)')}</span>
          </button>

          <SplitButton
            variant="primary"
            iconBox="ShieldCheck"
            loading={lakLoading}
            onClick={handleRunLakReview}
          >{tr('Revisar con asistente metodológico')}</SplitButton>
        </div>
      </header>

      {statusBanner && (
        <div
          role="status"
          className={`p-3 border flex items-center justify-between gap-3 font-ui-mono text-xs ${
            statusBanner.tone === 'verm'
              ? 'bg-vermilion-tint border-vermilion-ink text-vermilion-ink'
              : 'bg-emerald-tint border-emerald text-emerald'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label={tr('Cerrar notificación')}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-current bg-paper text-ink"
          >
            <CadIcon name="X" size={14} />
          </button>
        </div>
      )}

      {/* Cohort & Axis Selector Panel */}
      <BlueprintPanel
        title={tr('¿Qué quieres comparar?')}
        subtitle={tr('Elige dos condiciones o dos campañas para compararlas.')}
        headerSlot={
          <div className="inline-flex border border-line-control bg-paper">
            <button
              type="button"
              onClick={() => setCompareAxis('campaigns')}
              className={`min-h-[44px] px-3 font-ui-mono text-xs uppercase ${
                compareAxis === 'campaigns'
                  ? 'bg-ink text-paper font-semibold'
                  : 'bg-paper text-ink hover:bg-paper-subtle'
              }`}
            >{tr('Entre Campañas / Pasos')}</button>
            <button
              type="button"
              onClick={() => setCompareAxis('versions')}
              className={`min-h-[44px] px-3 font-ui-mono text-xs uppercase border-l border-line-control ${
                compareAxis === 'versions'
                  ? 'bg-ink text-paper font-semibold'
                  : 'bg-paper text-ink hover:bg-paper-subtle'
              }`}
            >{tr('Entre Escenarios')}</button>
          </div>
        }
        titleBlock={{
          sheetNumber: 'ANL',
          status: (cohortData.analysisType || 'preregistrado').toUpperCase(),
          rev: `FAMILIA m=${inferentialBundle.length}`,
          n: { a: cohortData.sessionsA.length, b: cohortData.sessionsB.length },
          title: `${cohortData.labelA} vs. ${cohortData.labelB}`,
          subtitle: `${significantCount} contrastes significativos tras Holm`,
        }}
      >
        {compareAxis === 'campaigns' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="select-cond-a"
                className="block font-ui-mono text-xs font-semibold uppercase tracking-wider text-ink mb-1.5"
              >{tr('Condición A · Línea Base / Control (Trama Diagonal)')}</label>
              <select
                id="select-cond-a"
                value={campaignAId}
                onChange={(e) => setCampaignAId(e.target.value)}
                className="min-h-[44px] w-full px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
              >
                {raw.workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="select-cond-b"
                className="block font-ui-mono text-xs font-semibold uppercase tracking-wider text-cobalt mb-1.5"
              >{tr('Condición B · Intervención / Andamiaje (Cobalto Sólido)')}</label>
              <select
                id="select-cond-b"
                value={campaignBId}
                onChange={(e) => setCampaignBId(e.target.value)}
                className="min-h-[44px] w-full px-3 border border-cobalt bg-paper font-ui-mono text-xs text-ink"
              >
                {raw.workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="select-version-scope"
                className="block font-ui-mono text-xs font-semibold uppercase tracking-wider text-ink mb-1.5"
              >{tr('Ámbito de Experimento')}</label>
              <select
                id="select-version-scope"
                value={versionScopeWorkshopId}
                onChange={(e) => setVersionScopeWorkshopId(e.target.value)}
                className="min-h-[44px] w-full px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
              >
                <option value="">{tr('Todos los experimentos combinados')}</option>
                {raw.workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="select-ver-a"
                className="block font-ui-mono text-xs font-semibold uppercase tracking-wider text-ink mb-1.5"
              >{tr('Escenario A (Trama)')}</label>
              <select
                id="select-ver-a"
                value={versionAId}
                onChange={(e) => setVersionAId(e.target.value)}
                className="min-h-[44px] w-full px-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
              >
                {raw.versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="select-ver-b"
                className="block font-ui-mono text-xs font-semibold uppercase tracking-wider text-cobalt mb-1.5"
              >{tr('Escenario B (Cobalto)')}</label>
              <select
                id="select-ver-b"
                value={versionBId}
                onChange={(e) => setVersionBId(e.target.value)}
                className="min-h-[44px] w-full px-3 border border-cobalt bg-paper font-ui-mono text-xs text-ink"
              >
                {raw.versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </BlueprintPanel>

      {/* Methodological reviewer panel (shown right below selector when generated) */}
      {lakReview?.critique && (
        <BlueprintPanel
          variant="drawer"
          codeTag={tr('REVISIÓN')}
          title={tr('Revisión metodológica del análisis')}
          headerSlot={
            <StatBadge
              label={tr('Motor')}
              value={lakReview.source === 'live_llm' ? tr('LLM EN VIVO') : tr('AUDITOR MATEMÁTICO')}
              variant="cobalt"
            />
          }
        >
          <div className="font-body text-sm text-ink leading-relaxed prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{lakReview.critique}</ReactMarkdown>
          </div>
        </BlueprintPanel>
      )}

      {/* SECTION 1: ASSUMPTION DIAGNOSTIC GATEKEEPER */}
      <div className="border-2 border-line-strong bg-paper-subtle p-4">
        <p className="font-body text-base text-ink m-0">
          {inferentialBundle.length === 0
            ? tr('Todavía no hay suficientes datos para comparar estas condiciones.')
            : tr('{p0} de {p1} medidas muestran diferencias entre las condiciones (con ajuste por comparaciones múltiples).', { p0: significantCount, p1: inferentialBundle.length })}
        </p>
      </div>

      <AnalysisSection title={tr('¿Se pueden usar estas pruebas con tus datos?')} summary={tr('Revisamos que los datos cumplan lo que cada prueba necesita')}>
        <DataTable
          caption={tr('Auditoría automática de supuestos por variable antes de seleccionar el estimador inferencial')}
          columns={[
            { key: 'name', label: 'Variable / Indicador', sortable: true },
            {
              key: 'scaleLabel',
              label: 'Escala Detectada',
              format: (val) => (
                <StatBadge
                  label={tr('Escala')}
                  value={val}
                  variant={val === 'ORDINAL' ? 'cobalt' : 'default'}
                />
              ),
            },
            { key: 'normalityStr', label: 'Shapiro-Wilk W (A / B)', align: 'right' },
            { key: 'varRatioStr', label: tr('Razón Var. (Levene)'), align: 'right' },
            { key: 'selectedRoute', label: 'Ruta Seleccionada' },
            { key: 'rationale', label: tr('Justificación Metodológica') },
          ]}
          data={inferentialBundle.map((r) => ({
            id: r.key,
            name: r.name,
            scaleLabel: r.gate.scaleType === 'ordinal' ? 'ORDINAL' : 'CONTINUA',
            normalityStr:
              r.gate.scaleType === 'ordinal'
                ? 'N/A (Discreta 1–5)'
                : `${r.swA?.W ? r.swA.W.toFixed(2) : '—'} / ${r.swB?.W ? r.swB.W.toFixed(2) : '—'}`,
            varRatioStr:
              r.gate.scaleType === 'ordinal' || !r.lev?.varianceRatio
                ? '—'
                : `${r.lev.varianceRatio.toFixed(2)}x`,
            selectedRoute:
              r.testUsed === 'welch_t'
                ? 'Welch t + d de Cohen'
                : 'Mann-Whitney U + δ de Cliff',
            rationale: r.gate.explanation,
          }))}
        />

        <div className="mt-4 p-3 bg-paper-subtle border-l-4 border-cobalt font-body text-xs text-ink leading-relaxed">
          <strong className="font-ui-mono uppercase text-cobalt mr-1.5">{tr('En palabras simples:')}</strong>{tr('Antes de calcular cualquier diferencia entre A y B, PromptSketch verifica qué tipo de dato es cada métrica. Los ítems de encuesta del 1 al 5 son escalas ordinales (la distancia psicológica entre 4 y 5 no es idéntica a la distancia entre 2 y 3), por lo que la plataforma bloquea el promedio paramétrico clásico y aplica rangos no paramétricos (')}<Abbr term="u">{tr('U de Mann-Whitney')}</Abbr> y <Abbr term="cliff-delta">{tr('δ de Cliff')}</Abbr>{tr('). En variables continuas de texto, aplica')}{' '}<Abbr term="d">{tr('t de Welch')}</Abbr>{' '}{tr('únicamente cuando ambos grupos cumplen criterios de simetría y normalidad de Shapiro-Wilk.')}</div>
      </AnalysisSection>

      {/* SECTION 2: PRIMARY INFERENTIAL TABLE + DUAL-ENCODED CHARTFRAME */}
      <AnalysisSection title={tr('¿Hay diferencias entre las condiciones?')} summary={tr('El resultado principal, medida por medida')} defaultOpen
        badge={<StatBadge
            label={tr('Familia')}
            abbr="p-holm"
            value={`m = ${inferentialBundle.length}`}
            variant="cobalt"
          />}>
        {activeChartRow && (
          <div className="mb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-ui-mono text-xs uppercase text-ink-2">{tr('Visualizar métrica:')}</span>
              {inferentialBundle.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelectedChartMetricKey(r.key)}
                  className={`min-h-[44px] px-3 border font-ui-mono text-xs ${
                    activeChartRow.key === r.key
                      ? 'border-cobalt bg-cobalt-tint text-cobalt font-semibold'
                      : 'border-line-control bg-paper-subtle text-ink hover:bg-paper'
                  }`}
                >
                  {r.name.length > 34 ? `${r.name.slice(0, 34)}…` : r.name}
                </button>
              ))}
            </div>

            <ChartFrame
              title={activeChartRow.name}
              subtitle={`${cohortData.labelA} (n=${activeChartRow.groupA.length}) vs. ${cohortData.labelB} (n=${activeChartRow.groupB.length})`}
              data={{
                conditionA: {
                  label: cohortData.labelA,
                  mean: Number(activeChartRow.meanA || 0),
                  sd: Number(activeChartRow.sdA || 0).toFixed(2),
                  ci:
                    activeChartRow.groupA.length > 1
                      ? (1.96 * Number(activeChartRow.sdA || 0)) /
                        Math.sqrt(activeChartRow.groupA.length)
                      : 0,
                },
                conditionB: {
                  label: cohortData.labelB,
                  mean: Number(activeChartRow.meanB || 0),
                  sd: Number(activeChartRow.sdB || 0).toFixed(2),
                  ci:
                    activeChartRow.groupB.length > 1
                      ? (1.96 * Number(activeChartRow.sdB || 0)) /
                        Math.sqrt(activeChartRow.groupB.length)
                      : 0,
                },
                diff: Number((activeChartRow.meanB || 0) - (activeChartRow.meanA || 0)).toFixed(2),
              }}
              trendSummary={tr('En "{p0}", la Condición A registra media {p1} y la Condición B {p2} ({p3} {p4}; p ajustado Holm = {p5}).', { p0: activeChartRow.name, p1: Number(activeChartRow.meanA || 0).toFixed(2), p2: Number(activeChartRow.meanB || 0).toFixed(2), p3: activeChartRow.effectLabel, p4: activeChartRow.effectCiLabel, p5: activeChartRow.adjustedP !== null ? activeChartRow.adjustedP.toFixed(3) : 'N/A' })}
            />
          </div>
        )}

        <DataTable
          caption={tr('Tabla maestra de resultados inferenciales con ajuste monótono secuencial de Holm-Bonferroni')}
          columns={[
            { key: 'name', label: tr('Métrica'), sortable: true },
            { key: 'summaryA', label: 'Cond. A', align: 'right' },
            { key: 'summaryB', label: 'Cond. B', align: 'right' },
            {
              key: 'effectFull',
              label: (
                <span>{tr('Tamaño Efecto [')}<Abbr term="ic-95">{tr('IC 95%')}</Abbr>]
                </span>
              ),
              align: 'right',
            },
            {
              key: 'tierBadge',
              label: 'Magnitud',
              format: (val) => (
                <StatBadge
                  label={tr('Magnitud')}
                  value={tr(TIER_SPANISH[val] || val)}
                  variant={val === 'large' || val === 'medium' ? 'cobalt' : 'default'}
                />
              ),
            },
            {
              key: 'pRawStr',
              label: <Abbr term="p">{tr('p crudo')}</Abbr>,
              align: 'right',
            },
            {
              key: 'pHolmStr',
              label: <Abbr term="p-holm">{tr('p Holm')}</Abbr>,
              align: 'right',
            },
            {
              key: 'sigBadge',
              label: 'Inferencia',
              format: (isSig) => (
                <StatBadge
                  label={tr('Holm')}
                  value={isSig ? 'SIGNIFICATIVO' : 'NO SIG.'}
                  variant={isSig ? 'significant' : 'default'}
                />
              ),
            },
          ]}
          data={inferentialBundle.map((r) => ({
            id: r.key,
            name: r.name,
            summaryA:
              r.testUsed === 'welch_t'
                ? `${Number(r.meanA).toFixed(2)} (±${Number(r.sdA).toFixed(2)})`
                : `Mdn ${Number(r.medianA).toFixed(1)} (M ${Number(r.meanA).toFixed(2)})`,
            summaryB:
              r.testUsed === 'welch_t'
                ? `${Number(r.meanB).toFixed(2)} (±${Number(r.sdB).toFixed(2)})`
                : `Mdn ${Number(r.medianB).toFixed(1)} (M ${Number(r.meanB).toFixed(2)})`,
            effectFull: `${r.effectLabel} ${r.effectCiLabel}`,
            tierBadge: r.magnitudeTier,
            pRawStr: r.pValue !== null ? r.pValue.toFixed(3) : '—',
            pHolmStr: r.adjustedP !== null ? r.adjustedP.toFixed(3) : '—',
            sigBadge: r.significant,
          }))}
        />

        {checklistComparison.length > 0 && (
          <div className="mt-6">
            <DataTable
              caption={tr('Verificación conductual observable reportada por los participantes (Lista de Cotejo)')}
              columns={[
                { key: 'behavior', label: tr('Conducta Observable del Asistente') },
                { key: 'condA', label: 'Frecuencia Cond. A', align: 'right' },
                { key: 'condB', label: 'Frecuencia Cond. B', align: 'right' },
                { key: 'deltaPct', label: 'Cambio (B − A)', align: 'right' },
              ]}
              data={checklistComparison}
            />
          </div>
        )}

        <div className="mt-4 p-3 bg-paper-subtle border-l-4 border-cobalt font-body text-xs text-ink leading-relaxed">
          <strong className="font-ui-mono uppercase text-cobalt mr-1.5">{tr('En palabras simples:')}</strong>{tr('Cuando se comparan varias preguntas al mismo tiempo (m =')}{' '}{inferentialBundle.length}{tr('), crece el riesgo de encontrar falsos positivos por puro azar. La columna')}{' '}<Abbr term="p-holm">{tr('p Holm')}</Abbr>{' '}{tr('corrige ese riesgo de forma rigurosa. Incluso en muestras piloto pequeñas donde p Holm ≥ 0.05, revise la columna de')}{' '}<strong>{tr('Magnitud')}</strong>{' '}{tr('y la tabla de conductas observables para distinguir si el efecto pedagógico práctico es grande, mediano o insignificante.')}</div>
      </AnalysisSection>

      {/* SECTION 3: PSYCHOMETRICS (CRONBACH ALPHA & HAKE GAIN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalysisSection title={tr('¿Las preguntas de la encuesta miden lo mismo?')} summary={tr('Consistencia interna de la escala')}
        badge={psychometricsBundle.alphaRes.canCompute ? (
              <StatBadge
                label="α"
                abbr="alpha"
                value={psychometricsBundle.alphaRes.alpha.toFixed(3)}
                variant={psychometricsBundle.alphaRes.isAcceptable ? 'em' : 'verm'}
              />
            ) : null}>
          {!psychometricsBundle.alphaRes.canCompute ? (
            <p className="font-ui-mono text-xs text-ink-2">{tr('Se requieren al menos 2 ítems Likert completados por 2 o más participantes para estimar la consistencia interna.')}</p>
          ) : (
            <div className="space-y-4">
              {psychometricsBundle.alphaRes.reverseCodingOmissionSuspected && (
                <div className="p-3 bg-vermilion-tint border border-vermilion-ink font-ui-mono text-xs text-vermilion-ink">{tr('[!] Alerta psicométrica: Se detectó correlación ítem-total negativa (r ítem-total < 0). Verifique si olvidó marcar algún ítem inverso en el constructor.')}</div>
              )}

              <DataTable
                caption={tr('Diagnóstico por ítem (N = {p0}, k = {p1})', { p0: psychometricsBundle.alphaRes.N, p1: psychometricsBundle.alphaRes.k })}
                columns={[
                  { key: 'item', label: tr('Ítem de Escala') },
                  { key: 'ritc', label: tr('r ítem-total'), align: 'right' },
                  { key: 'alphaDel', label: 'α si se elimina', align: 'right' },
                ]}
                data={psychometricsBundle.likertQuestions.map((q, idx) => ({
                  id: q.id || idx,
                  item: q.text,
                  ritc: Number(
                    psychometricsBundle.alphaRes.itemTotalCorrelations[idx] || 0
                  ).toFixed(3),
                  alphaDel:
                    psychometricsBundle.alphaRes.k > 2
                      ? Number(psychometricsBundle.alphaRes.alphaIfDeleted[idx] || 0).toFixed(3)
                      : 'N/A (k=2)',
                }))}
              />

              <div className="p-3 bg-paper-subtle border-l-4 border-cobalt font-body text-xs text-ink leading-relaxed">
                <strong className="font-ui-mono uppercase text-cobalt mr-1.5">{tr('En palabras simples:')}</strong>{tr('El')}{' '}<Abbr term="alpha">{tr('Alfa de Cronbach')}</Abbr>{' '}{tr('mide si las preguntas Likert de su encuesta apuntan hacia un mismo constructo coherente (α ≥ 0.70 es aceptable para promediarlas en un índice global).')}</div>
            </div>
          )}
        </AnalysisSection>

        <AnalysisSection title={tr('¿Cuánto mejoró cada persona entre un paso y otro?')} summary={tr('Ganancia de aprendizaje')}
        badge={psychometricsBundle.hakeRes.canCompute ? (
              <StatBadge
                label={tr('g Hake')}
                abbr="hake-g"
                value={psychometricsBundle.hakeRes.gClass.toFixed(3)}
                variant={psychometricsBundle.hakeRes.gClass >= 0.3 ? 'em' : 'default'}
              />
            ) : null}>
          {!psychometricsBundle.hakeRes.canCompute ? (
            <p className="font-ui-mono text-xs text-ink-2">{tr('No se detectaron sesiones encadenadas pareadas (chain_user_id) entre las dos condiciones seleccionadas. Utilice secuencias de 2 pasos para medir cambio intra-sujeto.')}</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-paper-subtle border border-line-control">
                  <div className="font-ui-mono text-xs uppercase text-ink-2">{tr('Pares (N)')}</div>
                  <div className="font-stat text-lg font-bold text-ink stat">
                    {psychometricsBundle.hakeRes.n}
                  </div>
                </div>
                <div className="p-3 bg-paper-subtle border border-line-control">
                  <div className="font-ui-mono text-xs uppercase text-ink-2">{tr('Pre → Post')}</div>
                  <div className="font-stat text-lg font-bold text-ink stat">
                    {psychometricsBundle.hakeRes.meanPre.toFixed(2)} →{' '}
                    {psychometricsBundle.hakeRes.meanPost.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-paper-subtle border border-line-control">
                  <div className="font-ui-mono text-xs uppercase text-ink-2">{tr('IC 95% (g indiv.)')}</div>
                  <div className="font-stat text-sm font-bold text-cobalt stat mt-1">
                    [{psychometricsBundle.hakeRes.ci[0].toFixed(2)},{' '}
                    {psychometricsBundle.hakeRes.ci[1].toFixed(2)}]
                  </div>
                </div>
              </div>

              <div className="p-3 bg-paper-subtle border-l-4 border-cobalt font-body text-xs text-ink leading-relaxed">
                <strong className="font-ui-mono uppercase text-cobalt mr-1.5">{tr('En palabras simples:')}</strong>{tr('La')}{' '}<Abbr term="hake-g">{tr('g de Hake')}</Abbr>{' '}{tr('calcula qué fracción de la mejora máxima posible logró el grupo entre el Paso 1 y el Paso 2, descontando el puntaje de partida (< 0.30 baja, 0.30–0.70 media, ≥ 0.70 alta).')}</div>
            </div>
          )}
        </AnalysisSection>
      </div>

      {/* SECTION 4: CONVERSATIONAL ANALYTICS & NORMALIZED LATENCY */}
      <AnalysisSection title={tr('¿Cómo conversaron los participantes?')} summary={tr('Largo de los mensajes, vocabulario y ritmo de lectura')}>
        <DataTable
          caption={tr('Comparación de indicadores objetivos del discurso y telemetría cognitiva')}
          columns={[
            { key: 'indicator', label: tr('Indicador Dialógico / Cognitivo') },
            { key: 'valA', label: tr('Condición A ({p0})', { p0: cohortData.labelA }), align: 'right' },
            { key: 'valB', label: tr('Condición B ({p0})', { p0: cohortData.labelB }), align: 'right' },
            { key: 'interpretation', label: tr('Criterio de Lectura en Learning Analytics') },
          ]}
          data={[
            {
              id: 'rvol',
              indicator: (
                <span>{tr('Protagonismo Verbal (')}<Abbr term="r-vol">{tr('R_vol')}</Abbr>)
                </span>
              ),
              valA: dialogicSummary.A.verbalVolumeRatio.toFixed(3),
              valB: dialogicSummary.B.verbalVolumeRatio.toFixed(3),
              interpretation: tr('Palabras del estudiante divididas por palabras del asistente'),
            },
            {
              id: 'mluw',
              indicator: (
                <span>{tr('Longitud Media de Enunciado (')}<Abbr term="mlu-w">{tr('MLU-w')}</Abbr>)
                </span>
              ),
              valA: `${dialogicSummary.A.studentMluW.toFixed(1)} pal/turno`,
              valB: `${dialogicSummary.B.studentMluW.toFixed(1)} pal/turno`,
              interpretation: tr('Extensión media de elaboración por mensaje estudiantil'),
            },
            {
              id: 'mattr',
              indicator: (
                <span>{tr('Diversidad Léxica (')}<Abbr term="mattr">{tr('MATTR')}</Abbr> W=25 / W=50)
                </span>
              ),
              valA: `${dialogicSummary.A.mattr25.toFixed(3)} / ${dialogicSummary.A.mattr50.toFixed(3)}`,
              valB: `${dialogicSummary.B.mattr25.toFixed(3)} / ${dialogicSummary.B.mattr50.toFixed(3)}`,
              interpretation: tr('Riqueza de vocabulario libre del sesgo por longitud total'),
            },
            {
              id: 'causal',
              indicator: tr('Conectores Causales (por 100 palabras)'),
              valA: dialogicSummary.A.causalDensity.toFixed(2),
              valB: dialogicSummary.B.causalDensity.toFixed(2),
              interpretation: tr('Marcadores explicativos ("porque", "por lo tanto", "because", "therefore")'),
            },
            {
              id: 'adversative',
              indicator: tr('Conectores Adversativos / Refutativos (por 100 palabras)'),
              valA: dialogicSummary.A.adversativeDensity.toFixed(2),
              valB: dialogicSummary.B.adversativeDensity.toFixed(2),
              interpretation: tr('Contraste de perspectivas ("sin embargo", "aunque", "however")'),
            },
            {
              id: 'metacog',
              indicator: tr('Marcadores Metacognitivos (por 100 palabras)'),
              valA: dialogicSummary.A.metacognitiveDensity.toFixed(2),
              valB: dialogicSummary.B.metacognitiveDensity.toFixed(2),
              interpretation: tr('Monitoreo epistémico ("me di cuenta", "dudo que", "i realize")'),
            },
            {
              id: 'latency',
              indicator: tr('Latencia de Lectura Normalizada (ms / palabra IA)'),
              valA:
                dialogicSummary.A.avgReadingLatencyMsPerWord > 0
                  ? `${Math.round(dialogicSummary.A.avgReadingLatencyMsPerWord)} ms/pal`
                  : tr('Sin telemetría cliente'),
              valB:
                dialogicSummary.B.avgReadingLatencyMsPerWord > 0
                  ? `${Math.round(dialogicSummary.B.avgReadingLatencyMsPerWord)} ms/pal`
                  : tr('Sin telemetría cliente'),
              interpretation: tr('Tiempo hasta primera tecla normalizado por longitud del turno del bot'),
            },
            {
              id: 'skipped',
              indicator: tr('Lectura Omitida (< 100 ms/pal) / Outliers de Pestaña'),
              valA: `${(dialogicSummary.A.skippedReadingRatio * 100).toFixed(1)}% / ${dialogicSummary.A.outlierTurnsTotal}`,
              valB: `${(dialogicSummary.B.skippedReadingRatio * 100).toFixed(1)}% / ${dialogicSummary.B.outlierTurnsTotal}`,
              interpretation: tr('Detecta escaneo superficial o abandono temporal de pestaña'),
            },
          ]}
        />

        <div className="mt-4 p-3 bg-paper-subtle border-l-4 border-cobalt font-body text-xs text-ink leading-relaxed">
          <strong className="font-ui-mono uppercase text-cobalt mr-1.5">{tr('En palabras simples:')}</strong>{tr('Contar solo cuántos mensajes envió un alumno puede engañar si repite frases breves o si el bot escribe textos larguísimos. Estas métricas miden cuánto elabora realmente el estudiante (')}<Abbr term="mlu-w">{tr('MLU-w')}</Abbr>, <Abbr term="mattr">{tr('MATTR')}</Abbr>{' '}{tr('y conectores de razonamiento) y dividen el tiempo de pausa por la cantidad de palabras del bot para saber si leyó con atención.')}</div>
      </AnalysisSection>

      {/* SECTION 5: INTER-RATER RELIABILITY (IRR) CALIBRATION */}
      <AnalysisSection title={tr('¿Coinciden quienes codifican las conversaciones?')} summary={tr('Acuerdo entre evaluadores')}>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setIrrMode('isdde_outcome')}
            className={`min-h-[44px] px-3 border font-ui-mono text-xs ${
              irrMode === 'isdde_outcome'
                ? 'border-cobalt bg-cobalt-tint text-cobalt font-semibold'
                : 'border-line-control bg-paper-subtle text-ink'
            }`}
          >{tr('ISDDE: Resultado (N=18)')}</button>
          <button
            type="button"
            onClick={() => setIrrMode('isdde_flow')}
            className={`min-h-[44px] px-3 border font-ui-mono text-xs ${
              irrMode === 'isdde_flow'
                ? 'border-cobalt bg-cobalt-tint text-cobalt font-semibold'
                : 'border-line-control bg-paper-subtle text-ink'
            }`}
          >{tr('ISDDE: Patrón de Flujo (N=18)')}</button>
          <button
            type="button"
            onClick={() => setIrrMode('prevalence_demo')}
            className={`min-h-[44px] px-3 border font-ui-mono text-xs ${
              irrMode === 'prevalence_demo'
                ? 'border-cobalt bg-cobalt-tint text-cobalt font-semibold'
                : 'border-line-control bg-paper-subtle text-ink'
            }`}
          >{tr('Demostración Paradoja Prevalencia')}</button>
          <button
            type="button"
            onClick={() => setIrrMode('custom')}
            className={`min-h-[44px] px-3 border font-ui-mono text-xs ${
              irrMode === 'custom'
                ? 'border-cobalt bg-cobalt-tint text-cobalt font-semibold'
                : 'border-line-control bg-paper-subtle text-ink'
            }`}
          >{tr('Pegar Pares Propios (CSV)')}</button>
        </div>

        {irrMode === 'custom' && (
          <div className="mb-4">
            <label
              htmlFor="custom-irr-textarea"
              className="block font-ui-mono text-xs font-semibold uppercase text-ink mb-1"
            >{tr('Pares de codificación (una fila por unidad: etiqueta_juez_1,etiqueta_juez_2)')}</label>
            <textarea
              id="custom-irr-textarea"
              rows={5}
              value={customIrrCsv}
              onChange={(e) => setCustomIrrCsv(e.target.value)}
              className="w-full p-3 border border-line-control bg-paper font-ui-mono text-xs text-ink"
            />
          </div>
        )}

        {irrResult.canCompute ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-paper-subtle border border-line-control">
                <div className="font-ui-mono text-xs uppercase text-ink-2">{tr('Unidades (N)')}</div>
                <div className="font-stat text-xl font-bold text-ink stat">
                  {irrResult.sampleSize}
                </div>
              </div>
              <div className="p-3 bg-paper-subtle border border-line-control">
                <div className="font-ui-mono text-xs uppercase text-ink-2">{tr('Acuerdo Observado')}</div>
                <div className="font-stat text-xl font-bold text-ink stat">
                  {(irrResult.observedAgreement * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-paper-subtle border border-line-control">
                <div className="font-ui-mono text-xs uppercase text-ink-2">{tr('κ de Cohen')}</div>
                <div className="font-stat text-xl font-bold text-ink stat">
                  {irrResult.cohenKappa.toFixed(3)}
                </div>
              </div>
              <div className="p-3 bg-paper-subtle border border-cobalt">
                <div className="font-ui-mono text-xs uppercase text-cobalt">
                  <Abbr term="gwet-ac1">{tr('AC₁ de Gwet')}</Abbr>
                </div>
                <div className="font-stat text-xl font-bold text-cobalt stat">
                  {irrResult.gwetsAC1.toFixed(3)}
                </div>
              </div>
            </div>

            {irrResult.prevalenceWarning && (
              <div className="p-3 bg-vermilion-tint border border-vermilion-ink font-ui-mono text-xs text-vermilion-ink">
                [!] {irrResult.warningMessage}
              </div>
            )}

            <DataTable
              caption={tr('Matriz de confusión: {p0}', { p0: irrResult.title })}
              columns={[
                { key: 'catRow', label: 'Juez 1 \\ Juez 2' },
                ...irrResult.categories.map((cat) => ({
                  key: `col_${cat}`,
                  label: cat,
                  align: 'right',
                })),
              ]}
              data={irrResult.categories.map((rowCat, rIdx) => {
                const rowObj = { id: rowCat, catRow: rowCat };
                irrResult.categories.forEach((colCat, cIdx) => {
                  rowObj[`col_${colCat}`] = irrResult.confusionMatrix[rIdx][cIdx];
                });
                return rowObj;
              })}
            />

            <div className="p-3 bg-paper-subtle border-l-4 border-cobalt font-body text-xs text-ink leading-relaxed">
              <strong className="font-ui-mono uppercase text-cobalt mr-1.5">{tr('En palabras simples:')}</strong>{tr('Al usar un modelo de lenguaje o dos codificadores humanos para etiquetar diálogos, Kappa de Cohen suele desplomarse injustamente cuando una categoría es muy frecuente (la')}{' '}<em>{tr('paradoja de la prevalencia')}</em>{tr('). Por eso PromptSketch calcula en paralelo')}{' '}<Abbr term="gwet-ac1">{tr('AC₁ de Gwet')}</Abbr>{tr(', el estándar recomendado en Learning Analytics para distribuciones desbalanceadas.')}</div>
          </div>
        ) : (
          <p className="font-ui-mono text-xs text-vermilion-ink">{tr('Ingrese al menos 2 categorías distintas en pares válidos para calcular acuerdo inter-jueces.')}</p>
        )}
      </AnalysisSection>

      {/* SECTION 6: AI COST / TOKENS OBSERVABILITY */}
      <AnalysisSection title={tr('¿Cuánto cuesta y qué tan rápido responde el asistente?')} summary={tr('Tokens, costo y tiempos del modelo')}>
        <DataTable
          caption={tr('Resumen operativo de inferencia por condición')}
          columns={[
            { key: 'cohort', label: tr('Condición') },
            { key: 'sessions', label: 'Sesiones', align: 'right' },
            { key: 'promptTok', label: 'Prompt Tokens', align: 'right' },
            { key: 'compTok', label: 'Completion Tokens', align: 'right' },
            { key: 'ttft', label: 'TTFT Medio', align: 'right' },
            { key: 'cost', label: 'Costo Estimado (USD)', align: 'right' },
          ]}
          data={[
            {
              id: 'obsA',
              cohort: tr('Condición A · {p0}', { p0: cohortData.labelA }),
              sessions: dialogicSummary.A.n,
              promptTok: dialogicSummary.A.promptTokens,
              compTok: dialogicSummary.A.completionTokens,
              ttft: dialogicSummary.A.meanTtftMs
                ? `${Math.round(dialogicSummary.A.meanTtftMs)} ms`
                : tr('Histórico'),
              cost: `USD ${dialogicSummary.A.estimatedCostUsd.toFixed(5)}`,
            },
            {
              id: 'obsB',
              cohort: tr('Condición B · {p0}', { p0: cohortData.labelB }),
              sessions: dialogicSummary.B.n,
              promptTok: dialogicSummary.B.promptTokens,
              compTok: dialogicSummary.B.completionTokens,
              ttft: dialogicSummary.B.meanTtftMs
                ? `${Math.round(dialogicSummary.B.meanTtftMs)} ms`
                : tr('Histórico'),
              cost: `USD ${dialogicSummary.B.estimatedCostUsd.toFixed(5)}`,
            },
          ]}
        />
      </AnalysisSection>

      {/* LaTeX booktabs Modal */}
      {showLatexModal && (
        <div
          className="fixed inset-0 z-50 bg-ink/65 flex items-center justify-center p-4"
          onClick={() => setShowLatexModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="latex-modal-title"
            className="w-full max-w-3xl bg-paper border-2 border-ink shadow-hard"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-paper-subtle border-b border-line-control">
              <h2
                id="latex-modal-title"
                className="font-ui-mono text-xs uppercase tracking-wider font-semibold text-ink m-0"
              >{tr('EXPORTACIÓN DIRECTA LATEX BOOKTABS (LISTA PARA OVERLEAF / ACM / JLA)')}</h2>
              <button
                type="button"
                onClick={() => setShowLatexModal(false)}
                aria-label={tr('Cerrar exportación LaTeX')}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-line-control bg-paper text-ink"
              >
                <CadIcon name="X" size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <pre className="p-4 bg-paper-subtle border border-line-control font-ui-mono text-xs text-ink overflow-x-auto max-h-96">
                {latexCode}
              </pre>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={copyLatexToClipboard}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 border border-line-control bg-paper font-ui-mono text-xs font-semibold uppercase text-ink"
                >
                  <CadIcon name={copiedLatex ? 'Check' : 'Copy'} size={14} />
                  <span>{copiedLatex ? tr('Código copiado') : tr('Copiar al portapapeles')}</span>
                </button>
                <SplitButton
                  variant="primary"
                  iconBox="Download"
                  onClick={downloadLatexFile}
                >{tr('Descargar .tex')}</SplitButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
