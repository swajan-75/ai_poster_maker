import type { PdfPaper, PosterSize } from '@poster/shared';

export interface PdfOptions { paper: PdfPaper; landscape: boolean }

export interface PosterRenderer {
  /** Screenshot the poster HTML at the given output size. */
  render(html: string, size?: PosterSize): Promise<Buffer>;
  /** Print an HTML page to a PDF on the given paper. */
  renderPdf(html: string, opts: PdfOptions): Promise<Buffer>;
  close(): Promise<void>;
}
