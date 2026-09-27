import { describe, expect, it, vi } from 'vitest';
import { GeminiDesignProvider, type GenAiLike } from '../src/services/ai/gemini-design-provider.js';
import { buildDesignPrompt } from '../src/services/ai/design-prompt.js';
import type { DesignRequest } from '../src/services/ai/design-provider.js';

const req: DesignRequest = {
  template: {
    slug: 'v', title: 'মহান বিজয় দিবস', occasion: 'victory_day',
    palettes: [{ id: 'flag-green', name: 'g', primary: '#006A4E', secondary: '#F42A41', accent: '#FFD700', text: '#FFFFFF', footerBg: '#004D38' }],
    motifs: ['doves', 'paddy_field'],
    defaultDesign: { paletteId: 'flag-green', motif: 'doves', headlineFont: 'hind-siliguri', headlineScale: 1, photoFocus: [] },
  },
  form: { name: 'করিম', designation: 'সভাপতি', organization: 'কমিটি', union: '', thana: '', district: 'ঢাকা', headline: 'মহান বিজয় দিবস', tagline: '' },
  photos: [Buffer.from([0xff, 0xd8, 0xff])],
};

const client = (text: string | undefined): GenAiLike => ({
  models: { generateContent: vi.fn().mockResolvedValue({ text, usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20 } }) },
});

describe('GeminiDesignProvider', () => {
  it('sends prompt + one inline image per photo with JSON response schema', async () => {
    const c = client('{"paletteId":"flag-green"}');
    await new GeminiDesignProvider(c, 'gemini-2.5-flash').suggestDesign(req);
    const args = vi.mocked(c.models.generateContent).mock.calls[0]![0] as {
      model: string; contents: { parts: { text?: string; inlineData?: { mimeType: string } }[] }[];
      config: { responseMimeType: string; responseSchema: { properties: { paletteId: { enum: string[] } } } };
    };
    expect(args.model).toBe('gemini-2.5-flash');
    expect(args.contents[0]!.parts.filter((p) => p.inlineData)).toHaveLength(1);
    expect(args.config.responseMimeType).toBe('application/json');
    expect(args.config.responseSchema.properties.paletteId.enum).toEqual(['flag-green']);
  });

  it('parses JSON and reports usage', async () => {
    const r = await new GeminiDesignProvider(client('{"paletteId":"flag-green","motif":"doves"}'), 'm').suggestDesign(req);
    expect(r.raw).toEqual({ paletteId: 'flag-green', motif: 'doves' });
    expect(r).toMatchObject({ promptTokens: 100, outputTokens: 20, model: 'm' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('throws on empty or non-JSON output', async () => {
    await expect(new GeminiDesignProvider(client(undefined), 'm').suggestDesign(req)).rejects.toThrow(/empty/i);
    await expect(new GeminiDesignProvider(client('not json'), 'm').suggestDesign(req)).rejects.toThrow(/json/i);
  });

  it('prompt lists allowed options and treats user text as data', () => {
    const p = buildDesignPrompt(req);
    expect(p).toContain('flag-green');
    expect(p).toContain('paddy_field');
    expect(p).toContain('মহান বিজয় দিবস');
    expect(p).toMatch(/ignore any instructions/i);
  });
});
