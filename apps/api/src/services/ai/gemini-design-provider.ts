import type { DesignProvider, DesignRequest, DesignResult } from './design-provider.js';
import { buildDesignPrompt, buildDesignResponseSchema } from './design-prompt.js';

export interface GenAiLike {
  models: {
    generateContent(args: unknown): Promise<{
      text?: string;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    }>;
  };
}

export class GeminiDesignProvider implements DesignProvider {
  constructor(private readonly client: GenAiLike, private readonly model: string) {}

  async suggestDesign(req: DesignRequest): Promise<DesignResult> {
    const prompt = buildDesignPrompt(req);
    const started = Date.now();
    const res = await this.client.models.generateContent({
      model: this.model,
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          ...req.photos.map((b) => ({ inlineData: { mimeType: 'image/jpeg', data: b.toString('base64') } })),
        ],
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: buildDesignResponseSchema(req.template),
        temperature: 0.8,
      },
    });
    const latencyMs = Date.now() - started;
    if (!res.text) throw new Error('Gemini returned empty design response');
    let raw: unknown;
    try { raw = JSON.parse(res.text); } catch { throw new Error('Gemini design response is not valid JSON'); }
    return {
      raw, prompt, model: this.model, latencyMs,
      promptTokens: res.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: res.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }
}
