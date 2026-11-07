/**
 * PromptSketch Unified Multi-Provider AI Engine.
 *
 * Supported Providers:
 * - Groq Cloud API (stream_options: { include_usage: true }, x-groq metadata)
 * - OpenRouter (standard chat completions with custom headers)
 * - OpenAI (standard chat completions with stream_options)
 * - Anthropic (Messages API with content_block_delta and message_delta usage)
 * - Ollama / Local (OpenAI-compatible local endpoint at localhost:11434, zero USD cost)
 *
 * Key Capabilities:
 * - Stateful streaming <think>...</think> tag stripping
 * - Accurate latency telemetry: TTFT (time_to_first_token_ms) and total_latency_ms
 * - Token accounting (prompt_tokens, completion_tokens, total_tokens)
 * - USD cost estimation per turn based on published model token rates
 * - Trailing SSE telemetry event injection
 * - Graceful mock fallback when API keys are absent or placeholder
 */

import { performance } from 'perf_hooks';

// ============================================================
// PRICING TABLE (USD per 1 Million Tokens)
// ============================================================

export const PROVIDER_PRICING = {
  // Groq Cloud
  'llama-3.3-70b-versatile': { provider: 'groq', promptPer1M: 0.59, completionPer1M: 0.79 },
  'llama-3.1-8b-instant': { provider: 'groq', promptPer1M: 0.05, completionPer1M: 0.08 },
  'mixtral-8x7b-32768': { provider: 'groq', promptPer1M: 0.24, completionPer1M: 0.24 },
  'gemma2-9b-it': { provider: 'groq', promptPer1M: 0.20, completionPer1M: 0.20 },

  // OpenRouter
  'qwen/qwen-2.5-72b-instruct': { provider: 'openrouter', promptPer1M: 0.35, completionPer1M: 0.40 },
  'deepseek/deepseek-v4-flash': { provider: 'openrouter', promptPer1M: 0.14, completionPer1M: 0.28 },
  'deepseek/deepseek-r1': { provider: 'openrouter', promptPer1M: 0.55, completionPer1M: 2.19 },
  'meta-llama/llama-3.1-8b-instruct': { provider: 'openrouter', promptPer1M: 0.05, completionPer1M: 0.08 },
  'meta-llama/llama-3.3-70b-instruct': { provider: 'openrouter', promptPer1M: 0.40, completionPer1M: 0.40 },

  // OpenAI
  'gpt-4o': { provider: 'openai', promptPer1M: 2.50, completionPer1M: 10.00 },
  'gpt-4o-mini': { provider: 'openai', promptPer1M: 0.15, completionPer1M: 0.60 },
  'gpt-4-turbo': { provider: 'openai', promptPer1M: 10.00, completionPer1M: 30.00 },

  // Anthropic
  'claude-3-5-sonnet-20241022': { provider: 'anthropic', promptPer1M: 3.00, completionPer1M: 15.00 },
  'claude-3-5-haiku': { provider: 'anthropic', promptPer1M: 0.80, completionPer1M: 4.00 },
  'claude-3-5-haiku-20241022': { provider: 'anthropic', promptPer1M: 0.80, completionPer1M: 4.00 },
  'claude-3-haiku-20240307': { provider: 'anthropic', promptPer1M: 0.25, completionPer1M: 1.25 },

  // Ollama / Local Self-Hosted
  'ollama-local': { provider: 'ollama', promptPer1M: 0.0, completionPer1M: 0.0 },
};

