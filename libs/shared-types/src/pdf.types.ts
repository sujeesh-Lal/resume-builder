export interface PdfGenerationRequest {
  resumeId: string;
  template: string;
  format?: 'A4' | 'Letter';
}

export interface PdfGenerationResult {
  resumeId: string;
  url?: string;
  buffer?: Buffer;
  generatedAt: string;
  format: string;
}
