export interface PosterRenderer {
  render(html: string): Promise<Buffer>;
  close(): Promise<void>;
}
