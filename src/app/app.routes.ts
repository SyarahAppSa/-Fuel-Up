import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { I18n, PAGES, Page } from './core/i18n';

/** Each page's code is loaded only when that page is visited. */
const load: Record<Page, () => Promise<unknown>> = {
  home: () => import('./pages/pages').then((m) => m.HomePage),
  about: () => import('./pages/pages').then((m) => m.AboutPage),
  services: () => import('./pages/pages').then((m) => m.ServicesPage),
  platform: () => import('./pages/pages').then((m) => m.PlatformPage),
  coverage: () => import('./pages/pages').then((m) => m.CoveragePage),
  clients: () => import('./pages/pages').then((m) => m.ClientsPage),
  contact: () => import('./pages/pages').then((m) => m.ContactPage),
  privacy: () => import('./pages/pages').then((m) => m.PrivacyPage),
  terms: () => import('./pages/pages').then((m) => m.TermsPage),
  hse: () => import('./pages/pages').then((m) => m.HsePage),
};

/** Arabic at /<page>, English at /en/<page>. Home is / and /en. */
const pages = (prefix: string): Routes =>
  PAGES.map((p) => ({
    path: [prefix, p === 'home' ? '' : p].filter(Boolean).join('/'),
    loadComponent: load[p] as never,
    pathMatch: 'full' as const,
    /* the page's language texts are loaded before the page shows */
    canActivate: [() => inject(I18n).ensure(prefix === 'en' ? 'en' : 'ar')],
  }));

export const routes: Routes = [...pages(''), ...pages('en'), { path: '**', redirectTo: '' }];
