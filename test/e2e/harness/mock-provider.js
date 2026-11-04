/**
 * Mock AI Streaming Provider and SSE parser harness for PromptSketch E2E tests.
 * Validates streaming chunk parsing, stateful <think> tag stripping,
 * TTFT, duration, prompt/completion token extraction, and trailing telemetry events.
 */

export function createMockSSEStream(chunks, options = {}) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        if (options.delayMs) {
          await new Promise(r => setTimeout(r, options.delayMs));
        }
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

/**
 * Stateful <think> tag stripper and SSE processor
 */
export async function processStreamingResponse(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let inThinkingMode = false;
  let tagBuffer = '';
  let thinkingContent = '';
  let visibleContent = '';
  let telemetry = null;
  const emittedChunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || ''; // Keep trailing incomplete segment

    for (const block of blocks) {
      const lines = block.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;

        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(payload);
            // Check for trailing telemetry payload
            if (parsed.telemetry) {
              telemetry = parsed.telemetry;
              continue;
            }
            if (parsed.ttft_ms || parsed.total_duration_ms) {
              telemetry = parsed;
              continue;
            }

            const token = parsed.choices?.[0]?.delta?.content || parsed.chunk || '';
            if (token) {
              // Feed through character-by-character stateful <think> filter
              for (let i = 0; i < token.length; i++) {
                const char = token[i];
                if (!inThinkingMode) {
                  tagBuffer += char;
                  if ('<think>'.startsWith(tagBuffer)) {
                    if (tagBuffer === '<think>') {
                      inThinkingMode = true;
                      tagBuffer = '';
                    }
                  } else {
                    visibleContent += tagBuffer;
                    emittedChunks.push(tagBuffer);
                    tagBuffer = '';
                  }
                } else {
                  tagBuffer += char;
                  if ('</think>'.startsWith(tagBuffer)) {
                    if (tagBuffer === '</think>') {
                      inThinkingMode = false;
                      tagBuffer = '';
                    }
                  } else {
                    thinkingContent += tagBuffer;
                    tagBuffer = '';
                  }
                }
              }
            }
          } catch (e) {
            // Non-JSON line
          }
        }
      }
    }
  }

  // Flush any remaining tagBuffer if stream terminates
  if (tagBuffer) {
    if (!inThinkingMode && !'<think>'.startsWith(tagBuffer)) {
      visibleContent += tagBuffer;
    }
  }

  return {
    visibleContent,
    thinkingContent,
    emittedChunks,
    telemetry,
    inThinkingModeAtEnd: inThinkingMode,
  };
}
