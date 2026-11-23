import { ChangeDetectionStrategy, Component, HostAttributeToken, computed, inject } from '@angular/core';
import { I18n } from '../core/i18n';

/** Logo wall: <div class="..." data-logos="clients|projects|permits"></div> */
@Component({
  selector: '[data-logos]',
  template: `@for (l of list(); track l[0]) {<div class="logo"><img [src]="'/assets/logos/' + l[0] + '.webp'" [alt]="l[1]" loading="lazy" decoding="async"></div>}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logos {
  private i = inject(I18n);
  private kind = inject(new HostAttributeToken('data-logos')) as 'clients' | 'projects' | 'permits';
  protected list = computed(() => this.i.c().logos[this.kind] ?? []);
}

/** Endless client logo marquee (list rendered twice for the seamless loop) */
@Component({
  selector: '[faMarquee]',
  template: `@for (l of list(); track $index) {<div class="logo"><img [src]="'/assets/logos/' + l[0] + '.webp'" [alt]="l[1]" loading="lazy" decoding="async"></div>}
@for (l of list(); track $index) {<div class="logo" aria-hidden="true"><img [src]="'/assets/logos/' + l[0] + '.webp'" alt="" loading="lazy" decoding="async"></div>}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Marquee {
  private i = inject(I18n);
  protected list = computed(() => this.i.c().logos.clients);
}
