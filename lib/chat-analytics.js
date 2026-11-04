/**
 * Conversational Learning Analytics & Linguistic Engine
 *
 * Implements:
 * - Client-side latency metrics (Reading latency vs Composition time, Skipped reading flag, Inactivity outliers)
 * - Verbal Volume Ratio (R_vol) and Student MLU-w (Mean Length of Utterance in words)
 * - Length-invariant Moving-Average Type-Token Ratio (MATTR) with W=25, 50
 * - Bilingual (Spanish/English) Epistemic & Metacognitive connector density (accent- and case-normalized)
 *
 * Reference: survey_stats.md §5, PROJECT.md
 */

/**
 * Tokenize text into lowercased words, stripping punctuation while preserving accented characters.
 * 
 * @param {string} text - Raw input text
 * @returns {string[]} Array of word tokens
 */
export function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .trim()
    .split(/\s+/)
    .map(w => w.toLowerCase().replace(/[^\wáéíóúüñ]/gi, ''))
    .filter(Boolean);
}

/**
 * Length-Invariant Moving-Average Type-Token Ratio (MATTR)
 * (Covington & McFall, 2010)
 * 
 * @param {string|string[]} textOrTokens - Text string or pre-tokenized array
 * @param {number} windowSize - Window length W (default: 25)
 * @returns {number} MATTR score between 0.0 and 1.0
 */
export function calculateMattr(textOrTokens, windowSize = 25) {
  const tokens = Array.isArray(textOrTokens) ? textOrTokens : tokenize(textOrTokens);
  const L = tokens.length;
  const W = windowSize;

  if (L === 0) {
    return 0.0;
  }

  // If text length is smaller than window, fallback to standard TTR (V / L)
  if (L < W) {
    const unique = new Set(tokens).size;
    return unique / L;
  }

  const K = L - W + 1;
  let ttrSum = 0;
  for (let i = 0; i < K; i++) {
    const windowSlice = tokens.slice(i, i + W);
    const unique = new Set(windowSlice).size;
    ttrSum += unique / W;
  }

  return ttrSum / K;
}

/**
 * Full MATTR diagnostics object with metadata
 */
export function getMattrDetails(textOrTokens, windowSize = 25) {
  const tokens = Array.isArray(textOrTokens) ? textOrTokens : tokenize(textOrTokens);
  const L = tokens.length;
  const W = windowSize;

  if (L === 0) {
    return { mattr: 0.0, windowSize: W, tokenCount: 0, shortSampleWarning: false };
  }

  if (L < W) {
    const unique = new Set(tokens).size;
    return {
      mattr: unique / L,
      windowSize: W,
      tokenCount: L,
      shortSampleWarning: true,
      windowUsed: L,
    };
  }

  const mattr = calculateMattr(tokens, W);
  return {
    mattr,
    windowSize: W,
    tokenCount: L,
    shortSampleWarning: false,
    windowUsed: W,
  };
}

/**
 * Extracts bilingual epistemic and metacognitive markers and calculates densities per 100 student words.
 *
 * @param {string} text - Student discourse text
 * @param {number|null} totalWords - Optional total student word count override
 * @returns {object} Counts and densities
 */
export function extractEpistemicConnectors(text, totalWords = null) {
  if (!text || typeof text !== 'string') {
    return {
      causalCount: 0,
      adversativeCount: 0,
      metacognitiveCount: 0,
      causalDensity: 0.0,
      adversativeDensity: 0.0,
      metacognitiveDensity: 0.0,
    };
  }

  // Accent folding: NFD normalization + removing diacritic marks
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const words = totalWords !== null ? totalWords : tokenize(text).length;

  // Causal markers: Spanish & English
  const causalPatterns = [
    /\b(porque|por que|ya que|puesto que|dado que|debido a|por ende|por lo tanto|en consecuencia|asi que)\b/g,
    /\b(because|since|due to|therefore|thus|consequently|as a result|hence)\b/g,
  ];

  // Adversative / refutational markers: Spanish & English
  const adversativePatterns = [
    /\b(pero|sin embargo|no obstante|aunque|a pesar de|por el contrario|en cambio|sino)\b/g,
    /\b(but|however|although|even though|nevertheless|despite|on the other hand|whereas|nonetheless)\b/g,
  ];

  // Metacognitive markers: Spanish & English
  const metacognitivePatterns = [
    /\b(creo que|pienso que|me di cuenta|entiendo|dudo que|me parece|reflexionando|considero|no estoy seguro|supongo)\b/g,
    /\b(i think|i believe|i realize|i understand|i doubt|it seems|reflecting|i wonder|i assume|not sure)\b/g,
  ];

  const countMatches = (patterns) => {
    let count = 0;
    for (const pat of patterns) {
      const m = normalized.match(pat);
      if (m) count += m.length;
    }
    return count;
  };

  const causalCount = countMatches(causalPatterns);
  const adversativeCount = countMatches(adversativePatterns);
  const metacognitiveCount = countMatches(metacognitivePatterns);

  const factor = words > 0 ? 100.0 / words : 0;

  return {
    causalCount,
    adversativeCount,
    metacognitiveCount,
    causalDensity: causalCount * factor,
    adversativeDensity: adversativeCount * factor,
    metacognitiveDensity: metacognitiveCount * factor,
  };
}

/**
 * Calculates turn-taking and verbal volume metrics.
 * 
 * @param {object[]} messages - Array of message objects { role, content }
 * @returns {object} { studentWords, botWords, studentTurns, botTurns, verbalVolumeRatio, studentMluW }
 */
