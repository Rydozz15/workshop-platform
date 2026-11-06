import { NextResponse } from 'next/server';
import { chat, getProviderConfig } from '@/lib/ai-engine';
import { getSettings } from '@/lib/db';
import {
  STUDY_DESIGN_COPILOT_SYSTEM_PROMPT,
  buildLakReviewerMessages,
  generateDeterministicLakCritique,
  generateDeterministicStudyDesign,
} from '@/lib/methodology-reviewer-prompt';
import { ASSISTANT_SYSTEM_PROMPT, deterministicAssistantReply } from '@/lib/assistant-prompt';
import { translateText } from '@/lib/i18n/messages';

function resolveActiveProvider(settings = {}, requestedProvider, requestedModel) {
  const candidates = [
    requestedProvider,
    settings.default_ai_provider,
    process.env.GROQ_API_KEY ? 'groq' : null,
    process.env.OPENROUTER_API_KEY ? 'openrouter' : null,
    process.env.OPENAI_API_KEY ? 'openai' : null,
    process.env.ANTHROPIC_API_KEY ? 'anthropic' : null,
    'groq',
  ].filter(Boolean);

  for (const prov of candidates) {
    const keyOverride = settings[`api_key_${prov}`];
    const baseUrl = settings.ollama_base_url || process.env.OLLAMA_BASE_URL;
    const cfg = getProviderConfig({
      provider: prov,
      apiKey: keyOverride,
      model: requestedModel || settings.default_ai_model,
      baseUrl,
    });
    if (!cfg.isMock) {
      return {
        provider: cfg.provider,
        apiKey: keyOverride,
        model: cfg.model,
        baseUrl,
        isLive: true,
      };
    }
  }

  return {
    provider: requestedProvider || settings.default_ai_provider || 'groq',
    model: requestedModel || settings.default_ai_model || 'llama-3.3-70b-versatile',
    isLive: false,
  };
}

function extractJsonBlock(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  try {
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { mode = 'lak-review', goal, metricsPayload, provider, model, lang = 'es' } = body;

    let settings = {};
    try {
      settings = await getSettings();
    } catch {
      settings = {};
    }

    const active = resolveActiveProvider(settings, provider, model);

    if (mode === 'assist') {
      const history = (Array.isArray(body.messages) ? body.messages : [])
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
      const lastUser = [...history].reverse().find((m) => m.role === 'user');
      if (!lastUser) {
        return NextResponse.json({ error: 'Escribe tu pregunta.' }, { status: 400 });
      }
      const page = typeof body.page === 'string' ? body.page.slice(0, 200) : '';
      if (active.isLive) {
        try {
          const response = await chat({
            provider: active.provider,
            apiKey: active.apiKey,
            model: active.model,
            baseUrl: active.baseUrl,
            temperature: 0.4,
            maxTokens: 700,
            messages: [
              { role: 'system', content: `${ASSISTANT_SYSTEM_PROMPT}\n\nLa persona está en la página: ${page || 'desconocida'}.` },
              ...history,
            ],
          });
          if (response.content && !response.content.startsWith('Modo de demostración')) {
            return NextResponse.json({ reply: response.content, links: [], source: 'live_llm' });
          }
        } catch (err) {
          console.warn('Assistant live call failed, using offline answer:', err.message);
        }
      }
      const locale = ['en', 'pt-BR'].includes(lang) ? lang : lang === 'pt' ? 'pt-BR' : 'es';
      return NextResponse.json({ ...deterministicAssistantReply(lastUser.content, page, (t, v) => translateText(locale, t, v)), source: 'offline' });
    }

    if (mode === 'design') {
      const userGoal = (goal || '').trim();
      if (!userGoal) {
        return NextResponse.json(
          { error: 'Describa el objetivo pedagógico o pregunta de investigación.' },
          { status: 400 }
        );
      }

      if (active.isLive) {
        try {
          const langInstruction =
            lang === 'pt-BR' || lang === 'pt'
              ? 'Gere todos os campos do protocolo JSON estritamente em Português do Brasil.'
              : lang === 'en'
              ? 'Generate all fields of the JSON protocol strictly in academic English.'
              : 'Genera todos los campos del protocolo JSON estrictamente en español.';

          const response = await chat({
            provider: active.provider,
            apiKey: active.apiKey,
            model: active.model,
            baseUrl: active.baseUrl,
            temperature: 0.4,
            maxTokens: 2048,
            messages: [
              { role: 'system', content: STUDY_DESIGN_COPILOT_SYSTEM_PROMPT },
              {
                role: 'user',
                content: `Diseña un protocolo experimental A/B en PromptSketch para el siguiente objetivo de investigación:\n\n${userGoal}\n\n${langInstruction}`,
              },
            ],
          });

          const parsed = extractJsonBlock(response.content);
          if (parsed && parsed.condition_b_prompt) {
            return NextResponse.json({
              design: parsed,
              telemetry: response.telemetry,
              source: 'live_llm',
            });
          }
        } catch (err) {
          console.warn('Study Design Copilot live call failed, using deterministic synthesis:', err.message);
        }
      }

      const fallbackDesign = generateDeterministicStudyDesign(userGoal, lang);
      return NextResponse.json({
        design: fallbackDesign,
        telemetry: {
          provider: 'deterministic-architect',
          model: 'lak-protocol-synthesizer-v2',
          cost_usd: 0,
        },
        source: 'deterministic_fallback',
      });
    }

    // Default mode: 'lak-review' (methodological peer reviewer; mode id kept for API compatibility)
    if (active.isLive) {
      try {
        const response = await chat({
          provider: active.provider,
          apiKey: active.apiKey,
          model: active.model,
          baseUrl: active.baseUrl,
          temperature: 0.3,
          maxTokens: 2048,
          messages: buildLakReviewerMessages(metricsPayload || {}, lang),
        });

        if (response.content && !response.content.startsWith('Modo de demostración')) {
          return NextResponse.json({
            critique: response.content,
            telemetry: response.telemetry,
            source: 'live_llm',
          });
        }
      } catch (err) {
        console.warn('Methodological reviewer live call failed, using deterministic mathematical audit:', err.message);
      }
    }

    const deterministicCritique = generateDeterministicLakCritique(metricsPayload || {}, lang);
    return NextResponse.json({
      critique: deterministicCritique,
      telemetry: {
        provider: 'deterministic-auditor',
        model: 'lak-statistical-reviewer-v2',
        cost_usd: 0,
      },
      source: 'deterministic_fallback',
    });
  } catch (error) {
    console.error('Copilot API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
