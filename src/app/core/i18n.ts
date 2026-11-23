import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import type { UiStrings } from '../i18n/ui';
import type { SiteContent } from '../data/content.types';
import { LangPack, PACK_LOADERS } from '../i18n/pack';

export type Lang = 'ar' | 'en';
export const PAGES = ['home', 'about', 'services', 'platform', 'coverage', 'clients', 'contact', 'privacy', 'terms', 'hse'] as const;
export type Page = (typeof PAGES)[number];

/** Path of a page in a language: ar → /services, en → /en/services; home → / or /en */
export function pathFor(lang: Lang, page: Page): string {
  const base = lang === 'en' ? '/en' : '';
  return page === 'home' ? base || '/' : `${base}/${page}`;
}

export function langOf(url: string): Lang { return parse(url).lang; }

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

  private packs = signal<Partial<Record<Lang, LangPack>>>({});
  private pack = computed(() => this.packs()[this.lang()] ?? this.packs()[this.other()]!);
  readonly strings = computed(() => this.pack().strings);
  readonly ui = computed<UiStrings>(() => this.pack().ui);
  readonly c = computed<SiteContent>(() => this.pack().content);
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

  /** Load a language's texts (once). Called before the first render and before switching language. */
  async ensure(lang: Lang): Promise<true> {
    if (!this.packs()[lang]) {
      const p = await PACK_LOADERS[lang]();
      this.packs.update((x) => ({ ...x, [lang]: p }));
    }
    return true;
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
