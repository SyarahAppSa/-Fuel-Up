import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n';
import { Icon, IconAttr } from '../shared/icon';

const OnPush = ChangeDetectionStrategy.OnPush;
const pad = (n: number) => (n < 10 ? '0' : '') + n;

/** Home: five reasons */
@Component({
  selector: '[faWhy]', imports: [Icon], changeDetection: OnPush,
  template: `@for (w of i.c().why; track w[1]; let n = $index) {<article><span class="blob"><fa-icon [name]="w[0]" [width]="1.5" /></span><small class="m">0{{ n + 1 }}</small><h3>{{ w[1] }}</h3><p>{{ w[2] }}</p></article>}`,
})
export class Why { protected i = inject(I18n); }

/** Platform features (home + platform page) */
@Component({
  selector: '[faFeat]', imports: [Icon], changeDetection: OnPush,
  template: `@for (f of i.c().feat; track f[1]) {<div><span class="ic"><fa-icon [name]="f[0]" /></span><b>{{ f[1] }}</b><span>{{ f[2] }}</span></div>}`,
})
export class Feat { protected i = inject(I18n); }

/** Illustrative app screen */
@Component({
  selector: '[data-phone]', changeDetection: OnPush, template: '',
  host: { '[innerHTML]': 'html()' },
})
export class Phone {
  protected i = inject(I18n);
  private san = inject(DomSanitizer);
  protected html = computed(() => this.san.bypassSecurityTrustHtml(this.i.c().phone));
}

/** Platform: customer journey */
@Component({
  selector: '[faJourney]', changeDetection: OnPush,
  template: `@for (j of i.c().journey; track j[0]; let n = $index) {<li><span class="n">0{{ n + 1 }}</span><h3>{{ j[0] }}</h3><p>{{ j[1] }}</p></li>}`,
})
export class Journey { protected i = inject(I18n); }

/** Services: sectors we serve */
@Component({
  selector: '[faSectList]', imports: [Icon], changeDetection: OnPush,
  template: `@for (s of i.c().sect; track s[0]) {<article class="sc"><span class="ic" [style.background]="s[2]"><fa-icon [name]="s[0]" /></span><h3>{{ s[1] }}</h3><p>{{ s[3] }}</p></article>}`,
})
export class SectList { protected i = inject(I18n); }

/** Services: full service cards */
@Component({
  selector: '[faSvcGrid]', imports: [Icon], changeDetection: OnPush,
  template: `@for (s of i.c().svc; track s.id; let n = $index) {<article class="svc-card" [id]="'svc-' + s.id"><span class="ic"><i><fa-icon [name]="s.ic" /></i></span><span class="no">0{{ n + 1 }}</span><h3>{{ s.t }}</h3><p>{{ s.d }}</p><ul>@for (x of s.li; track x) {<li>{{ x }}</li>}</ul></article>}`,
})
export class SvcGrid { protected i = inject(I18n); }

/** Services: tanker capacities */
@Component({
  selector: '[faTanks]', changeDetection: OnPush,
  template: `@for (t of i.c().tanks; track t[0]) {<div class="tank"><b class="m">{{ fmt(t[0]) }}</b><span class="u">{{ i.ui().tankUnit }}</span><span>{{ t[1] }}</span></div>}`,
})
export class Tanks { protected i = inject(I18n); protected fmt = (n: number) => n.toLocaleString('en-US'); }

/** Hero ticker (rendered twice for the seamless loop) */
@Component({
  selector: '[faTicker]', changeDetection: OnPush,
  template: `@for (t of i.c().tick; track $index) {<span>{{ t }}</span>}@for (t of i.c().tick; track $index) {<span aria-hidden="true">{{ t }}</span>}`,
})
export class Ticker { protected i = inject(I18n); }

/** Footer: first five services */
@Component({
  selector: '[faFtrSvc]', imports: [RouterLink], changeDetection: OnPush,
  template: `@for (s of list(); track s.id) {<li><a [routerLink]="i.link('services')">{{ s.t }}</a></li>}`,
})
export class FtrSvc { protected i = inject(I18n); protected list = computed(() => this.i.c().svc.slice(0, 5)); }

/** Policy body: privacy | terms | hse */
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
@Component({
  selector: '[faPolicy]', changeDetection: OnPush,
  template: `<p class="upd">{{ i.c().policyUpdated }}</p>@for (s of secs(); track $index) {<section [innerHTML]="s"></section>}`,
})
export class Policy {
  protected i = inject(I18n);
  private san = inject(DomSanitizer);
  readonly kind = input<'privacy' | 'terms' | 'hse'>('privacy', { alias: 'faPolicy' });
  /* policy bodies are our own approved static copy */
  protected secs = computed(() =>
    this.i.c().policies[this.kind()].map((s, n) => this.san.bypassSecurityTrustHtml(`<h2><span>${pad(n + 1)}</span>${esc(s[0])}</h2>${s[1]}`)),
  );
}

export const BLOCKS = [Why, Feat, Phone, Journey, SectList, SvcGrid, Tanks, Ticker, FtrSvc, Policy, IconAttr];