export function calculateVolumeMetrics(messages = []) {
  let studentWords = 0;
  let botWords = 0;
  let studentTurns = 0;
  let botTurns = 0;

  for (const m of messages) {
    const words = m.content ? m.content.trim().split(/\s+/).filter(Boolean).length : 0;
    if (m.role === 'user') {
      studentTurns++;
      studentWords += words;
    } else if (m.role === 'assistant') {
      botTurns++;
      botWords += words;
    }
  }

  const verbalVolumeRatio = botWords === 0 ? 0 : studentWords / botWords;
  const studentMluW = studentTurns === 0 ? 0 : studentWords / studentTurns;

  return {
    studentWords,
    botWords,
    studentTurns,
    botTurns,
    verbalVolumeRatio,
    studentMluW,
  };
}

/**
 * Calculates client-side reading latency and composition time metrics for a turn.
 * 
 * @param {object} turnData - { t_bot, t_first_key, t_send, is_tab_blurred, botWordCount }
 * @returns {object} Dissected latency metrics and outlier flags
 */
export function calculateLatencyMetrics(turnData = {}) {
  const { t_bot, t_first_key, t_send, is_tab_blurred, botWordCount = 0 } = turnData;

  if (!t_bot || !t_first_key) {
    return {
      canCompute: false,
      readingLatencyMs: null,
      compositionTimeMs: null,
      msPerWord: null,
      skippedReading: false,
      inactivityOutlier: false,
    };
  }

  const readingLatencyMs = Math.max(0, t_first_key - t_bot);
  const compositionTimeMs = Math.max(0, (t_send || t_first_key) - t_first_key);
  const wordsPrev = botWordCount || 0;
  const msPerWord = wordsPrev > 0 ? readingLatencyMs / wordsPrev : null;

  // Skipped reading: < 100 ms/word, or < 800 ms total reading time when bot reply was substantial (> 20 words)
  const skippedReading = wordsPrev > 0
    ? (msPerWord < 100 || (botWordCount > 20 && readingLatencyMs < 800))
    : false;

  // Inactivity outlier: > 180,000 ms (3 minutes) or tab was blurred
  const inactivityOutlier = readingLatencyMs > 180000 || !!is_tab_blurred;

  return {
    canCompute: true,
    readingLatencyMs,
    compositionTimeMs,
    msPerWord,
    skippedReading,
    inactivityOutlier,
  };
}

/**
 * Comprehensive Conversational Learning Analytics Pipeline
 *
 * @param {object[]} messages - Message transcript array [{ role, content, telemetry }]
 * @param {object} sessionTelemetry - Session-level telemetry metadata
 * @returns {object} Complete dialogic analytics suite
 */
export function analyzeConversation(messages = [], sessionTelemetry = {}) {
  let studentWords = 0;
  let botWords = 0;
  let studentTurns = 0;
  let botTurns = 0;
  const studentTokens = [];

  const turnDetails = [];
  const validReadingLatencies = [];
  let skippedTurns = 0;
  let outlierTurns = 0;

  let lastBotWordCount = 0;

  for (let idx = 0; idx < messages.length; idx++) {
    const m = messages[idx];
    const rawContent = m.content || '';
    const words = rawContent.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (m.role === 'user') {
      studentTurns++;
      studentWords += wordCount;

      words.forEach(w => {
        const clean = w.toLowerCase().replace(/[^\wáéíóúüñ]/gi, '');
        if (clean) studentTokens.push(clean);
      });

      let turnLatency = null;
      if (m.telemetry) {
        turnLatency = calculateLatencyMetrics({
          t_bot: m.telemetry.t_bot,
          t_first_key: m.telemetry.t_first_key,
          t_send: m.telemetry.t_send,
          is_tab_blurred: m.telemetry.is_tab_blurred,
          botWordCount: lastBotWordCount,
        });

        if (turnLatency.canCompute) {
          if (turnLatency.skippedReading) skippedTurns++;
          if (turnLatency.inactivityOutlier) outlierTurns++;
          if (!turnLatency.inactivityOutlier && turnLatency.msPerWord !== null) {
            validReadingLatencies.push(turnLatency.msPerWord);
          }
        }
      }

      turnDetails.push({
        turnIndex: idx + 1,
        speaker: 'user',
        wordCount,
        telemetry: turnLatency,
      });
    } else if (m.role === 'assistant') {
      botTurns++;
      botWords += wordCount;
      lastBotWordCount = wordCount;

      turnDetails.push({
        turnIndex: idx + 1,
        speaker: 'assistant',
        wordCount,
      });
    }
  }

  const verbalVolumeRatio = botWords === 0 ? 0 : studentWords / botWords;
  const studentMluW = studentTurns === 0 ? 0 : studentWords / studentTurns;

  const avgReadingLatency = validReadingLatencies.length > 0
    ? validReadingLatencies.reduce((a, b) => a + b, 0) / validReadingLatencies.length
    : 0;

  const skippedReadingRatio = studentTurns > 0 ? skippedTurns / studentTurns : 0;

  const mattr25 = calculateMattr(studentTokens, 25);
  const mattr50 = calculateMattr(studentTokens, 50);

  // Extract student discourse connectors
  const studentAllText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content || '')
    .join(' ');

  const epistemicConnectors = extractEpistemicConnectors(studentAllText, studentWords);

  return {
    studentWords,
    botWords,
    studentTurns,
    botTurns,
    verbalVolumeRatio,
    studentMluW,
    mattr25,
    mattr50,
    avgReadingLatency,
    normalizedReadingLatency: avgReadingLatency,
    skippedTurns,
    skippedReadingRatio,
    outlierTurns,
    epistemicConnectors,
    turns: turnDetails,
  };
}
