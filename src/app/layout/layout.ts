import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { I18n } from '../core/i18n';
import { IconAttr } from '../shared/icon';
import { Logos } from '../shared/logos';
import { FtrSvc } from '../features/blocks';

const OnPush = ChangeDetectionStrategy.OnPush;
const host = { style: 'display:contents' };

/** Utility bar: Gregorian · Hijri date, contacts, WhatsApp, client login, language */
@Component({ selector: 'fa-topbar', host, changeDetection: OnPush, templateUrl: './topbar.html', imports: [RouterLink] })
export class Topbar {
  protected i = inject(I18n);
  /** filled in the browser only, so the prerendered HTML never carries a stale build date */
  protected today = signal('');
  private router = inject(Router);
  constructor() {
    afterNextRender(() => {
      const fmt = () => {
        const dt = new Date();
        try {
          if (this.i.lang() === 'en') {
            const gp: Record<string, string> = {};
            new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(dt).forEach((x) => (gp[x.type] = x.value));
            let hj = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(dt);
            if (!/AH/.test(hj)) hj += ' AH';
            return `${gp['weekday']}, ${gp['day']} ${gp['month']} ${gp['year']} · ${hj}`;
          }
          return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dt) +
            ' · ' + new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(dt);
        } catch { return ''; }
      };
      this.today.set(fmt());
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.today.set(fmt()));
    });
  }
  protected remember() { try { localStorage.setItem('fa_lang', this.i.other()); } catch { /* storage blocked */ } }
}

/** Main header: brand, navigation (burger on small screens), quote CTA */
@Component({
  selector: 'fa-header', host: { ...host, '(document:keydown.escape)': 'esc()' }, changeDetection: OnPush,
  templateUrl: './header.html', imports: [RouterLink, RouterLinkActive],
})
export class Header {
  protected i = inject(I18n);
  protected open = signal(false);
  private burger = viewChild<ElementRef<HTMLButtonElement>>('burger');
  constructor() {
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.open.set(false));
  }
  protected esc() { if (this.open()) { this.open.set(false); this.burger()?.nativeElement.focus(); } }
}

@Component({ selector: 'fa-page-end', host, changeDetection: OnPush, templateUrl: './page-end.html', imports: [RouterLink, Logos] })
export class PageEnd { protected i = inject(I18n); }

@Component({ selector: 'fa-footer', host, changeDetection: OnPush, templateUrl: './footer.html', imports: [RouterLink, FtrSvc] })
export class Footer { protected i = inject(I18n); }

/** Floating WhatsApp button + mobile «request a quote» bar */
@Component({ selector: 'fa-wa-fab', host, changeDetection: OnPush, templateUrl: './wa-fab.html', imports: [RouterLink] })
export class WaFab { protected i = inject(I18n); }

export const LAYOUT = [Topbar, Header, PageEnd, Footer, WaFab, IconAttr];
