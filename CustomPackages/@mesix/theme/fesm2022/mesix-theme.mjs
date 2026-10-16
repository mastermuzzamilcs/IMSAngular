import { DOCUMENT } from '@angular/common';
import * as i0 from '@angular/core';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Google Drive — Light
 * Brand Blue #1A73E8 | Surface #FFFFFF | Canvas #F8F9FA | Ink #202124
 */
const MX_PALETTE_LIGHT = {
    primary: '#1A73E8',
    primaryContrast: '#ffffff',
    accent: '#1967D2',
    warn: '#D93025',
    success: '#188038',
    warning: '#F9AB00',
    bg: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#202124',
    textMuted: '#5F6368',
    border: '#DADCE0',
    overlay: 'rgba(32, 33, 36, 0.48)',
    overlayLight: 'rgba(32, 33, 36, 0.24)',
    successBg: '#E6F4EA',
    successBorder: '#A8DAB5',
    warningBg: '#FEF7E0',
    warningBorder: '#FDD663',
    errorBg: '#FCE8E6',
    errorBorder: '#F6AEA9',
    focusRing: 'rgba(26, 115, 232, 0.28)',
};
/**
 * Google Drive — Dark
 * Brand Blue #8AB4F8 | Surface #2D2E30 | Canvas #1B1B1B | Ink #E8EAED
 */
const MX_PALETTE_DARK = {
    primary: '#8AB4F8',
    primaryContrast: '#062e6f',
    accent: '#AECBFA',
    warn: '#F28B82',
    success: '#81C995',
    warning: '#FDD663',
    bg: '#1B1B1B',
    surface: '#2D2E30',
    surfaceElevated: '#35363A',
    text: '#E8EAED',
    textMuted: '#9AA0A6',
    border: '#3C4043',
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
    successBg: '#0D3B1E',
    successBorder: '#137333',
    warningBg: '#3C2F00',
    warningBorder: '#F9AB00',
    errorBg: '#3C1210',
    errorBorder: '#D93025',
    focusRing: 'rgba(138, 180, 248, 0.35)',
};
/** @deprecated Use MX_PALETTE_LIGHT */
const MX_PALETTE_MATERIAL = MX_PALETTE_LIGHT;
/** @deprecated Use MX_PALETTE_LIGHT */
const MX_PALETTE_CORPORATE = MX_PALETTE_LIGHT;
/** @deprecated Use MX_PALETTE_LIGHT */
const MX_PALETTE_SLATE = MX_PALETTE_LIGHT;
/** @deprecated Use MX_PALETTE_LIGHT */
const MX_PALETTE_INDIGO = MX_PALETTE_LIGHT;
/** @deprecated Use MX_PALETTE_DARK */
const MX_PALETTE_NIGHT = MX_PALETTE_DARK;
/** Primary themes: light + dark (Google Drive style) */
const MX_THEMES = {
    light: { id: 'light', name: 'Drive Light', mode: 'light', palette: MX_PALETTE_LIGHT },
    dark: { id: 'dark', name: 'Drive Dark', mode: 'dark', palette: MX_PALETTE_DARK },
    // Aliases so older themeIds keep working
    material: { id: 'light', name: 'Drive Light', mode: 'light', palette: MX_PALETTE_LIGHT },
    corporate: { id: 'light', name: 'Drive Light', mode: 'light', palette: MX_PALETTE_LIGHT },
    slate: { id: 'light', name: 'Drive Light', mode: 'light', palette: MX_PALETTE_LIGHT },
    indigo: { id: 'light', name: 'Drive Light', mode: 'light', palette: MX_PALETTE_LIGHT },
    night: { id: 'dark', name: 'Drive Dark', mode: 'dark', palette: MX_PALETTE_DARK },
};
/** Maps palette fields to CSS custom property names */
const MX_PALETTE_CSS_VARS = {
    primary: '--mx-primary',
    primaryContrast: '--mx-primary-contrast',
    accent: '--mx-accent',
    warn: '--mx-warn',
    success: '--mx-success',
    warning: '--mx-warning',
    bg: '--mx-bg',
    surface: '--mx-surface',
    surfaceElevated: '--mx-surface-elevated',
    text: '--mx-text',
    textMuted: '--mx-text-muted',
    border: '--mx-border',
    overlay: '--mx-overlay',
    overlayLight: '--mx-overlay-light',
    successBg: '--mx-success-bg',
    successBorder: '--mx-success-border',
    warningBg: '--mx-warning-bg',
    warningBorder: '--mx-warning-border',
    errorBg: '--mx-error-bg',
    errorBorder: '--mx-error-border',
    focusRing: '--mx-focus-ring',
};

