/**
 * AI Engine, Multi-Provider Adapters, Streaming Telemetry & Persistence Unit Tests
 *
 * Verifies:
 * 1. Provider URL and configuration resolution (Groq, OpenRouter, OpenAI, Anthropic, Ollama).
 * 2. Model pricing table and exact USD cost calculations.
 * 3. Stateful <think> tag stripping across chunk boundaries & orphaned tag handling.
 * 4. Token estimation and Groq final usage chunk extraction.
 * 5. Latency tracking (TTFT, total_latency_ms).
 * 6. Trailing SSE telemetry event emission (format and content).
 * 7. Graceful mock fallback stream behavior.
 * 8. Provider health check diagnostics (testConnection).
 * 9. Memory database DB_MEMORY_PATH isolation.
 */

import {
  computeCostUsd,
  stripThinkingTags,
  StatefulThinkingFilter,
  estimateTokenCount,
  getProviderConfig,
  streamChat,
  createTransformStream,
  testConnection,
  PROVIDER_PRICING,
} from '../lib/ai-engine.js';

import * as dbMemory from '../lib/db-memory.js';
import path from 'path';
import fs from 'fs';

// Simple lightweight assertion runner
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertApproxEqual(actual, expected, tolerance = 1e-4, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message || 'Assertion failed'}: expected approx ${expected}, got ${actual}`);
  }
}

async function runTest(name, fn) {
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// Helper to create mock readable stream from string array
function createMockStreamFromChunks(chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

// Helper to read and parse SSE stream output
async function readSseStream(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let rawText = '';
  const deltas = [];
  let telemetry = null;
  let receivedDone = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    rawText += decoder.decode(value, { stream: true });
  }

  const events = rawText.split('\n\n');
  for (const ev of events) {
    if (!ev.trim()) continue;
    const lines = ev.split('\n');
    let isTelemetryEvent = false;

    for (const line of lines) {
      if (line.startsWith('event: telemetry')) {
        isTelemetryEvent = true;
      } else if (line.startsWith('data: ')) {
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') {
          receivedDone = true;
          continue;
        }
        try {
          const parsed = JSON.parse(payload);
          if (isTelemetryEvent || parsed.telemetry || parsed.ttft_ms) {
            telemetry = parsed.telemetry || parsed;
          } else if (parsed.choices?.[0]?.delta?.content) {
            deltas.push(parsed.choices[0].delta.content);
          }
        } catch {
          // ignore non-json
        }
      }
    }
  }

  return {
    rawText,
    deltas,
    fullContent: deltas.join(''),
    telemetry,
    receivedDone,
  };
}

async function main() {
  console.log('=== Running AI Engine & Safe Persistence Unit Suite ===\n');

  // ============================================================
  // SECTION 1: Provider Config & Routing
  // ============================================================
  console.log('Test Group 1: Provider Adapters & URL Resolution');

  await runTest('Groq provider resolves to Groq Cloud endpoint with Bearer auth', () => {
    const cfg = getProviderConfig({ provider: 'groq', apiKey: 'gsk_valid_key_1234567890' });
    assertEqual(cfg.url, 'https://api.groq.com/openai/v1/chat/completions');
    assertEqual(cfg.headers.Authorization, 'Bearer gsk_valid_key_1234567890');
    assertEqual(cfg.model, 'llama-3.3-70b-versatile');
    assertEqual(cfg.isMock, false);
  });

  await runTest('OpenRouter provider resolves to openrouter.ai with custom headers', () => {
    const cfg = getProviderConfig({ provider: 'openrouter', apiKey: 'sk-or-valid_key_1234567890' });
    assertEqual(cfg.url, 'https://openrouter.ai/api/v1/chat/completions');
    assertEqual(cfg.headers.Authorization, 'Bearer sk-or-valid_key_1234567890');
    assertEqual(cfg.headers['X-Title'], 'PromptSketch');
    assertEqual(cfg.isMock, false);
  });

  await runTest('OpenAI provider resolves to api.openai.com', () => {
    const cfg = getProviderConfig({ provider: 'openai', apiKey: 'sk-valid_openai_key_1234567890' });
    assertEqual(cfg.url, 'https://api.openai.com/v1/chat/completions');
    assertEqual(cfg.model, 'gpt-4o-mini');
  });

  await runTest('Anthropic provider resolves to api.anthropic.com with x-api-key header', () => {
    const cfg = getProviderConfig({ provider: 'anthropic', apiKey: 'sk-ant-valid_key_1234567890' });
    assertEqual(cfg.url, 'https://api.anthropic.com/v1/messages');
    assertEqual(cfg.headers['x-api-key'], 'sk-ant-valid_key_1234567890');
    assertEqual(cfg.headers['anthropic-version'], '2023-06-01');
  });

  await runTest('Ollama provider resolves to local endpoint with zero USD cost', () => {
    const cfg = getProviderConfig({ provider: 'ollama', baseUrl: 'http://localhost:11434' });
    assertEqual(cfg.url, 'http://localhost:11434/v1/chat/completions');
    assertEqual(cfg.isMock, false);
    const cost = computeCostUsd('ollama-local', 5000, 2000);
    assertEqual(cost, 0.0);
  });

  // ============================================================
  // SECTION 2: Cost Modeling & Pricing Table
  // ============================================================
  console.log('\nTest Group 2: Model Pricing Table & USD Cost Estimation');

  await runTest('Computes exact USD cost for Groq llama-3.3-70b-versatile (500 prompt, 200 completion)', () => {
    // (500 * 0.59 + 200 * 0.79) / 1,000,000 = (295 + 158) / 1,000,000 = $0.000453
    const cost = computeCostUsd('llama-3.3-70b-versatile', 500, 200);
    assertApproxEqual(cost, 0.000453, 1e-6);
  });

  await runTest('Computes exact USD cost for Groq llama-3.1-8b-instant (1000 prompt, 500 completion)', () => {
    // (1000 * 0.05 + 500 * 0.08) / 1,000,000 = (50 + 40) / 1,000,000 = $0.00009
    const cost = computeCostUsd('llama-3.1-8b-instant', 1000, 500);
    assertApproxEqual(cost, 0.00009, 1e-6);
  });

  await runTest('Computes exact USD cost for OpenAI gpt-4o-mini (1000 prompt, 500 completion)', () => {
    // (1000 * 0.15 + 500 * 0.60) / 1,000,000 = (150 + 300) / 1,000,000 = $0.00045
    const cost = computeCostUsd('gpt-4o-mini', 1000, 500);
    assertApproxEqual(cost, 0.00045, 1e-6);
  });

  await runTest('Computes exact USD cost for Anthropic claude-3-5-haiku (1000 prompt, 500 completion)', () => {
    // (1000 * 0.80 + 500 * 4.00) / 1,000,000 = (800 + 2000) / 1,000,000 = $0.0028
    const cost = computeCostUsd('claude-3-5-haiku', 1000, 500);
    assertApproxEqual(cost, 0.0028, 1e-6);
  });

  // ============================================================
  // SECTION 3: Stateful <think> Tag Stripping
  // ============================================================
  console.log('\nTest Group 3: Stateful <think> Tag Stripping');

  await runTest('stripThinkingTags utility strips complete <think>...</think> multiline blocks', () => {
    const raw = '<think>\nInternally analyzing user sentiment.\nPlanning 3 diagnostic questions.\n</think>Hola, ¿en qué puedo ayudarte?';
    const clean = stripThinkingTags(raw);
    assertEqual(clean, 'Hola, ¿en qué puedo ayudarte?');
  });

  await runTest('stripThinkingTags utility strips orphaned trailing <think> tags', () => {
    const raw = 'Parte inicial visible.<think>Razonamiento truncado antes de cierre';
    const clean = stripThinkingTags(raw);
    assertEqual(clean, 'Parte inicial visible.');
  });

  await runTest('StatefulThinkingFilter strips <think> tags split across discrete streaming chunks', () => {
    const filter = new StatefulThinkingFilter();
    let visible = '';

    // Simulate chunk stream:
    // chunk 1: "Hola. <th"
    // chunk 2: "ink>Pensando..."
    // chunk 3: " en el contexto...</th"
    // chunk 4: "ink>¿Cómo estás?"
    visible += filter.processToken('Hola. <th');
    visible += filter.processToken('ink>Pensando...');
    visible += filter.processToken(' en el contexto...</th');
    visible += filter.processToken('ink>¿Cómo estás?');
    visible += filter.flush();

    assertEqual(visible, 'Hola. ¿Cómo estás?');
    assertEqual(filter.thinkingContent, 'Pensando... en el contexto...');
    assertEqual(filter.inThinkingMode, false);
  });

  await runTest('StatefulThinkingFilter suppresses orphaned unclosed <think> tag at stream end', () => {
    const filter = new StatefulThinkingFilter();
    let visible = '';

    visible += filter.processToken('Respuesta completa. <think>Razonamiento que nunca se cerró');
    visible += filter.flush();

    assertEqual(visible, 'Respuesta completa. ');
    assertEqual(filter.inThinkingMode, true);
    assert(!visible.includes('Razonamiento'), 'Thinking content must never leak into visible output');
  });

  await runTest('StatefulThinkingFilter preserves standard comparison operators (x < 5)', () => {
    const filter = new StatefulThinkingFilter();
    let visible = '';

    visible += filter.processToken('Si el valor x < 5 y el valor y > 10, entonces procede.');
    visible += filter.flush();

    assertEqual(visible, 'Si el valor x < 5 y el valor y > 10, entonces procede.');
  });

  // ============================================================
  // SECTION 4: Streaming Transform, Telemetry & Groq Usage
  // ============================================================
  console.log('\nTest Group 4: Streaming Transform, Latency & Telemetry Events');

  await runTest('TransformStream emits clean delta chunks, TTFT, and trailing telemetry event', async () => {
    const mockUpstreamChunks = [
      'data: {"choices":[{"delta":{"content":"Hola. "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"¿Podrías contarme "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"más de tu situación?"}}]}\n\n',
      'data: [DONE]\n\n',
    ];

    const upstreamStream = createMockStreamFromChunks(mockUpstreamChunks);
    const transformStream = createTransformStream({
      upstreamBody: upstreamStream,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      promptTokensEst: 120,
      startTime: performance.now(),
    });

    const result = await readSseStream(transformStream);
    assertEqual(result.fullContent, 'Hola. ¿Podrías contarme más de tu situación?');
    assert(result.receivedDone, 'Must receive [DONE] terminator');
    assert(result.telemetry, 'Must capture trailing telemetry object');
    assertEqual(result.telemetry.provider, 'groq');
    assertEqual(result.telemetry.model, 'llama-3.3-70b-versatile');
    assert(typeof result.telemetry.ttft_ms === 'number', 'TTFT must be a number');
    assert(result.telemetry.total_latency_ms >= result.telemetry.ttft_ms, 'Total latency must be >= TTFT');
  });

  await runTest('TransformStream extracts exact tokens from Groq stream_options usage chunk', async () => {
    const mockGroqChunks = [
      'data: {"choices":[{"delta":{"content":"Recomendación"}}]}\n\n',
      // Groq emits final chunk with usage: { prompt_tokens, completion_tokens, total_tokens }
      'data: {"choices":[],"usage":{"prompt_tokens":412,"completion_tokens":128,"total_tokens":540}}\n\n',
      'data: [DONE]\n\n',
    ];

    const upstreamStream = createMockStreamFromChunks(mockGroqChunks);
    const transformStream = createTransformStream({
      upstreamBody: upstreamStream,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      promptTokensEst: 100, // Should be overridden by authentic Groq usage chunk (412)
      startTime: performance.now(),
    });

    const result = await readSseStream(transformStream);
    assert(result.telemetry, 'Telemetry must be captured');
    assertEqual(result.telemetry.prompt_tokens, 412, 'Must extract prompt_tokens from usage chunk');
    assertEqual(result.telemetry.completion_tokens, 128, 'Must extract completion_tokens from usage chunk');
    assertEqual(result.telemetry.total_tokens, 540, 'Must extract total_tokens from usage chunk');
    // Cost: (412 * 0.59 + 128 * 0.79) / 1,000,000 = (243.08 + 101.12) / 1,000,000 = $0.000344
    assertApproxEqual(result.telemetry.cost_usd, 0.000344, 1e-6);
  });

  // ============================================================
  // SECTION 5: Mock Fallback & Diagnostics
  // ============================================================
  console.log('\nTest Group 5: Graceful Mock Fallback & Health Diagnostics');

  await runTest('streamChat returns mock stream when keys are absent or placeholder', async () => {
    const stream = await streamChat({
      provider: 'groq',
      apiKey: 'your-groq-api-key-here',
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Consulta de prueba' }],
    });

    const result = await readSseStream(stream);
    assert(result.fullContent.length > 20, 'Mock stream must deliver conversational text');
    assert(result.telemetry, 'Mock stream must emit telemetry');
    assertEqual(result.telemetry.model, 'llama-3.3-70b-versatile');
    assertEqual(result.receivedDone, true);
  });

  await runTest('testConnection returns structured latency and error diagnostics', async () => {
    const missingKeyRes = await testConnection({ provider: 'groq', apiKey: null });
    assertEqual(missingKeyRes.ok, false);
    assert(missingKeyRes.error.includes('ausente'), 'Should flag missing key');

    const dummyKeyRes = await testConnection({ provider: 'openai', apiKey: 'your-openai-api-key-here' });
    assertEqual(dummyKeyRes.ok, false);
    assert(dummyKeyRes.error.includes('marcador de posición'), 'Should flag placeholder key');
  });

  // ============================================================
  // SECTION 6: Safe Persistence & Memory Database Isolation
  // ============================================================
  console.log('\nTest Group 6: Safe Persistence & Isolated DB_MEMORY_PATH');

  await runTest('db-memory respects process.env.DB_MEMORY_PATH for isolated scratch testing', () => {
    const scratchPath = path.resolve(process.cwd(), 'scratch', 'unit-test-data.json');
    process.env.DB_MEMORY_PATH = scratchPath;

    // Reset store in scratch file
    dbMemory.resetStore();

    // Verify it saved to the isolated scratch path
    assert(fs.existsSync(scratchPath), 'Scratch test database file must exist');

    // Create a version and verify
    const version = dbMemory.createVersion({
      title: 'Isolated Scratch Version',
      case_content: 'Contenido de prueba en sandbox',
    });
    assert(version.id, 'Version must have an ID');

    const fetched = dbMemory.getVersion(version.id);
    assertEqual(fetched.title, 'Isolated Scratch Version');

    // Add telemetry record
    const telemetryEntry = dbMemory.addTelemetry('sess-scratch-01', {
      ttft_ms: 120,
      total_latency_ms: 850,
      cost_usd: 0.00012,
    });
    assertEqual(telemetryEntry.ttft_ms, 120);

    const sessionTelemetry = dbMemory.getTelemetry('sess-scratch-01');
    assertEqual(sessionTelemetry.length, 1);
    assertEqual(sessionTelemetry[0].cost_usd, 0.00012);

    // Clean up scratch file
    try {
      fs.unlinkSync(scratchPath);
    } catch {
      // ignore
    }
    delete process.env.DB_MEMORY_PATH;
  });

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log(`\n==========================================================`);
  console.log(`Results: ${passedTests} passed, ${failedTests} failed.`);
  console.log(`==========================================================`);

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