export function computeCostUsd(modelName, promptTokens, completionTokens) {
  if (!modelName) return 0.0;
  const normalized = modelName.toLowerCase();
  if (normalized.includes('ollama') || normalized.includes('local')) {
    return 0.0;
  }

  // 1. Try exact match first
  let modelKey = Object.keys(PROVIDER_PRICING).find(
    (key) => key.toLowerCase() === normalized
  );

  // 2. If no exact match, find longest matching key substring
  if (!modelKey) {
    const matches = Object.keys(PROVIDER_PRICING).filter((key) =>
      normalized.includes(key.toLowerCase())
    );
    if (matches.length > 0) {
      matches.sort((a, b) => b.length - a.length);
      modelKey = matches[0];
    }
  }

  const rate = modelKey ? PROVIDER_PRICING[modelKey] : { promptPer1M: 0.50, completionPer1M: 0.50 };
  const promptCost = (promptTokens * rate.promptPer1M) / 1000000.0;
  const completionCost = (completionTokens * rate.completionPer1M) / 1000000.0;
  return Math.round((promptCost + completionCost) * 1e6) / 1e6;
}

// ============================================================
// REASONING TAG STRIPPING
// ============================================================

/**
 * Removes <think>...</think> blocks from complete text strings.
 */
export function stripThinkingTags(text) {
  if (!text) return '';
  // Remove complete <think>...</think> blocks (multiline)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove orphaned opening <think> at the end
  cleaned = cleaned.replace(/<think>[\s\S]*$/gi, '');
  return cleaned.trim();
}

/**
 * Stateful character-level filter for streaming chunks.
 * Handles split tags like '<th' + 'ink>...'.
 */
export class StatefulThinkingFilter {
  constructor() {
    this.inThinkingMode = false;
    this.tagBuffer = '';
    this.thinkingContent = '';
    this.visibleContent = '';
  }

  processToken(token) {
    let visibleDelta = '';
    for (let i = 0; i < token.length; i++) {
      const char = token[i];
      if (!this.inThinkingMode) {
        this.tagBuffer += char;
        if ('<think>'.startsWith(this.tagBuffer)) {
          if (this.tagBuffer === '<think>') {
            this.inThinkingMode = true;
            this.tagBuffer = '';
          }
        } else {
          visibleDelta += this.tagBuffer;
          this.visibleContent += this.tagBuffer;
          this.tagBuffer = '';
        }
      } else {
        this.tagBuffer += char;
        if ('</think>'.startsWith(this.tagBuffer)) {
          if (this.tagBuffer === '</think>') {
            this.inThinkingMode = false;
            this.tagBuffer = '';
          }
        } else {
          this.thinkingContent += this.tagBuffer;
          this.tagBuffer = '';
        }
      }
    }
    return visibleDelta;
  }

  flush() {
    let trailing = '';
    if (!this.inThinkingMode && this.tagBuffer) {
      if (!'<think>'.startsWith(this.tagBuffer)) {
        trailing = this.tagBuffer;
        this.visibleContent += trailing;
      }
      this.tagBuffer = '';
    }
    return trailing;
  }
}

// ============================================================
// TOKEN ESTIMATION UTILITIES
// ============================================================

export function estimateTokenCount(messagesOrText) {
  if (!messagesOrText) return 0;
  if (typeof messagesOrText === 'string') {
    return Math.max(1, Math.ceil(messagesOrText.length / 4));
  }
  if (Array.isArray(messagesOrText)) {
    const chars = messagesOrText.reduce((acc, m) => acc + (m.content ? m.content.length : 0), 0);
    return Math.max(1, Math.ceil(chars / 4));
  }
  return 0;
}

// ============================================================
// PROVIDER ADAPTER CONFIGURATIONS
// ============================================================

