import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_PAGINATOR_DEFAULT_OPTIONS } from '@angular/material/paginator';

import { routes } from './app.routes';
import { NotificationChannelBootstrap } from './core/notifications/notification-channel.bootstrap';
import {
  AppSettingsService,
  PAGE_SIZE_OPTIONS,
} from './core/services/app-settings.service';
import { RequestTypeService } from './core/services/request-type.service';
import { RoleService } from './core/services/role.service';
import { UsersService } from './core/services/users.service';
import { WorkflowActionBootstrap } from './workflow-functions/workflow-actions';

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
      provide: MAT_PAGINATOR_DEFAULT_OPTIONS,
      useFactory: (settings: AppSettingsService) => ({
        get pageSize() {
          return settings.pageSize;
        },
        pageSizeOptions: [...PAGE_SIZE_OPTIONS],
      }),
      deps: [AppSettingsService],
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
