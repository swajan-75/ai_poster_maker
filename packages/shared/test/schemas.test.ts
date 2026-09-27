import { describe, expect, it } from 'vitest';
import {
  posterFormSchema, createPosterSchema, registerSchema, posterDesignSchema, regenerateSchema,
} from '../src/index.js';

const validForm = {
  name: 'মোঃ আব্দুল করিম',
  designation: 'সভাপতি',
  organization: '৩নং ওয়ার্ড কমিটি',
  union: '',
  thana: 'সাভার',
  district: 'ঢাকা',
  headline: 'মহান বিজয় দিবস',
  tagline: '',
};

describe('posterFormSchema', () => {
  it('accepts a valid Bangla form', () => {
    expect(posterFormSchema.safeParse(validForm).success).toBe(true);
  });
  it('trims whitespace', () => {
    const r = posterFormSchema.parse({ ...validForm, name: '  করিম  ' });
    expect(r.name).toBe('করিম');
  });
  it('rejects control characters', () => {
    expect(posterFormSchema.safeParse({ ...validForm, name: 'করিম\u0007' }).success).toBe(false);
  });
  it('keeps ZWJ/ZWNJ used in Bangla', () => {
    const r = posterFormSchema.parse({ ...validForm, organization: 'র‍্যাব' });
    expect(r.organization).toContain('‍');
  });
  it('rejects a headline longer than 60 chars', () => {
    expect(posterFormSchema.safeParse({ ...validForm, headline: 'ক'.repeat(61) }).success).toBe(false);
  });
  it('requires district', () => {
    expect(posterFormSchema.safeParse({ ...validForm, district: '' }).success).toBe(false);
  });
});

describe('createPosterSchema', () => {
  const base = { templateId: '64b7f0c2a1b2c3d4e5f60718', formData: validForm, photoIds: ['a'] };
  it('accepts 1..3 photos', () => {
    expect(createPosterSchema.safeParse(base).success).toBe(true);
    expect(createPosterSchema.safeParse({ ...base, photoIds: ['a', 'b', 'c'] }).success).toBe(true);
  });
  it('rejects 0 or 4 photos', () => {
    expect(createPosterSchema.safeParse({ ...base, photoIds: [] }).success).toBe(false);
    expect(createPosterSchema.safeParse({ ...base, photoIds: ['a', 'b', 'c', 'd'] }).success).toBe(false);
  });
  it('rejects a non-ObjectId templateId', () => {
    expect(createPosterSchema.safeParse({ ...base, templateId: 'abc' }).success).toBe(false);
  });
});

describe('regenerateSchema', () => {
  it('accepts empty body and partial formData', () => {
    expect(regenerateSchema.safeParse({}).success).toBe(true);
    expect(regenerateSchema.safeParse({ formData: { headline: 'নতুন শিরোনাম' } }).success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('lowercases email', () => {
    const r = registerSchema.parse({ name: 'করিম', email: 'A@B.COM', password: 'secret123' });
    expect(r.email).toBe('a@b.com');
  });
  it('rejects passwords shorter than 8 or longer than 72', () => {
    expect(registerSchema.safeParse({ name: 'ক', email: 'a@b.com', password: 'short' }).success).toBe(false);
    expect(registerSchema.safeParse({ name: 'কখ', email: 'a@b.com', password: 'x'.repeat(73) }).success).toBe(false);
  });
});

describe('posterDesignSchema', () => {
  const d = { paletteId: 'flag-green', motif: 'paddy_field', headlineFont: 'hind-siliguri', headlineScale: 1, photoFocus: [{ x: 0.5, y: 0.3 }] };
  it('accepts a valid design', () => expect(posterDesignSchema.safeParse(d).success).toBe(true));
  it('rejects out-of-range scale and focus', () => {
    expect(posterDesignSchema.safeParse({ ...d, headlineScale: 2 }).success).toBe(false);
    expect(posterDesignSchema.safeParse({ ...d, photoFocus: [{ x: 1.5, y: 0 }] }).success).toBe(false);
  });
});
