/** Semantic color tokens for Mesix themes. Consumers may override any field. */
export interface MxPalette {
    primary: string;
    primaryContrast: string;
    accent: string;
    warn: string;
    success: string;
    warning: string;
    bg: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textMuted: string;
    border: string;
    overlay: string;
    overlayLight: string;
    successBg: string;
    successBorder: string;
    warningBg: string;
    warningBorder: string;
    errorBg: string;
    errorBorder: string;
    focusRing: string;
}
export interface MxThemeMeta {
    id: string;
    name: string;
    mode: 'light' | 'dark';
    palette: MxPalette;
}
/**
 * Google Drive — Light
 * Brand Blue #1A73E8 | Surface #FFFFFF | Canvas #F8F9FA | Ink #202124
 */
export declare const MX_PALETTE_LIGHT: MxPalette;
/**
 * Google Drive — Dark
 * Brand Blue #8AB4F8 | Surface #2D2E30 | Canvas #1B1B1B | Ink #E8EAED
 */
export declare const MX_PALETTE_DARK: MxPalette;
/** @deprecated Use MX_PALETTE_LIGHT */
export declare const MX_PALETTE_MATERIAL: MxPalette;
/** @deprecated Use MX_PALETTE_LIGHT */
export declare const MX_PALETTE_CORPORATE: MxPalette;
/** @deprecated Use MX_PALETTE_LIGHT */
export declare const MX_PALETTE_SLATE: MxPalette;
/** @deprecated Use MX_PALETTE_LIGHT */
export declare const MX_PALETTE_INDIGO: MxPalette;
/** @deprecated Use MX_PALETTE_DARK */
export declare const MX_PALETTE_NIGHT: MxPalette;
/** Primary themes: light + dark (Google Drive style) */
export declare const MX_THEMES: Record<string, MxThemeMeta>;
export type MxThemeId = 'light' | 'dark';
/** Maps palette fields to CSS custom property names */
export declare const MX_PALETTE_CSS_VARS: Record<keyof MxPalette, string>;
