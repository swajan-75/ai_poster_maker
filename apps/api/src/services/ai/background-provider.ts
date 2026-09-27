import type { SizeSpec } from '@poster/shared';
export interface BackgroundResult { image: Buffer; model: string; latencyMs: number }
export interface BackgroundProvider { generate(prompt: string, aspect?: SizeSpec['aspect']): Promise<BackgroundResult> }
