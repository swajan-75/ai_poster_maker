export const OCCASIONS = ['victory_day', 'mourning', 'election', 'greetings', 'festival'] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const OCCASION_LABELS_BN: Record<Occasion, string> = {
  victory_day: 'বিজয় দিবস',
  mourning: 'শোক/স্মরণ',
  election: 'নির্বাচনী প্রচার',
  greetings: 'শুভেচ্ছা',
  festival: 'ঈদ/উৎসব',
};

export const POSTER_STATUSES = ['queued', 'generating', 'completed', 'failed'] as const;
export type PosterStatus = (typeof POSTER_STATUSES)[number];

export const MOTIFS = ['paddy_field', 'flag_waves', 'doves', 'sunrise', 'floral', 'boat_river'] as const;
export type Motif = (typeof MOTIFS)[number];

export const HEADLINE_FONTS = ['noto-serif-bengali', 'hind-siliguri', 'noto-sans-bengali'] as const;
export type HeadlineFont = (typeof HEADLINE_FONTS)[number];

export const LAYOUT_KEYS = ['victory', 'tribute', 'campaign'] as const;
export type LayoutKey = (typeof LAYOUT_KEYS)[number];

/** Bangladeshi election-poster layouts: they render the extra ballot fields and use photo slots as candidate / symbol / leader. */
export const BALLOT_LAYOUTS = [] as const satisfies readonly LayoutKey[];
export const isBallotLayout = (k: LayoutKey): boolean => (BALLOT_LAYOUTS as readonly LayoutKey[]).includes(k);

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
