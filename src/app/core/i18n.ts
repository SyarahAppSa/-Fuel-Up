import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { STRINGS_AR } from '../i18n/strings.ar';
import { STRINGS_EN } from '../i18n/strings.en';
import { UI_AR, UI_EN, UiStrings } from '../i18n/ui';
import { CONTENT_AR } from '../data/content.ar';
import { CONTENT_EN } from '../data/content.en';
import type { SiteContent } from '../data/content.types';

export type Lang = 'ar' | 'en';
export const PAGES = ['home', 'about', 'services', 'platform', 'coverage', 'clients', 'contact', 'privacy', 'terms', 'hse'] as const;
export type Page = (typeof PAGES)[number];

/** Path of a page in a language: ar → /services, en → /en/services; home → / or /en */
export function pathFor(lang: Lang, page: Page): string {
  const base = lang === 'en' ? '/en' : '';
  return page === 'home' ? base || '/' : `${base}/${page}`;
}

function parse(url: string): { lang: Lang; page: Page } {
  const clean = url.split(/[?#]/)[0].replace(/\/+$/, '');
  const parts = clean.split('/').filter(Boolean);
  const lang: Lang = parts[0] === 'en' ? 'en' : 'ar';
  const rest = lang === 'en' ? parts.slice(1) : parts;
  const page = (PAGES as readonly string[]).includes(rest[0] ?? 'home') ? ((rest[0] ?? 'home') as Page) : 'home';
  return { lang, page };
}

@Injectable({ providedIn: 'root' })
export class I18n {
  private router = inject(Router);
  private doc = inject(DOCUMENT);

  readonly lang = signal<Lang>('ar');
  readonly page = signal<Page>('home');
  /** Which call-to-action brought the visitor to the contact form */
  readonly formIntent = signal<'quote' | 'contact'>('quote');

  readonly strings = computed(() => (this.lang() === 'en' ? STRINGS_EN : STRINGS_AR));
  readonly ui = computed<UiStrings>(() => (this.lang() === 'en' ? UI_EN : UI_AR));
  readonly c = computed<SiteContent>(() => (this.lang() === 'en' ? CONTENT_EN : CONTENT_AR));
  readonly dir = computed(() => (this.lang() === 'en' ? 'ltr' : 'rtl'));
  readonly other = computed<Lang>(() => (this.lang() === 'en' ? 'ar' : 'en'));

  constructor() {
    const apply = (url: string) => {
      const p = parse(url);
      this.lang.set(p.lang);
      this.page.set(p.page);
    };
    apply(this.router.url);
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => apply(e.urlAfterRedirects));
    effect(() => {
      const html = this.doc.documentElement;
      html.lang = this.lang();
      html.dir = this.dir();
    });
  }

  t(key: string): string {
    return this.strings()[key] ?? key;
  }

  link(page: Page | string): string {
    return pathFor(this.lang(), page as Page);
  }

  /** Same page in the other language */
  altLink(): string {
    return pathFor(this.other(), this.page());
  }
}
