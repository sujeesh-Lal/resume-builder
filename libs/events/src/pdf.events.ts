export const PDF_EVENTS = {
  PDF_REQUESTED: 'pdf.requested',
  PDF_GENERATED: 'pdf.generated',
  PDF_FAILED: 'pdf.failed',
} as const;

export type PdfEventType = typeof PDF_EVENTS[keyof typeof PDF_EVENTS];

export interface PdfRequestedEvent {
  resumeId: string;
  template: string;
  format: string;
  requestedAt: string;
}

export interface PdfGeneratedEvent {
  resumeId: string;
  url: string;
  generatedAt: string;
}

export interface PdfFailedEvent {
  resumeId: string;
  error: string;
  failedAt: string;
}
