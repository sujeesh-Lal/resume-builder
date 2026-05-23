export const RESUME_EVENTS = {
  RESUME_CREATED: 'resume.created',
  RESUME_UPDATED: 'resume.updated',
  RESUME_DELETED: 'resume.deleted',
} as const;

export type ResumeEventType = typeof RESUME_EVENTS[keyof typeof RESUME_EVENTS];

export interface ResumeCreatedEvent {
  resumeId: string;
  guestId?: string;
  userId?: string;
  timestamp: string;
}

export interface ResumeUpdatedEvent {
  resumeId: string;
  guestId?: string;
  userId?: string;
  timestamp: string;
}

export interface ResumeDeletedEvent {
  resumeId: string;
  timestamp: string;
}
