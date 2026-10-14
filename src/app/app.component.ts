import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { GlobalSpinnerComponent } from './shared/global-spinner/global-spinner.component';
// Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LoadingService } from './core/services/Loading.service';
import { NotificationInboxService } from './core/notifications/notification-inbox.service';
import {
  notificationSounds,
  NotificationSoundId,
  NotificationSoundService,
} from './core/notifications/notification-sound.service';
import { InboxNotification } from './core/notifications/notification.model';
import { PrivilegeRef, privileges as privilegeAccess } from './core/auth/privilege-catalog';
import { PrivilegeDirective } from './core/auth/privilege.directive';
import { AuthService } from './core/services/auth.service';

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
    GlobalSpinnerComponent,
    MatExpansionModule,
    MatBadgeModule,
    MatSlideToggleModule,
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
  notifications$;
  unreadCount$;
  readonly sounds = notificationSounds;
  soundEnabled$;
  soundId$;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private loadingService: LoadingService,
    private auth: AuthService,
    private inbox: NotificationInboxService,
    private sound: NotificationSoundService,
  ) {
    this.session$ = this.auth.session$;
    this.notifications$ = this.inbox.items$;
    this.unreadCount$ = this.inbox.unreadCount$;
    this.soundEnabled$ = this.sound.enabled$;
    this.soundId$ = this.sound.soundId$;
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
      if (event instanceof NavigationStart) {
        this.loadingService.show();
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loadingService.hide();
      }
    });
  }

  hasAny(items: PrivilegeRef[]): boolean {
    return items.some((item) => this.auth.hasPrivilege(item.moduleId, item.functionId));
  }

  toggleSidenav(): void {
    this.drawer?.toggle();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }

  switchBranch(branchid: string): void {
    this.auth.selectBranch(branchid);
  }

  setNotificationSound(enabled: boolean): void {
    this.sound.setEnabled(enabled);
  }

  chooseNotificationSound(id: NotificationSoundId): void {
    this.sound.setSound(id, true);
  }

  openNotification(item: InboxNotification): void {
    if (!item.read) {
      void this.inbox.markRead(item.id);
    }
  }

  markAllRead(): void {
    void this.inbox.markAllRead();
  }
}
