import type { PosterSize, Motif, Occasion, Palette, PosterDesign, PosterFormData } from '@poster/shared';

export interface DesignTemplateInfo { slug: string; title: string; occasion: Occasion; palettes: Palette[]; motifs: Motif[]; defaultDesign: PosterDesign }
export interface DesignRequest { template: DesignTemplateInfo; form: PosterFormData; photos: Buffer[] /* JPEG ≤512px */; size?: PosterSize }
export interface DesignResult { raw: unknown; prompt: string; model: string; promptTokens: number; outputTokens: number; latencyMs: number }
export interface DesignProvider { suggestDesign(req: DesignRequest): Promise<DesignResult> }
