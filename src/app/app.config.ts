import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MxThemeService } from '@mesix/theme';

import { routes } from './app.routes';
import { WorkflowActionBootstrap } from './workflow-functions/workflow-actions';
import { initializeMesixTheme } from './core/theme/mesix-theme.initializer';

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
      useFactory: initializeMesixTheme,
      deps: [MxThemeService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: registerWorkflowActions,
      deps: [WorkflowActionBootstrap],
      multi: true,
    },
  ],
};
