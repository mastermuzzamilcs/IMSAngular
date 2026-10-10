import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { NotificationChannelBootstrap } from './core/notifications/notification-channel.bootstrap';
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNativeDateAdapter(),
    {
      provide: APP_INITIALIZER,
      useFactory: registerWorkflowActions,
      deps: [WorkflowActionBootstrap, NotificationChannelBootstrap],
      multi: true,
    },
  ],
};
