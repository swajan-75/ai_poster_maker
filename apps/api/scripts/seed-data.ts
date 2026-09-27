import type { Motif, PosterDesign, Palette, Occasion, LayoutKey } from '@poster/shared';
import { TemplateModel } from '../src/models/template.model.js';

interface SeedTemplate {
  slug: string; title: string; occasion: Occasion; layoutKey: LayoutKey; photoSlots: number;
  thumbnailUrl: string; defaultHeadline: string; palettes: Palette[]; motifs: Motif[]; defaultDesign: PosterDesign;
}

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    slug: 'victory-day-classic', title: 'মহান বিজয় দিবস', occasion: 'victory_day', layoutKey: 'victory', photoSlots: 3,
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
    slug: 'tribute-mourning', title: 'গভীর শোক ও শ্রদ্ধাঞ্জলি', occasion: 'mourning', layoutKey: 'tribute', photoSlots: 1,
    thumbnailUrl: '/templates/tribute-mourning.png', defaultHeadline: 'গভীর শোক ও বিনম্র শ্রদ্ধা',
    palettes: [
      { id: 'mourning-black', name: 'শোক কালো', primary: '#111111', secondary: '#3A3A3A', accent: '#C9A227', text: '#FFFFFF', footerBg: '#000000' },
      { id: 'white-lily', name: 'শুভ্র', primary: '#F5F5F0', secondary: '#9E9E9E', accent: '#1B1B1B', text: '#1B1B1B', footerBg: '#2B2B2B' },
    ],
    motifs: ['floral', 'doves'],
    defaultDesign: { paletteId: 'mourning-black', motif: 'floral', headlineFont: 'noto-serif-bengali', headlineScale: 1, photoFocus: [] },
  },
  {
    slug: 'election-campaign', title: 'নির্বাচনী প্রচারণা', occasion: 'election', layoutKey: 'campaign', photoSlots: 2,
    thumbnailUrl: '/templates/election-campaign.png', defaultHeadline: 'আপনার ভোট, আপনার অধিকার',
    palettes: [
      { id: 'party-green', name: 'সবুজ', primary: '#0B6E4F', secondary: '#08A045', accent: '#FFD166', text: '#FFFFFF', footerBg: '#063D2C' },
      { id: 'royal-blue', name: 'নীল', primary: '#0D47A1', secondary: '#1976D2', accent: '#FFC107', text: '#FFFFFF', footerBg: '#082B61' },
      { id: 'saffron', name: 'জাফরান', primary: '#E65100', secondary: '#FB8C00', accent: '#FFFFFF', text: '#FFFFFF', footerBg: '#8C3100' },
    ],
    motifs: ['flag_waves', 'boat_river', 'sunrise', 'paddy_field'],
    defaultDesign: { paletteId: 'party-green', motif: 'sunrise', headlineFont: 'hind-siliguri', headlineScale: 1, photoFocus: [] },
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
