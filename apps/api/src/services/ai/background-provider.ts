export interface BackgroundResult { image: Buffer; model: string; latencyMs: number }
export interface BackgroundProvider { generate(prompt: string): Promise<BackgroundResult> }
