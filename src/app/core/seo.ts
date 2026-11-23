import { DOCUMENT, Injectable, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { I18n, Page, pathFor } from './i18n';

export const SITE = 'https://fuelapp.sa';

/** Page description = the subtitle of the page header (same text the visitor reads). */
const DESC_KEY: Partial<Record<Page, string>> = {
  about: 'about.3', services: 'services.2', platform: 'platform.3', coverage: 'coverage.3', clients: 'clients.3',
  contact: 'contact.3', privacy: 'privacy.2', terms: 'terms.3', hse: 'hse.3',
};
const HOME_DESC = {
  ar: 'فيول آب، إحدى علامات شركة ميسان: نقل وتوريد الديزل والبنزين ونقل الموارد من أرامكو للشركات والمصانع والمشاريع في الوسطى والشرقية والغربية والشمالية، مع منصة تتابع منها طلباتك وفواتيرك بلا ورق.',
  en: 'Fuel App, a Maisan Company brand: diesel and gasoline supply and Aramco resource transport for companies, factories and projects across the Central, Eastern, Western and Northern regions, with a platform to track orders and invoices, paperless.',
};

@Injectable({ providedIn: 'root' })
export class Seo {
  private i = inject(I18n);
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  constructor() {
    effect(() => this.apply(this.i.page()));
  }

  private link(rel: string, attrs: Record<string, string>) {
    const sel = Object.entries(attrs).filter(([k]) => k !== 'href').map(([k, v]) => `[${k}="${v}"]`).join('');
    let el = this.doc.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]${sel}`);
    if (!el) {
      el = this.doc.createElement('link');
      el.setAttribute('rel', rel);
      this.doc.head.appendChild(el);
    }
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  }

  private apply(page: Page) {
    const lang = this.i.lang();
    const title = this.i.c().titles[page];
    const desc = page === 'home' ? HOME_DESC[lang] : this.i.t(DESC_KEY[page]!);
    const url = SITE + pathFor(lang, page);
    const img = SITE + (lang === 'en' ? '/en' : '') + '/og-image.jpg';
    this.title.setTitle(title);
    const tags: [string, string, string][] = [
      ['name', 'description', desc],
      ['property', 'og:type', 'website'],
      ['property', 'og:site_name', lang === 'en' ? 'Fuel App' : 'فيول آب'],
      ['property', 'og:title', title],
      ['property', 'og:description', desc],
      ['property', 'og:url', url],
      ['property', 'og:locale', lang === 'en' ? 'en_US' : 'ar_SA'],
      ['property', 'og:image', img],
      ['property', 'og:image:width', '1200'],
      ['property', 'og:image:height', '630'],
      ['name', 'twitter:card', 'summary_large_image'],
    ];
    for (const [attr, key, content] of tags) this.meta.updateTag({ [attr]: key, content } as never, `${attr}="${key}"`);
    this.link('canonical', { href: url });
    this.link('alternate', { hreflang: 'ar', href: SITE + pathFor('ar', page) });
    this.link('alternate', { hreflang: 'en', href: SITE + pathFor('en', page) });
    this.link('alternate', { hreflang: 'x-default', href: SITE + pathFor('ar', page) });
  }
}
