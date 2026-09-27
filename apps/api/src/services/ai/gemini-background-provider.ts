import type { SizeSpec } from '@poster/shared';
import type { BackgroundProvider, BackgroundResult } from './background-provider.js';

export interface GenAiImageLike {
  models: { generateContent(args: unknown): Promise<{ candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[] }> };
}

export class GeminiBackgroundProvider implements BackgroundProvider {
  constructor(private readonly client: GenAiImageLike, private readonly model: string) {}
  async generate(prompt: string, aspect: SizeSpec['aspect'] = '3:4'): Promise<BackgroundResult> {
    const started = Date.now();
    const res = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect } },
    });
    const data = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
    if (!data) throw new Error('Gemini returned no image');
    return { image: Buffer.from(data, 'base64'), model: this.model, latencyMs: Date.now() - started };
  }
}
