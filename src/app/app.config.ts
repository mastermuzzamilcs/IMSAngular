import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MxThemeService } from '@mesix/theme';

import { routes } from './app.routes';
import { NotificationChannelBootstrap } from './core/notifications/notification-channel.bootstrap';
import { RequestTypeService } from './core/services/request-type.service';
import { RoleService } from './core/services/role.service';
import { UsersService } from './core/services/users.service';
import { WorkflowActionBootstrap } from './workflow-functions/workflow-actions';
import { initializeMesixTheme } from './core/theme/mesix-theme.initializer';

export function registerWorkflowActions(
  bootstrap: WorkflowActionBootstrap,
  notifications: NotificationChannelBootstrap,
): () => void {
  return () => {
    void bootstrap;
    void notifications;
  };
}

export function seedSystemRecords(
  users: UsersService,
  requestTypes: RequestTypeService,
  roles: RoleService,
): () => Promise<void> {
  return async () => {
    try {
      await Promise.all([
        users.ensureSystemUser(),
        requestTypes.ensureDefaults(),
        roles.ensureRoles(),
      ]);
    } catch (error) {
      console.error('System seed failed', error);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNativeDateAdapter(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMesixTheme,
      deps: [MxThemeService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: registerWorkflowActions,
      deps: [WorkflowActionBootstrap, NotificationChannelBootstrap],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: seedSystemRecords,
      deps: [UsersService, RequestTypeService, RoleService],
      multi: true,
    },
  ],
};
