import { Component, ViewChild } from '@angular/core';
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
import { MxToastHostComponent, MxDialogHostComponent } from '@mesix/custom-control';
import { applyImsTheme, readStoredThemeId } from './core/theme/theme-preference';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from './core/services/Loading.service';
import { NotificationInboxService } from './core/notifications/notification-inbox.service';
import { NotificationSoundService } from './core/notifications/notification-sound.service';
import { InboxNotification } from './core/notifications/notification.model';
import { PrivilegeRef, privileges as privilegeAccess } from './core/auth/privilege-catalog';
import { PrivilegeDirective } from './core/auth/privilege.directive';
import { AuthService } from './core/services/auth.service';
import { AppSettingsService } from './core/services/app-settings.service';
import { ReportExportActivityService } from '@mesix/reporting';

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
    MatBadgeModule,
    MatExpansionModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MxToastHostComponent,
    MxDialogHostComponent,
    PrivilegeDirective,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild('drawer') drawer?: MatSidenav;
  readonly privileges = privilegeAccess;
  title = 'IMSAngular';
  isHandset$: Observable<boolean>;
  session$;
  readonly loading$: Observable<boolean>;
  sidenavOpen = false;
  notifications$;
  unreadCount$;
  appTitle$;
  appLogo$;
  darkMode = false;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private loadingService: LoadingService,
    private theme: MxThemeService,
    private auth: AuthService,
    private inbox: NotificationInboxService,
    private sound: NotificationSoundService,
    private appSettings: AppSettingsService,
    readonly reportExports: ReportExportActivityService,
  ) {
    this.loading$ = this.loadingService.loading$;
    this.darkMode = readStoredThemeId() === 'dark';
    this.session$ = this.auth.session$;
    this.notifications$ = this.inbox.items$;
    this.unreadCount$ = this.inbox.unreadCount$;
    this.appTitle$ = this.appSettings.title$;
    this.appLogo$ = this.appSettings.logo$;
    this.auth.session$.subscribe((session) => {
      if (session?.userid) {
        this.inbox.watch(session.userid);
      } else {
        this.inbox.stop();
      }
    });
    const primeSound = () => {
      this.sound.prime();
      document.removeEventListener('pointerdown', primeSound);
    };
    document.addEventListener('pointerdown', primeSound);
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

  hasAny(items: PrivilegeRef[]): boolean {
    return items.some((item) => this.auth.hasPrivilege(item.moduleId, item.functionId));
  }

  toggleSidenav(): void {
    this.drawer?.toggle();
  }

  onDarkModeChange(enabled: boolean): void {
    this.darkMode = enabled;
    applyImsTheme(this.theme, enabled ? 'dark' : 'light');
  }

  logout(): void {
    this.reportExports.cancelAndDismiss();
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }

  switchBranch(branchid: string): void {
    this.auth.selectBranch(branchid);
  }

  openNotification(item: InboxNotification): void {
    if (!item.read) {
      void this.inbox.markRead(item.id);
    }
  }

  markAllRead(): void {
    void this.inbox.markAllRead();
  }

  notificationKind(item: InboxNotification): string {
    const type = String(item.requestType || 'Update').replace(/([a-z])([A-Z])/g, '$1 $2');
    const status = String(item.status || '').trim();
    return status ? `${type} · ${status}` : type;
  }

  notificationIcon(item: InboxNotification): string {
    const type = String(item.requestType || '').toLowerCase();
    if (type.includes('sale')) return 'point_of_sale';
    if (type.includes('transfer')) return 'local_shipping';
    if (type.includes('stockin') || type.includes('stock-in')) return 'move_to_inbox';
    if (type.includes('stockout') || type.includes('stock-out')) return 'outbox';
    if (type.includes('return')) return 'assignment_return';
    return 'notifications';
  }

  notificationTime(value: number): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
