import { ApplicationConfig, ErrorHandler, Injectable, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling, withPreloading, PreloadAllModules } from '@angular/router';

import { routes } from './app.routes';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const err = error as any;
    const combinedMsg = [
      err?.message,
      err?.rejection?.message,
      err?.rejection?.stack,
      err?.stack,
      String(err?.rejection || ''),
      String(error || ''),
    ].filter(Boolean).join(' ');

    const chunkFailedPattern = /Failed to fetch dynamically imported module|Loading chunk|ERR_ABORTED|chunk-[A-Za-z0-9_-]+\.js/i;
    if (chunkFailedPattern.test(combinedMsg)) {
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        const now = Date.now();
        const lastReload = parseInt(sessionStorage.getItem('chunk_reload_time') || '0', 10);
        if (now - lastReload > 6000) {
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
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withPreloading(PreloadAllModules)
    )
  ]
};
