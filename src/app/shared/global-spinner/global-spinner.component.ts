import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../core/services/Loading.service';

@Component({
  selector: 'app-global-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="overlay" *ngIf="loadingService.loading$ | async" mode="indeterminate">
      <mat-spinner diameter="50"></mat-spinner>
    </div>
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
    `,
  ],
})
export class GlobalSpinnerComponent {
  constructor(public loadingService: LoadingService) {}
}
