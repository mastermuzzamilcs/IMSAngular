import { MxThemeService } from '@mesix/theme';

export type ImsThemeId = 'light' | 'dark';

export const IMS_THEME_STORAGE_KEY = 'ims.themeId';

const THEME_OPTIONS = {
  density: 'comfortable' as const,
  radius: 8,
  fontFamily: "'Google Sans', Roboto, 'Segoe UI', 'Helvetica Neue', sans-serif",
};

export function readStoredThemeId(): ImsThemeId {
  try {
    const value = localStorage.getItem(IMS_THEME_STORAGE_KEY);
    return value === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function storeThemeId(themeId: ImsThemeId): void {
  try {
    localStorage.setItem(IMS_THEME_STORAGE_KEY, themeId);
  } catch {
    // Ignore private-mode / blocked storage.
  }
}

export function applyImsTheme(theme: MxThemeService, themeId: ImsThemeId): void {
  theme.apply({
    themeId,
    ...THEME_OPTIONS,
  });
  storeThemeId(themeId);
}