export function getProviderConfig({ provider, apiKey, model, baseUrl }) {
  const prov = (provider || 'openrouter').toLowerCase();

  switch (prov) {
    case 'groq': {
      const key = apiKey || process.env.GROQ_API_KEY;
      return {
        provider: 'groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: key,
        model: model || 'llama-3.3-70b-versatile',
        isMock: isPlaceholderKey(key),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
      };
    }
    case 'openai': {
      const key = apiKey || process.env.OPENAI_API_KEY;
      return {
        provider: 'openai',
        url: 'https://api.openai.com/v1/chat/completions',
        apiKey: key,
        model: model || 'gpt-4o-mini',
        isMock: isPlaceholderKey(key),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
      };
    }
    case 'anthropic': {
      const key = apiKey || process.env.ANTHROPIC_API_KEY;
      return {
        provider: 'anthropic',
        url: 'https://api.anthropic.com/v1/messages',
        apiKey: key,
        model: model || 'claude-3-5-haiku-20241022',
        isMock: isPlaceholderKey(key),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
      };
    }
    case 'ollama':
    case 'local': {
      const host = baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      return {
        provider: 'ollama',
        url: `${host.replace(/\/+$/, '')}/v1/chat/completions`,
        apiKey: 'ollama',
        model: model || 'llama3:8b',
        isMock: false,
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }
    case 'openrouter':
    default: {
      const key = apiKey || process.env.OPENROUTER_API_KEY;
      return {
        provider: 'openrouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: key,
        model: model || process.env.DEFAULT_MODEL || 'meta-llama/llama-3.1-8b-instruct',
        isMock: isPlaceholderKey(key),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          'X-Title': 'PromptSketch',
        },
      };
    }
  }
}

function isPlaceholderKey(key) {
  if (!key) return true;
  const k = key.toLowerCase();
  return (
    k.includes('your-') ||
    k.includes('placeholder') ||
    k.includes('mock') ||
    k.includes('test_key') ||
    k.includes('dummy') ||
    k.length < 8
  );
}

// ============================================================
// STREAMING CHAT
// ============================================================

/**
 * Initiates a streaming chat completion with stateful <think> stripping,
 * TTFT latency recording, token accounting, and trailing telemetry events.
 *
 * @param {object} params
 * @param {string} [params.provider] - 'groq' | 'openrouter' | 'openai' | 'anthropic' | 'ollama'
 * @param {string} [params.model] - Model name
 * @param {Array<{role: string, content: string}>} params.messages - Chat messages
 * @param {string} [params.apiKey] - Optional explicit API key
 * @param {string} [params.baseUrl] - Optional base URL for Ollama/local
 * @param {number} [params.temperature] - Sampling temperature (default 0.7)
 * @param {number} [params.maxTokens] - Max tokens (default 4096)
 * @returns {Promise<ReadableStream>} SSE stream yielding deltas and trailing telemetry event
 */
/** Texts of the simulated assistant (no API key, or the provider failed), by interface language. */
const MOCK_TEXT = {
  es: {
    reply:
      'Entiendo la situación que compartes respecto a tu trabajo académico. ' +
      'Para ofrecerte una orientación pertinente a tu contexto institucional: ' +
      '¿qué acciones concretas has considerado llevar a cabo antes de tu próxima evaluación?',
    http: (status) => `Aviso del servicio de IA (${status}): operando en modo de contingencia local. Configure una clave válida en Ajustes.`,
    offline: (provider, msg) => `Conexión no disponible con ${provider} (${msg}). Respuesta generada por motor de respaldo.`,
  },
  en: {
    reply:
      'I understand the situation you are sharing about your academic work. ' +
      'To give you guidance that fits your institutional context: ' +
      'which concrete actions have you considered taking before your next evaluation?',
    http: (status) => `AI service notice (${status}): running in local fallback mode. Set a valid key in Settings.`,
    offline: (provider, msg) => `No connection to ${provider} (${msg}). Reply generated by the fallback engine.`,
  },
  'pt-BR': {
    reply:
      'Entendo a situação que você compartilha sobre o seu trabalho acadêmico. ' +
      'Para lhe oferecer uma orientação adequada ao seu contexto institucional: ' +
      'que ações concretas você considerou tomar antes da sua próxima avaliação?',
    http: (status) => `Aviso do serviço de IA (${status}): operando em modo de contingência local. Configure uma chave válida em Configurações.`,
    offline: (provider, msg) => `Sem conexão com ${provider} (${msg}). Resposta gerada pelo mecanismo de reserva.`,
  },
};
const mockText = (locale) => MOCK_TEXT[locale] || MOCK_TEXT.es;

