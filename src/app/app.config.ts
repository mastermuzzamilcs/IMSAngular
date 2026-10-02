import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { WorkflowActionBootstrap } from './workflow-functions/workflow-actions';

export function registerWorkflowActions(bootstrap: WorkflowActionBootstrap): () => void {
  return () => {
    void bootstrap;
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
      deps: [WorkflowActionBootstrap],
      multi: true,
    },
  ],
};
