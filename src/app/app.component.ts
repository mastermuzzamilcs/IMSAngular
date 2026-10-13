import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MxThemeService } from '@mesix/theme';
import {
  MxSpinnerComponent,
  MxToastHostComponent,
  MxDialogHostComponent,
} from '@mesix/custom-control';
import { applyImsTheme, readStoredThemeId } from './core/theme/theme-preference';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LoadingService } from './core/services/Loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatSlideToggleModule,
    MxSpinnerComponent,
    MxToastHostComponent,
    MxDialogHostComponent,
    MatExpansionModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'IMSAngular';
  isHandset$: Observable<boolean>;
  darkMode = false;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private loadingService: LoadingService,
    private theme: MxThemeService,
  ) {
    this.darkMode = readStoredThemeId() === 'dark';
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map((result) => result.matches),
      shareReplay(),
    );
    this.router.events.subscribe((event) => {
      // Clear any leftover overlay after navigation settles; pages own their own show/hide.
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loadingService.reset();
      }
    });
  }

  onDarkModeChange(enabled: boolean): void {
    this.darkMode = enabled;
    applyImsTheme(this.theme, enabled ? 'dark' : 'light');
  }
}