/** Spanish source texts of the connection-test errors; the settings screen translates them with tr(). */
export const AI_ERROR_KEYS = [
  'Clave de API ausente o no configurada.',
  'La clave de API proporcionada es un valor de prueba/marcador de posición.',
];

export async function streamChat({
  provider = 'openrouter',
  model,
  messages = [],
  apiKey,
  baseUrl,
  temperature = 0.7,
  maxTokens = 4096,
  locale = 'es',
}) {
  const config = getProviderConfig({ provider, apiKey, model, baseUrl });
  const promptTokensEst = estimateTokenCount(messages);
  const startTime = performance.now();

  // If key is absent or mock, use high-fidelity simulated stream
  if (config.isMock) {
    return createMockStream({
      model: config.model,
      provider: config.provider,
      promptTokens: promptTokensEst,
      startTime,
      userMessage: messages[messages.length - 1]?.content || '',
      locale,
    });
  }

  try {
    let bodyPayload;
    if (config.provider === 'anthropic') {
      const systemMsg = messages.find((m) => m.role === 'system');
      const nonSystem = messages.filter((m) => m.role !== 'system');
      bodyPayload = {
        model: config.model,
        messages: nonSystem.map((m) => ({ role: m.role, content: m.content })),
        system: systemMsg ? systemMsg.content : undefined,
        stream: true,
        max_tokens: maxTokens,
        temperature,
      };
    } else {
      bodyPayload = {
        model: config.model,
        messages,
        stream: true,
        stream_options: config.provider === 'groq' || config.provider === 'openai' ? { include_usage: true } : undefined,
        max_tokens: maxTokens,
        temperature,
      };
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`AI Provider [${config.provider}] returned HTTP ${response.status}: ${errText}`);
      return createMockStream({
        model: config.model,
        provider: config.provider,
        promptTokens: promptTokensEst,
        startTime,
        fallbackText: mockText(locale).http(response.status),
      });
    }

    return createTransformStream({
      upstreamBody: response.body,
      provider: config.provider,
      model: config.model,
      promptTokensEst,
      startTime,
    });
  } catch (err) {
    console.warn(`Connection to ${config.provider} failed (${err.message}). Using local fallback.`);
    return createMockStream({
      model: config.model,
      provider: config.provider,
      promptTokens: promptTokensEst,
      startTime,
      fallbackText: mockText(locale).offline(config.provider, err.message),
    });
  }
}

// ============================================================
// STREAM TRANSFORMER (SSE + <think> Strip + Telemetry)
// ============================================================

