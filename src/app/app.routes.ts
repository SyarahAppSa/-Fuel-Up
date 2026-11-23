import { Routes } from '@angular/router';
import { PAGES, Page } from './core/i18n';
import {
  AboutPage, ClientsPage, ContactPage, CoveragePage, HomePage, HsePage, PlatformPage, PrivacyPage, ServicesPage, TermsPage,
} from './pages/pages';

const COMPONENT: Record<Page, unknown> = {
  home: HomePage, about: AboutPage, services: ServicesPage, platform: PlatformPage, coverage: CoveragePage,
  clients: ClientsPage, contact: ContactPage, privacy: PrivacyPage, terms: TermsPage, hse: HsePage,
};

/** Arabic at /<page>, English at /en/<page>. Home is / and /en. */
const pages = (prefix: string): Routes =>
  PAGES.map((p) => ({ path: [prefix, p === 'home' ? '' : p].filter(Boolean).join('/'), component: COMPONENT[p] as never, pathMatch: 'full' as const }));

export const routes: Routes = [...pages(''), ...pages('en'), { path: '**', redirectTo: '' }];
