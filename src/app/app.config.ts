import { ApplicationConfig, ErrorHandler, Injectable, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const errStr = error instanceof Error ? error.message : String(error);
    const chunkFailedPattern = /Failed to fetch dynamically imported module|Loading chunk|ERR_ABORTED/i;
    if (chunkFailedPattern.test(errStr)) {
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        const now = Date.now();
        const lastReload = parseInt(sessionStorage.getItem('chunk_reload_time') || '0', 10);
        if (now - lastReload > 10000) {
          sessionStorage.setItem('chunk_reload_time', String(now));
          window.location.reload();
          return;
        }
      }
    }
    console.error(error);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    )
  ]
};