export function createTransformStream({ upstreamBody, provider, model, promptTokensEst, startTime }) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstreamBody.getReader();
  const thinkingFilter = new StatefulThinkingFilter();

  let buffer = '';
  let ttftMs = null;
  let promptTokens = promptTokensEst;
  let completionTokens = 0;
  let receivedUsage = false;

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const event of events) {
            const lines = event.split('\n');
            let eventType = null;

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                const payload = line.slice(6).trim();
                if (payload === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(payload);

                  // 1. Anthropic format
                  if (provider === 'anthropic') {
                    if (eventType === 'content_block_delta' && parsed.delta?.text) {
                      const token = parsed.delta.text;
                      const cleanToken = thinkingFilter.processToken(token);
                      if (cleanToken) {
                        if (ttftMs === null) {
                          ttftMs = Math.round(performance.now() - startTime);
                        }
                        const sse = `data: ${JSON.stringify({ choices: [{ delta: { content: cleanToken } }], chunk: cleanToken })}\n\n`;
                        controller.enqueue(encoder.encode(sse));
                      }
                    } else if (eventType === 'message_start' && parsed.message?.usage) {
                      promptTokens = parsed.message.usage.input_tokens || promptTokens;
                    } else if (eventType === 'message_delta' && parsed.usage) {
                      completionTokens = parsed.usage.output_tokens || completionTokens;
                      receivedUsage = true;
                    }
                    continue;
                  }

                  // 2. OpenAI / Groq / OpenRouter / Ollama format
                  if (parsed.usage) {
                    promptTokens = parsed.usage.prompt_tokens ?? promptTokens;
                    completionTokens = parsed.usage.completion_tokens ?? completionTokens;
                    receivedUsage = true;
                  }

                  const delta = parsed.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    const cleanToken = thinkingFilter.processToken(delta);
                    if (cleanToken) {
                      if (ttftMs === null) {
                        ttftMs = Math.round(performance.now() - startTime);
                      }
                      const sse = `data: ${JSON.stringify({ choices: [{ delta: { content: cleanToken } }], chunk: cleanToken })}\n\n`;
                      controller.enqueue(encoder.encode(sse));
                    }
                  }
                } catch {
                  // Ignore JSON parse error on partial chunks
                }
              }
            }
          }
        }

        // Flush any remaining tokens
        const trailing = thinkingFilter.flush();
        if (trailing) {
          if (ttftMs === null) {
            ttftMs = Math.round(performance.now() - startTime);
          }
          const sse = `data: ${JSON.stringify({ choices: [{ delta: { content: trailing } }], chunk: trailing })}\n\n`;
          controller.enqueue(encoder.encode(sse));
        }

        const totalLatencyMs = Math.round(performance.now() - startTime);
        if (ttftMs === null) ttftMs = totalLatencyMs;

        // If usage was not emitted in stream, estimate completion tokens from visible text
        if (!receivedUsage) {
          completionTokens = estimateTokenCount(thinkingFilter.visibleContent);
        }
        const totalTokens = promptTokens + completionTokens;
        const costUsd = computeCostUsd(model, promptTokens, completionTokens);

        const telemetryPayload = {
          ttft_ms: ttftMs,
          total_latency_ms: totalLatencyMs,
          total_duration_ms: totalLatencyMs,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          cost_usd: costUsd,
          model,
          provider,
        };

        // Trailing telemetry event (supports both event: telemetry and data.telemetry format)
        const telemetrySSE = `event: telemetry\ndata: ${JSON.stringify({
          telemetry: telemetryPayload,
          ...telemetryPayload,
        })}\n\n`;
        controller.enqueue(encoder.encode(telemetrySSE));

        // Trailing DONE signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

// ============================================================
// MOCK STREAM GENERATOR
// ============================================================

