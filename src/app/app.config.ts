import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { I18n, langOf } from './core/i18n';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay, withIncrementalHydration } from '@angular/platform-browser';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
    /* texts for the requested language must be ready before the first render / hydration */
    provideAppInitializer(() => inject(I18n).ensure(langOf(inject(PlatformLocation).pathname))),
  ],
};
