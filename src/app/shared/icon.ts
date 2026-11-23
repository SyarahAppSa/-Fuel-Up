import { ChangeDetectionStrategy, Component, HostAttributeToken, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICON, OPS_ICON } from '../data/icons';

/** Inline line icon: <i data-ic="truck"></i> (static markup) or <fa-icon [name]="x" /> (dynamic). */
function svg(paths: string, w: number) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

@Component({
  selector: 'i[data-ic]',
  template: '',
  host: { '[innerHTML]': 'html' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconAttr {
  private name = inject(new HostAttributeToken('data-ic'));
  protected html = inject(DomSanitizer).bypassSecurityTrustHtml(svg(ICON[this.name] ?? '', 1.7));
}

@Component({
  selector: 'fa-icon',
  template: '',
  host: { '[innerHTML]': 'html()', style: 'display:contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<string>();
  readonly width = input(1.7);
  readonly set = input<'site' | 'ops'>('site');
  private san = inject(DomSanitizer);
  protected html = computed(() => this.san.bypassSecurityTrustHtml(svg((this.set() === 'ops' ? OPS_ICON : ICON)[this.name()] ?? '', this.width())));
}
