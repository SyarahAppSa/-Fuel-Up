import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18n } from '../core/i18n';
import { MAP, MAP_EN } from '../data/map';

type City = { x: number; y: number; name: string; dx: number; dy: number; anchor: string; reg: string; hub: boolean };

/** Coverage map (Natural Earth admin-1, public domain). sel = highlighted region or null. */
@Component({
  selector: '[faMap]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<svg [attr.viewBox]="'-10 -10 ' + (W + 20) + ' ' + (H + 20)" direction="ltr" role="img" [attr.aria-label]="i.ui().map.aria">
  @for (k of regKeys; track k) {
    <path [attr.d]="reg[k]" [attr.fill]="rc()[k]" [attr.fill-opacity]="dim(k) ? .04 : .16" [attr.stroke]="rc()[k]" [attr.stroke-opacity]="dim(k) ? .25 : .7" stroke-width="1.2"/>
  }
  <path [attr.d]="outline" fill="none" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="1.4" stroke-linejoin="round"/>
  @for (k of dotKeys; track k) {
    <path [attr.d]="dots[k]" [attr.stroke]="rc()[k]" [attr.stroke-opacity]="k !== 'n' && dim(k) ? .3 : 1" stroke-width="3.6" stroke-linecap="round" fill="none"/>
  }
  @for (r of routes(); track $index) {
    <path [attr.d]="r.d" fill="none" [attr.stroke]="r.main ? '#FFFFFF' : '#FFC59C'" [attr.stroke-opacity]="r.main ? .55 : .95" [attr.stroke-width]="r.main ? 1.3 : 1.8" [attr.stroke-dasharray]="r.main ? '2 7' : null" [attr.stroke-linecap]="r.main ? 'round' : null"/>
  }
  @for (c of cities(); track c.name) {
    @if (c.hub) { <circle [attr.cx]="c.x" [attr.cy]="c.y" r="15" fill="#F37421" opacity=".3"/> }
    <circle [attr.cx]="c.x" [attr.cy]="c.y" [attr.r]="c.hub ? 7 : 4" [attr.fill]="c.hub ? '#F37421' : '#FFFFFF'" stroke="#0B2463" stroke-width="1.5"/>
    <text [attr.x]="c.x + c.dx" [attr.y]="c.y + c.dy" [attr.text-anchor]="c.anchor" fill="#FFFFFF" [attr.font-size]="c.hub ? 21 : 15" [attr.font-weight]="c.hub ? 700 : 500" [attr.font-family]="font()" paint-order="stroke" stroke="#0B2463" stroke-width="4">{{ c.name }}</text>
  }
  @if (!sel()) {
    @for (l of labels(); track l.name) {
      <text [attr.x]="l.x" [attr.y]="l.y" text-anchor="middle" fill="#FFFFFF" fill-opacity=".9" font-size="24" font-weight="700" [attr.font-family]="headFont()" paint-order="stroke" stroke="#0B2463" stroke-width="6">{{ l.name }}</text>
    }
  }
</svg>`,
})
export class SaMap {
  protected i = inject(I18n);
  readonly sel = input<string | null>(null, { alias: 'faMap' });
  protected W = MAP.W; protected H = MAP.H;
  protected reg = MAP.reg as Record<string, string>;
  protected dots = MAP.dots as Record<string, string>;
  protected outline = MAP.outline;
  protected regKeys = ['c', 'e', 'w', 'm'];
  protected dotKeys = ['n', 'c', 'e', 'w', 'm'];
  protected rc = computed(() => this.i.c().regionColors);
  protected font = computed(() => (this.i.lang() === 'en' ? 'IBM Plex Sans,sans-serif' : 'IBM Plex Sans Arabic,sans-serif'));
  protected headFont = computed(() => (this.i.lang() === 'en' ? 'IBM Plex Sans,sans-serif' : 'Noto Kufi Arabic,sans-serif'));
  protected dim = (k: string) => !!this.sel() && this.sel() !== k;
  private nm = (n: string) => (this.i.lang() === 'en' ? (MAP_EN[n] ?? n) : n);

  private all = computed<City[]>(() =>
    (MAP.cities as unknown as unknown[][]).map((c) => ({
      x: c[0] as number, y: c[1] as number, name: this.nm(c[2] as string), dx: c[3] as number, dy: c[4] as number,
      anchor: c[5] as string, reg: c[6] as string, hub: !!c[7],
    })),
  );
  protected cities = computed(() => this.all().filter((c) => !this.sel() || c.reg === this.sel()));
  protected labels = computed(() => (MAP.labels as unknown as unknown[][]).map((l) => ({ name: this.nm(l[1] as string), x: l[2] as number, y: l[3] as number })));
  protected routes = computed(() => {
    const P = new Map(this.all().map((c) => [c.name, c]));
    const q = (a: City, b: City, k: number) => {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
      return `M${a.x} ${a.y} Q${Math.round(mx - dy * k)} ${Math.round(my + dx * k)} ${b.x} ${b.y}`;
    };
    return this.i.c().routes
      .map((r) => ({ a: P.get(r[0] as string), b: P.get(r[1] as string), k: r[2] as number, main: !!r[3] }))
      .filter((r) => r.a && r.b && (!this.sel() || r.main || r.a!.reg === this.sel()))
      .map((r) => ({ d: q(r.a!, r.b!, r.k), main: r.main }));
  });
}
