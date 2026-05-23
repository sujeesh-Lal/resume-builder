import { randomUUID } from 'crypto';

export function generateId(): string {
  return randomUUID();
}

export function generateGuestId(): string {
  return `guest_${randomUUID()}`;
}