class MxThemeService {
    document = inject(DOCUMENT);
    themeSubject = new BehaviorSubject({
        id: 'light',
        name: 'Drive Light',
        mode: 'light',
        palette: { ...MX_PALETTE_LIGHT },
    });
    theme$ = this.themeSubject.asObservable();
    get current() {
        return this.themeSubject.value;
    }
    /** Returns the two primary themes: light and dark. */
    listThemes() {
        return [MX_THEMES['light'], MX_THEMES['dark']];
    }
    /** Apply a named theme and optional consumer overrides. */
    apply(options = {}) {
        const base = MX_THEMES[options.themeId ?? 'light'] ?? MX_THEMES['light'];
        const palette = {
            ...base.palette,
            ...(options.palette ?? {}),
        };
        const meta = {
            id: base.id,
            name: options.palette ? `${base.name} (custom)` : base.name,
            mode: base.mode,
            palette,
        };
        const target = options.target ?? this.document.documentElement;
        this.writePalette(target, palette);
        target.setAttribute('data-mx-theme', meta.id);
        target.setAttribute('data-mx-mode', meta.mode);
        target.style.colorScheme = meta.mode;
        if (options.density) {
            target.style.setProperty('--mx-density', options.density);
            const scale = options.density === 'dense' ? '0.85' : options.density === 'compact' ? '0.92' : '1';
            target.style.setProperty('--mx-density-scale', scale);
        }
        if (options.radius != null) {
            target.style.setProperty('--mx-radius', `${options.radius}px`);
            target.style.setProperty('--mx-radius-lg', `${options.radius + 2}px`);
        }
        if (options.fontFamily) {
            target.style.setProperty('--mx-font', options.fontFamily);
        }
        this.themeSubject.next(meta);
        return meta;
    }
    /** Replace or patch only palette fields at runtime. */
    setPalette(partial, target) {
        return this.apply({
            themeId: this.current.id,
            palette: { ...this.current.palette, ...partial },
            target,
        });
    }
    writePalette(target, palette) {
        Object.keys(MX_PALETTE_CSS_VARS).forEach((key) => {
            target.style.setProperty(MX_PALETTE_CSS_VARS[key], palette[key]);
        });
        // Bridge into Angular Material system tokens when present
        target.style.setProperty('--mat-sys-primary', palette.primary);
        target.style.setProperty('--mat-sys-on-primary', palette.primaryContrast);
        target.style.setProperty('--mat-sys-secondary', palette.accent);
        target.style.setProperty('--mat-sys-error', palette.warn);
        target.style.setProperty('--mat-sys-surface', palette.surface);
        target.style.setProperty('--mat-sys-surface-container', palette.surface);
        target.style.setProperty('--mat-sys-surface-container-low', palette.bg);
        target.style.setProperty('--mat-sys-surface-container-high', palette.surfaceElevated);
        target.style.setProperty('--mat-sys-surface-container-highest', palette.surfaceElevated);
        target.style.setProperty('--mat-sys-on-surface', palette.text);
        target.style.setProperty('--mat-sys-on-surface-variant', palette.textMuted);
        target.style.setProperty('--mat-sys-background', palette.bg);
        target.style.setProperty('--mat-sys-outline', palette.border);
        target.style.setProperty('--mat-sys-outline-variant', palette.border);
    }
    static ɵfac = function MxThemeService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxThemeService)(); };
    static ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: MxThemeService, factory: MxThemeService.ɵfac, providedIn: 'root' });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxThemeService, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();

/*
 * Public API Surface of @mesix/theme
 * Theme tokens + runtime palette control only. UI controls live in @mesix/custom-control.
 */

/**
 * Generated bundle index. Do not edit.
 */

export { MX_PALETTE_CORPORATE, MX_PALETTE_CSS_VARS, MX_PALETTE_DARK, MX_PALETTE_INDIGO, MX_PALETTE_LIGHT, MX_PALETTE_MATERIAL, MX_PALETTE_NIGHT, MX_PALETTE_SLATE, MX_THEMES, MxThemeService };
//# sourceMappingURL=mesix-theme.mjs.map
