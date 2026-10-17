/**
 * Username rules shared by the user form and the users service.
 * 3-30 characters: letters, digits, dot, underscore, hyphen. No '@', so a login identifier
 * containing '@' is always an email and anything else is always a username.
 */
export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,30}$/;

export function normalizeUsername(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

export function isValidUsername(value: string | null | undefined): boolean {
  return USERNAME_PATTERN.test((value || '').trim());
}
