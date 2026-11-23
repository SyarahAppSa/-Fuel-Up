import { RenderMode, ServerRoute } from '@angular/ssr';
import { PAGES } from './core/i18n';

/** Every page in both languages is prerendered to static HTML at build time. */
const paths = [...PAGES.map((p) => (p === 'home' ? '' : p)), ...PAGES.map((p) => (p === 'home' ? 'en' : 'en/' + p))];

export const serverRoutes: ServerRoute[] = [
  ...paths.map((path) => ({ path, renderMode: RenderMode.Prerender as const })),
  { path: '**', renderMode: RenderMode.Client },
];
