import { MxPalette, MxThemeId, MxThemeMeta } from '../tokens/mx-palette';
import * as i0 from "@angular/core";
export interface MxThemeOptions {
    /** Named built-in theme id */
    themeId?: MxThemeId | string;
    /** Partial or full palette override — wins over the named theme */
    palette?: Partial<MxPalette>;
    /** Element that receives CSS variables. Defaults to documentElement. */
    target?: HTMLElement;
    /** Optional density token: comfortable | compact | dense */
    density?: 'comfortable' | 'compact' | 'dense';
    /** Optional radius scale in px */
    radius?: number;
    /** Optional font stack */
    fontFamily?: string;
}
export declare class MxThemeService {
    private readonly document;
    private readonly themeSubject;
    readonly theme$: import("rxjs").Observable<MxThemeMeta>;
    get current(): MxThemeMeta;
    /** Returns the two primary themes: light and dark. */
    listThemes(): MxThemeMeta[];
    /** Apply a named theme and optional consumer overrides. */
    apply(options?: MxThemeOptions): MxThemeMeta;
    /** Replace or patch only palette fields at runtime. */
    setPalette(partial: Partial<MxPalette>, target?: HTMLElement): MxThemeMeta;
    private writePalette;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxThemeService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<MxThemeService>;
}
