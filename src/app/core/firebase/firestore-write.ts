import { Timestamp } from 'firebase/firestore';

/** Firestore rejects undefined, NaN, and invalid dates. */
export function firestoreDoc(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    const next = firestoreValue(entry);
    if (next !== undefined) result[key] = next;
  }
  return result;
}

export function userFacingWriteError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error || '');
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  if (/quota/i.test(message) || /resource-exhausted/i.test(code) || /quota-exceeded/i.test(code)) {
    return 'This request could not be saved because a storage quota was exceeded. If Settings has a large app logo, replace it with a smaller image (under 200 KB), then try again. If the logo is already small, the Firebase project may have used its daily write quota.';
  }
  return message.trim() || fallback;
}

function firestoreValue(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (typeof value === 'number' && !Number.isFinite(value)) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : Timestamp.fromDate(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => firestoreValue(item)).filter((item) => item !== undefined);
  }
  if (value && typeof value === 'object' && !(value instanceof Timestamp)) {
    if ('toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
      return value;
    }
    return firestoreDoc(value as Record<string, unknown>);
  }
  return value;
}
