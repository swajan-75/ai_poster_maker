import type { DesignProvider, DesignRequest, DesignResult } from './design-provider.js';

export class FakeDesignProvider implements DesignProvider {
  calls: DesignRequest[] = [];
  constructor(private readonly behavior: 'ok' | 'fail' | ((req: DesignRequest) => unknown) = 'ok') {}
  async suggestDesign(req: DesignRequest): Promise<DesignResult> {
    this.calls.push(req);
    if (this.behavior === 'fail') throw new Error('fake design failure');
    const raw = typeof this.behavior === 'function'
      ? this.behavior(req)
      : { ...req.template.defaultDesign, photoFocus: req.photos.map(() => ({ x: 0.5, y: 0.3 })) };
    return { raw, prompt: 'fake', model: 'fake', promptTokens: 0, outputTokens: 0, latencyMs: 1 };
  }
}
