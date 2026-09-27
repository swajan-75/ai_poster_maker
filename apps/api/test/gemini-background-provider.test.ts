import { describe, expect, it, vi } from 'vitest';
import { GeminiBackgroundProvider, type GenAiImageLike } from '../src/services/ai/gemini-background-provider.js';
import { buildBackgroundPrompt } from '../src/services/ai/background-prompt.js';

const palette = { id: 'g', name: 'g', primary: '#006A4E', secondary: '#F42A41', accent: '#FFD700', text: '#FFFFFF', footerBg: '#004D38' };

describe('GeminiBackgroundProvider', () => {
  it('requests IMAGE modality with 3:4 aspect ratio and decodes inline data', async () => {
    const png = Buffer.from('fake-png');
    const client: GenAiImageLike = { models: { generateContent: vi.fn().mockResolvedValue({
      candidates: [{ content: { parts: [{}, { inlineData: { data: png.toString('base64') } }] } }],
    }) } };
    const r = await new GeminiBackgroundProvider(client, 'img-model').generate('p');
    expect(r.image.equals(png)).toBe(true);
    const args = vi.mocked(client.models.generateContent).mock.calls[0]![0] as { model: string; config: { responseModalities: string[]; imageConfig: { aspectRatio: string } } };
    expect(args.model).toBe('img-model');
    expect(args.config.responseModalities).toEqual(['IMAGE']);
    expect(args.config.imageConfig.aspectRatio).toBe('3:4');
  });

  it('throws when no image is returned', async () => {
    const client: GenAiImageLike = { models: { generateContent: vi.fn().mockResolvedValue({ candidates: [] }) } };
    await expect(new GeminiBackgroundProvider(client, 'm').generate('p')).rejects.toThrow(/no image/i);
  });

  it('prompt forbids text, people and party symbols', () => {
    const p = buildBackgroundPrompt('victory_day', 'paddy_field', palette);
    expect(p).toMatch(/no text/i);
    expect(p).toMatch(/no .*people/i);
    expect(p).toMatch(/party symbols/i);
    expect(p).toContain('#006A4E');
  });
});
