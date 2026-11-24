import { DOCUMENT, Injectable, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { I18n, Lang, Page, pathFor } from './i18n';

export const SITE = 'https://fuelapp.sa';

/**
 * Public address of a page exactly as the web server serves it (folders end with «/»:
 * /services/ , /en/ , /en/services/). Canonical, hreflang, og:url and the sitemap all use this form.
 */
export function pageUrl(lang: Lang, page: Page): string {
  const p = pathFor(lang, page);
  return SITE + (p === '/' ? '/' : p + '/');
}

/** Page description = the subtitle of the page header (same text the visitor reads). */
const DESC_KEY: Partial<Record<Page, string>> = {
  about: 'about.3', services: 'services.2', platform: 'platform.3', coverage: 'coverage.3', clients: 'clients.3',
  contact: 'contact.3', privacy: 'privacy.2', terms: 'terms.3', hse: 'hse.3',
};
const HOME_DESC = {
  ar: 'فيول آب، إحدى علامات شركة ميسان: نقل وتوريد الديزل والبنزين ونقل الموارد من أرامكو للشركات والمصانع والمشاريع في الوسطى والشرقية والغربية والشمالية، مع منصة تتابع منها طلباتك وفواتيرك بلا ورق.',
  en: 'Fuel App, a Maisan Company brand: diesel and gasoline supply and Aramco resource transport for companies, factories and projects across the Central, Eastern, Western and Northern regions, with a platform to track orders and invoices, paperless.',
};

/** Company facts used in structured data: only details published on the site itself. */
const ORG_ID = SITE + '/#organization';
function organization(lang: Lang) {
  const en = lang === 'en';
  return {
    '@type': ['Organization', 'LocalBusiness'],
    '@id': ORG_ID,
    name: en ? 'Fuel App' : 'فيول آب',
    alternateName: en ? ['فيول آب', 'FuelApp'] : ['Fuel App', 'FuelApp'],
    url: SITE + '/',
    logo: SITE + '/assets/logo-color.webp',
    image: SITE + (en ? '/en' : '') + '/og-image.jpg',
    description: HOME_DESC[lang],
    email: 'Info@Fuelapp.sa',
    telephone: '+966920009088',
    parentOrganization: { '@type': 'Organization', name: en ? 'Maisan Company' : 'شركة ميسان' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: en ? 'Street 92, behind Kingdom Tower, Al Olaya' : 'شارع 92، خلف برج المملكة، حي العليا',
      addressLocality: en ? 'Riyadh' : 'الرياض',
      addressCountry: 'SA',
    },
    areaServed: { '@type': 'Country', name: en ? 'Saudi Arabia' : 'المملكة العربية السعودية' },
    contactPoint: [
      { '@type': 'ContactPoint', telephone: '+966920009088', contactType: 'customer service', availableLanguage: ['ar', 'en'], areaServed: 'SA' },
      { '@type': 'ContactPoint', telephone: '+966500244460', contactType: 'sales', availableLanguage: ['ar', 'en'], areaServed: 'SA' },
    ],
  };
}

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

  /** schema.org JSON-LD (read by Google, Bing and AI assistants that browse the web) */
  private jsonLd(page: Page, lang: Lang, title: string, desc: string, url: string) {
    const en = lang === 'en';
    const name = title.split(' | ')[0];
    const graph: Record<string, unknown>[] = [
      organization(lang),
      { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: en ? 'Fuel App' : 'فيول آب', inLanguage: ['ar', 'en'], publisher: { '@id': ORG_ID } },
      {
        '@type': page === 'contact' ? 'ContactPage' : page === 'about' ? 'AboutPage' : 'WebPage',
        '@id': url + '#webpage', url, name: title, description: desc, inLanguage: lang,
        isPartOf: { '@id': SITE + '/#website' }, about: { '@id': ORG_ID },
      },
    ];
    if (page !== 'home') {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: en ? 'Home' : 'الرئيسية', item: pageUrl(lang, 'home') },
          { '@type': 'ListItem', position: 2, name, item: url },
        ],
      });
    }
    if (page === 'home' || page === 'services') {
      graph.push({
        '@type': 'ItemList',
        name: en ? 'Fuel App services' : 'خدمات فيول آب',
        itemListElement: this.i.c().svc.map((s, n) => ({
          '@type': 'ListItem', position: n + 1,
          item: { '@type': 'Service', name: s.t, description: s.d, provider: { '@id': ORG_ID }, areaServed: { '@type': 'Country', name: en ? 'Saudi Arabia' : 'المملكة العربية السعودية' } },
        })),
      });
    }
    let el = this.doc.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]#fa-ld');
    if (!el) {
      el = this.doc.createElement('script');
      el.setAttribute('type', 'application/ld+json');
      el.id = 'fa-ld';
      this.doc.head.appendChild(el);
    }
    el.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  }

  private apply(page: Page) {
    const lang = this.i.lang();
    const title = this.i.c().titles[page];
    const desc = page === 'home' ? HOME_DESC[lang] : this.i.t(DESC_KEY[page]!);
    const url = pageUrl(lang, page);
    const img = SITE + (lang === 'en' ? '/en' : '') + '/og-image.jpg';
    this.title.setTitle(title);
    const tags: [string, string, string][] = [
      ['name', 'description', desc],
      ['name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1'],
      ['property', 'og:type', 'website'],
      ['property', 'og:site_name', lang === 'en' ? 'Fuel App' : 'فيول آب'],
      ['property', 'og:title', title],
      ['property', 'og:description', desc],
      ['property', 'og:url', url],
      ['property', 'og:locale', lang === 'en' ? 'en_US' : 'ar_SA'],
      ['property', 'og:locale:alternate', lang === 'en' ? 'ar_SA' : 'en_US'],
      ['property', 'og:image', img],
      ['property', 'og:image:width', '1200'],
      ['property', 'og:image:height', '630'],
      ['name', 'twitter:card', 'summary_large_image'],
    ];
    for (const [attr, key, content] of tags) this.meta.updateTag({ [attr]: key, content } as never, `${attr}="${key}"`);
    this.link('canonical', { href: url });
    this.link('alternate', { hreflang: 'ar', href: pageUrl('ar', page) });
    this.link('alternate', { hreflang: 'en', href: pageUrl('en', page) });
    this.link('alternate', { hreflang: 'x-default', href: pageUrl('ar', page) });
    this.jsonLd(page, lang, title, desc, url);
  }
}
