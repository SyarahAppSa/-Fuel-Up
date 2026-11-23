import { ChangeDetectionStrategy, Component, DOCUMENT, afterNextRender, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { I18n, pathFor } from './core/i18n';
import { Seo } from './core/seo';
import { Footer, Header, PageEnd, Topbar, WaFab } from './layout/layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Topbar, Header, PageEnd, Footer, WaFab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents', '(document:click)': 'intent($event)' },
  template: `<fa-topbar />
<fa-header />
<main id="main" tabindex="-1">
  <router-outlet />
  <fa-page-end />
</main>
<fa-footer />
<fa-wa-fab />`,
})
export class App {
  private i = inject(I18n);
  private doc = inject(DOCUMENT);
  private router = inject(Router);
  constructor() {
    inject(Seo);
    /* after an in-app navigation, move keyboard focus to the new page content */
    afterNextRender(() => {
      let first = true;
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
        if (first) { first = false; return; }
        this.doc.getElementById('main')?.focus({ preventScroll: true });
      });
    });
  }
  /** Links to the contact page say which form the visitor wants (quote or general contact) */
  protected intent(ev: Event) {
    const a = (ev.target as HTMLElement | null)?.closest?.('a');
    if (!a) return;
    const contact = pathFor(this.i.lang(), 'contact');
    if (a.getAttribute('href') !== contact) return;
    this.i.formIntent.set(/تواصل|contact/i.test(a.textContent ?? '') ? 'contact' : 'quote');
  }
}
