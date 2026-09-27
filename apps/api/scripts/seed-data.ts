import type { Motif, PosterDesign, Palette, Occasion, LayoutKey } from '@poster/shared';
import { TemplateModel } from '../src/models/template.model.js';

interface SeedTemplate {
  slug: string; title: string; occasion: Occasion; layoutKey: LayoutKey; photoSlots: number;
  thumbnailUrl: string; defaultHeadline: string; palettes: Palette[]; motifs: Motif[]; defaultDesign: PosterDesign;
  /** false = premium: Pro / Ultra plans only. */
  isFree: boolean;
}

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    slug: 'victory-day-classic', isFree: true, title: 'মহান বিজয় দিবস', occasion: 'victory_day', layoutKey: 'victory', photoSlots: 3,
    thumbnailUrl: '/templates/victory-day-classic.png', defaultHeadline: 'মহান বিজয় দিবস',
    palettes: [
      { id: 'flag-green', name: 'পতাকা সবুজ', primary: '#006A4E', secondary: '#F42A41', accent: '#FFD700', text: '#FFFFFF', footerBg: '#004D38' },
      { id: 'sunrise-red', name: 'রক্তিম সূর্য', primary: '#B71C1C', secondary: '#006A4E', accent: '#FFEB3B', text: '#FFFFFF', footerBg: '#7F0000' },
      { id: 'paddy-gold', name: 'সোনালি ধান', primary: '#2E7D32', secondary: '#F9A825', accent: '#FFF59D', text: '#FFFFFF', footerBg: '#1B5E20' },
    ],
    motifs: ['paddy_field', 'flag_waves', 'doves', 'sunrise'],
    defaultDesign: { paletteId: 'flag-green', motif: 'flag_waves', headlineFont: 'noto-serif-bengali', headlineScale: 1, photoFocus: [] },
  },
  {
    slug: 'tribute-mourning', isFree: true, title: 'গভীর শোক ও শ্রদ্ধাঞ্জলি', occasion: 'mourning', layoutKey: 'tribute', photoSlots: 1,
    thumbnailUrl: '/templates/tribute-mourning.png', defaultHeadline: 'গভীর শোক ও বিনম্র শ্রদ্ধা',
    palettes: [
      { id: 'mourning-black', name: 'শোক কালো', primary: '#111111', secondary: '#3A3A3A', accent: '#C9A227', text: '#FFFFFF', footerBg: '#000000' },
      { id: 'white-lily', name: 'শুভ্র', primary: '#F5F5F0', secondary: '#9E9E9E', accent: '#1B1B1B', text: '#1B1B1B', footerBg: '#2B2B2B' },
    ],
    motifs: ['floral', 'doves'],
    defaultDesign: { paletteId: 'mourning-black', motif: 'floral', headlineFont: 'noto-serif-bengali', headlineScale: 1, photoFocus: [] },
  },
  {
    slug: 'election-campaign', isFree: true, title: 'নির্বাচনী প্রচারণা', occasion: 'election', layoutKey: 'campaign', photoSlots: 2,
    thumbnailUrl: '/templates/election-campaign.png', defaultHeadline: 'আপনার ভোট, আপনার অধিকার',
    palettes: [
      { id: 'party-green', name: 'সবুজ', primary: '#0B6E4F', secondary: '#08A045', accent: '#FFD166', text: '#FFFFFF', footerBg: '#063D2C' },
      { id: 'royal-blue', name: 'নীল', primary: '#0D47A1', secondary: '#1976D2', accent: '#FFC107', text: '#FFFFFF', footerBg: '#082B61' },
      { id: 'saffron', name: 'জাফরান', primary: '#E65100', secondary: '#FB8C00', accent: '#FFFFFF', text: '#FFFFFF', footerBg: '#8C3100' },
    ],
    motifs: ['flag_waves', 'boat_river', 'sunrise', 'paddy_field'],
    defaultDesign: { paletteId: 'party-green', motif: 'sunrise', headlineFont: 'hind-siliguri', headlineScale: 1, photoFocus: [] },
  },
  // --- Premium (Pro / Ultra) ---
  {
    slug: 'victory-day-royal', isFree: false, title: 'বিজয় দিবস — রাজকীয়', occasion: 'victory_day', layoutKey: 'victory', photoSlots: 3,
    thumbnailUrl: '/templates/victory-day-royal.png', defaultHeadline: 'মহান বিজয় দিবস',
    palettes: [
      { id: 'royal-midnight', name: 'রাজকীয় নীল', primary: '#0A1F44', secondary: '#006A4E', accent: '#E8C468', text: '#FFFFFF', footerBg: '#06142C' },
      { id: 'maroon-gold', name: 'মেরুন সোনালি', primary: '#5C0F1B', secondary: '#006A4E', accent: '#F2C94C', text: '#FFFFFF', footerBg: '#3A0911' },
    ],
    motifs: ['flag_waves', 'sunrise', 'doves'],
    defaultDesign: { paletteId: 'royal-midnight', motif: 'flag_waves', headlineFont: 'noto-serif-bengali', headlineScale: 1.1, photoFocus: [] },
  },
  {
    slug: 'eid-mubarak-premium', isFree: false, title: 'ঈদ মোবারক', occasion: 'festival', layoutKey: 'tribute', photoSlots: 1,
    thumbnailUrl: '/templates/eid-mubarak-premium.png', defaultHeadline: 'পবিত্র ঈদুল ফিতরের শুভেচ্ছা',
    palettes: [
      { id: 'emerald-gold', name: 'পান্না সোনালি', primary: '#0B4F3C', secondary: '#127A5B', accent: '#F5D06F', text: '#FFFFFF', footerBg: '#073528' },
      { id: 'night-crescent', name: 'চাঁদরাত', primary: '#1A1446', secondary: '#3B2F8F', accent: '#FFE08A', text: '#FFFFFF', footerBg: '#100C2E' },
    ],
    motifs: ['floral', 'sunrise'],
    defaultDesign: { paletteId: 'emerald-gold', motif: 'floral', headlineFont: 'noto-serif-bengali', headlineScale: 1, photoFocus: [] },
  },
  {
    slug: 'pohela-boishakh-premium', isFree: false, title: 'শুভ নববর্ষ', occasion: 'greetings', layoutKey: 'campaign', photoSlots: 2,
    thumbnailUrl: '/templates/pohela-boishakh-premium.png', defaultHeadline: 'শুভ নববর্ষ',
    palettes: [
      { id: 'boishakhi-red', name: 'বৈশাখী লাল', primary: '#C62828', secondary: '#FFFFFF', accent: '#FFD54F', text: '#FFFFFF', footerBg: '#7F1414' },
      { id: 'mango-yellow', name: 'আমের হলুদ', primary: '#F9A825', secondary: '#C62828', accent: '#FFFFFF', text: '#2B1B00', footerBg: '#8D5A00' },
    ],
    motifs: ['floral', 'boat_river', 'paddy_field'],
    defaultDesign: { paletteId: 'boishakhi-red', motif: 'floral', headlineFont: 'hind-siliguri', headlineScale: 1.1, photoFocus: [] },
  },
];

export async function seedTemplates(): Promise<{ upserted: number }> {
  let upserted = 0;
  for (const t of SEED_TEMPLATES) {
    const r = await TemplateModel.updateOne({ slug: t.slug }, { $set: t, $setOnInsert: { isActive: true } }, { upsert: true, runValidators: true });
    upserted += r.upsertedCount + r.modifiedCount;
  }
  return { upserted };
}
