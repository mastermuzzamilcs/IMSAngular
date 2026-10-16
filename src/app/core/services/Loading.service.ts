import { Injectable, inject } from '@angular/core';
import { MxLoadingService } from '@mesix/custom-control';

/** App loading API — backed by Mesix MxLoadingService / mx-spinner. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly mxLoading = inject(MxLoadingService);
  readonly loading$ = this.mxLoading.loading$;

  show(): void {
    this.mxLoading.show();
  }

  hide(): void {
    this.mxLoading.hide();
  }

  /** Clears any stuck overlay (e.g. after navigation). */
  reset(): void {
    this.mxLoading.reset();
  }
}
