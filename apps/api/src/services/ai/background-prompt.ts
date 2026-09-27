import type { Motif, Occasion, Palette } from '@poster/shared';

const OCCASION_EN: Record<Occasion, string> = {
  victory_day: 'national Victory Day celebration', mourning: 'solemn mourning and tribute',
  election: 'election campaign', greetings: 'festive greetings', festival: 'Eid / festival celebration',
};
const MOTIF_EN: Record<Motif, string> = {
  paddy_field: 'golden rice paddy fields of rural Bangladesh under a wide sky',
  flag_waves: 'flowing waving fabric in the style of the Bangladesh national flag (green field, red circle)',
  doves: 'white doves of peace flying across a soft sky',
  sunrise: 'a radiant red rising sun with light rays',
  floral: 'elegant floral wreath borders of white lilies and marigolds',
  boat_river: 'a traditional wooden boat on a calm wide river at dusk',
};

export function buildBackgroundPrompt(occasion: Occasion, motif: Motif, palette: Palette): string {
  return [
    `Decorative portrait background artwork for a Bangladeshi ${OCCASION_EN[occasion]} poster.`,
    `Theme: ${MOTIF_EN[motif]}.`,
    `Dominant colours: ${palette.primary} and ${palette.secondary}, highlights in ${palette.accent}.`,
    'Keep the top 40% and the bottom 20% calm and low-detail so photos and text can be placed over them.',
    'Strictly NO text, NO letters, NO numbers, NO logos, NO watermarks, NO people or faces, NO political party symbols.',
    'Rich painterly poster illustration, print quality, 3:4 portrait.',
  ].join(' ');
}
