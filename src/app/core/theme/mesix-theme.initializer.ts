import { MxThemeService } from '@mesix/theme';
import { applyImsTheme, readStoredThemeId } from './theme-preference';

/** Applies saved light/dark preference (Google Drive style) at bootstrap. */
export function initializeMesixTheme(theme: MxThemeService): () => void {
  return () => {
    applyImsTheme(theme, readStoredThemeId());
  };
}