export function createMockStream({
  model = 'llama-3.3-70b-versatile',
  provider = 'groq',
  promptTokens = 150,
  startTime = performance.now(),
  userMessage = '',
  fallbackText = null,
  locale = 'es',
}) {
  const encoder = new TextEncoder();
  const defaultResponse =
    fallbackText || mockText(locale).reply;

  const words = defaultResponse.split(' ');

  return new ReadableStream({
    async start(controller) {
      let ttftMs = null;
      let visibleContent = '';

      // Simulate network / first token latency (~50ms)
      await new Promise((r) => setTimeout(r, 50));
      ttftMs = Math.round(performance.now() - startTime);

      for (let i = 0; i < words.length; i++) {
        const word = (i > 0 ? ' ' : '') + words[i];
        visibleContent += word;
        const chunk = {
          choices: [{ delta: { content: word } }],
          chunk: word,
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        await new Promise((r) => setTimeout(r, 20));
      }

      const totalLatencyMs = Math.round(performance.now() - startTime);
      const completionTokens = Math.max(1, Math.ceil(visibleContent.length / 4));
      const totalTokens = promptTokens + completionTokens;
      const costUsd = computeCostUsd(model, promptTokens, completionTokens);

      const telemetryPayload = {
        ttft_ms: ttftMs,
        total_latency_ms: totalLatencyMs,
        total_duration_ms: totalLatencyMs,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        cost_usd: costUsd,
        model,
        provider,
      };

      const telemetrySSE = `event: telemetry\ndata: ${JSON.stringify({
        telemetry: telemetryPayload,
        ...telemetryPayload,
      })}\n\n`;
      controller.enqueue(encoder.encode(telemetrySSE));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

// ============================================================
// NON-STREAMING CHAT FALLBACK
// ============================================================

export async function chat({
  provider = 'openrouter',
  model,
  messages = [],
  apiKey,
  baseUrl,
  temperature = 0.7,
  maxTokens = 4096,
}) {
  const config = getProviderConfig({ provider, apiKey, model, baseUrl });
  const promptTokens = estimateTokenCount(messages);
  const startTime = performance.now();

  if (config.isMock) {
    const text = 'Modo de demostración de PromptSketch. Configure una clave de API válida para respuestas en vivo.';
    const completionTokens = estimateTokenCount(text);
    const latency = Math.round(performance.now() - startTime);
    return {
      content: text,
      telemetry: {
        ttft_ms: latency,
        total_latency_ms: latency,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        cost_usd: computeCostUsd(config.model, promptTokens, completionTokens),
        model: config.model,
        provider: config.provider,
      },
    };
  }

  let bodyPayload;
  if (config.provider === 'anthropic') {
    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystem = messages.filter((m) => m.role !== 'system');
    bodyPayload = {
      model: config.model,
      messages: nonSystem.map((m) => ({ role: m.role, content: m.content })),
      system: systemMsg ? systemMsg.content : undefined,
      max_tokens: maxTokens,
      temperature,
    };
  } else {
    bodyPayload = {
      model: config.model,
      messages,
      max_tokens: maxTokens,
      temperature,
    };
  }

  const response = await fetch(config.url, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI Provider ${config.provider} error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || data.content?.[0]?.text || '';
  const cleanContent = stripThinkingTags(rawContent);

  const completionTokens =
    data.usage?.completion_tokens ?? data.usage?.output_tokens ?? estimateTokenCount(cleanContent);
  const finalPromptTokens =
    data.usage?.prompt_tokens ?? data.usage?.input_tokens ?? promptTokens;
  const latency = Math.round(performance.now() - startTime);

  return {
    content: cleanContent,
    telemetry: {
      ttft_ms: latency,
      total_latency_ms: latency,
      prompt_tokens: finalPromptTokens,
      completion_tokens: completionTokens,
      total_tokens: finalPromptTokens + completionTokens,
      cost_usd: computeCostUsd(config.model, finalPromptTokens, completionTokens),
      model: config.model,
      provider: config.provider,
    },
  };
}

// ============================================================
// DIAGNOSTIC CONNECTION CHECK
// ============================================================

/**
 * Executes a fast connectivity and latency check for the given AI provider.
 */
export async function testConnection({ provider = 'groq', apiKey, model, baseUrl }) {
  if (!apiKey && provider !== 'ollama' && provider !== 'local') {
    return {
      ok: false,
      error: 'Clave de API ausente o no configurada.',
      provider,
      latency_ms: 0,
    };
  }

  if (isPlaceholderKey(apiKey) && provider !== 'ollama' && provider !== 'local') {
    return {
      ok: false,
      error: 'La clave de API proporcionada es un valor de prueba/marcador de posición.',
      provider,
      latency_ms: 0,
    };
  }

  const config = getProviderConfig({ provider, apiKey, model, baseUrl });
  const start = performance.now();

  try {
    const res = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 2,
      }),
    });

    const latency = Math.round(performance.now() - start);

    if (res.ok) {
      return {
        ok: true,
        latency_ms: latency,
        provider: config.provider,
        model: config.model,
      };
    } else {
      const errText = await res.text();
      return {
        ok: false,
        status: res.status,
        error: `HTTP ${res.status}: ${errText.slice(0, 120)}`,
        provider: config.provider,
        latency_ms: latency,
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      provider: config.provider,
      latency_ms: Math.round(performance.now() - start),
    };
  }
}
