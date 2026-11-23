import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n';

export const WA_NUMBER = '966920009088';
const FIELDS = ['company', 'name', 'mobile', 'email', 'city', 'sector', 'volume', 'service', 'details'] as const;
type Field = (typeof FIELDS)[number];
type Values = Record<Field, string> & { ok: boolean };
type Errors = Partial<Record<Field | 'ok', string>>;

/** Saudi mobile in any common form (+966, 00966, 966, 5XXXXXXXX, Arabic-Indic digits) → 05XXXXXXXX */
export function normMobile(v: string): string {
  return v
    .replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))
    .replace(/[\s\-().]/g, '')
    .replace(/^(\+966|00966|966)/, '0')
    .replace(/^5(\d{8})$/, '05$1');
}

/**
 * Operational quote / contact form. Nothing is sent from the website: the visitor's WhatsApp opens with a
 * ready-made message to Fuel App, and nothing is delivered until they press «Send» there.
 */
@Component({
  selector: 'form[faQuoteForm]',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quote-form.html',
  host: { '(submit)': 'submit($event)', '(focusin)': 'started()' },
})
export class QuoteForm {
  protected i = inject(I18n);
  private host = inject<ElementRef<HTMLFormElement>>(ElementRef);
  private hp = viewChild.required<ElementRef<HTMLInputElement>>('hp');

  protected v = signal<Values>({ company: '', name: '', mobile: '', email: '', city: '', sector: '', volume: '', service: '', details: '', ok: false });
  protected err = signal<Errors>({});
  protected status = signal<{ kind: 'ok' | 'bad'; text: string; url?: string } | null>(null);
  protected busy = signal(false);

  constructor() {
    afterNextRender(() => {
      /* remember where the visitor came from (campaign tag or referring site) for the message footer */
      try {
        const p = new URLSearchParams(location.search);
        const u = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => p.get(k)).filter(Boolean).join(' / ');
        if (u && !sessionStorage.getItem('fa_src')) sessionStorage.setItem('fa_src', u);
        if (!sessionStorage.getItem('fa_ref')) {
          let rf = '';
          try { rf = document.referrer && new URL(document.referrer).hostname !== location.hostname ? new URL(document.referrer).hostname : ''; } catch { rf = ''; }
          sessionStorage.setItem('fa_ref', rf || '-');
        }
      } catch { /* storage blocked: source falls back to «direct» */ }
    });
  }

  protected started() { /* hook kept for analytics parity; no tracking is done */ }

  protected set(f: Field, value: string) {
    this.v.update((x) => ({ ...x, [f]: value }));
    if (this.err()[f]) this.check(f);
  }
  protected setOk(ok: boolean) { this.v.update((x) => ({ ...x, ok })); this.check('ok'); }
  protected blur(f: Field) { if (this.v()[f]) this.check(f); }

  private message(f: Field | 'ok'): string {
    const m = this.i.ui().form;
    if (f === 'ok') return this.v().ok ? '' : m.consent;
    const val = (this.v()[f] || '').trim();
    if (!val) return m.required;
    if (f === 'mobile' && !/^05\d{8}$/.test(normMobile(val))) return m.mobile;
    if (f === 'email' && !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(val)) return m.email;
    if (f === 'details' && val.length < 10) return m.details;
    return '';
  }
  private check(f: Field | 'ok'): boolean {
    const msg = this.message(f);
    this.err.update((e) => ({ ...e, [f]: msg }));
    return !msg;
  }

  private source(): string {
    const m = this.i.ui().form;
    try {
      const s = sessionStorage.getItem('fa_src');
      if (s) return s;
      const r = sessionStorage.getItem('fa_ref');
      return r && r !== '-' ? m.referral + r : m.direct;
    } catch { return m.direct; }
  }

  private waText(): string {
    const m = this.i.ui().form, v = this.v(), L: string[] = [];
    L.push(m.greeting + (this.i.formIntent() === 'contact' ? m.wantContact : m.wantQuote));
    L.push('');
    const rows: [string, Field][] = [
      [m.labels.company, 'company'], [m.labels.name, 'name'], [m.labels.mobile, 'mobile'], [m.labels.email, 'email'],
      [m.labels.city, 'city'], [m.labels.sector, 'sector'], [m.labels.volume, 'volume'], [m.labels.service, 'service'],
    ];
    for (const [label, f] of rows) L.push('*' + label + ':* ' + (f === 'mobile' ? normMobile(v[f].trim()) : v[f].trim()));
    L.push(m.detailsLabel);
    L.push(v.details.trim());
    L.push('');
    const src = this.source();
    L.push(m.footer + (src !== m.direct ? ' (' + src + ')' : ''));
    return L.join('\n');
  }

  protected submit(ev: Event) {
    ev.preventDefault();
    this.status.set(null);
    if (this.hp().nativeElement.value) return; /* honeypot: bots fill hidden fields */
    const bad = [...FIELDS, 'ok' as const].filter((f) => !this.check(f));
    if (bad.length) {
      this.status.set({ kind: 'bad', text: this.i.ui().form.review });
      this.host.nativeElement.querySelector<HTMLElement>('#q-' + (bad[0] === 'ok' ? 'ok' : bad[0]))?.focus();
      return;
    }
    if (this.busy()) return;
    this.busy.set(true); /* one WhatsApp window per press, even on repeated taps */
    setTimeout(() => this.busy.set(false), 4000);
    const url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(this.waText());
    let w: Window | null = null;
    try { w = window.open(url, '_blank'); if (w) w.opener = null; } catch { w = null; }
    if (!w) location.href = url;
    this.status.set({ kind: 'ok', text: this.i.ui().form.sent, url });
  }
}
