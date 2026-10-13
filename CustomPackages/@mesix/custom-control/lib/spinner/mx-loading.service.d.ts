import * as i0 from "@angular/core";
export declare class MxLoadingService {
    private count;
    private readonly loadingSubject;
    readonly loading$: import("rxjs").Observable<boolean>;
    show(): void;
    hide(): void;
    reset(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxLoadingService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<MxLoadingService>;
}
