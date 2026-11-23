import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n';
import { Icon } from '../shared/icon';

/** Home: services list (tabs) with a detail panel. Arrow keys move between tabs (direction-aware). */
@Component({
  selector: '[faSvcTabs]',
  imports: [Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="svc-list" role="tablist" [attr.aria-label]="i.t('home.56')" id="svcList">
  @for (s of i.c().svc; track s.id; let n = $index) {
    <button class="svc-btn" role="tab" type="button" [id]="'svt-' + n" aria-controls="svcPanel" [attr.aria-selected]="n === si()" [attr.tabindex]="n === si() ? 0 : -1"
      (click)="pick(n, false)" (keydown)="key($event, n)">
      <span class="ic"><fa-icon [name]="s.ic" /></span><span><b>{{ s.t }}</b><small>{{ s.s }}</small></span><span class="chev" aria-hidden="true">←</span>
    </button>
  }
</div>
<div class="svc-panel" id="svcPanel" role="tabpanel" aria-live="polite" [attr.aria-labelledby]="'svt-' + si()">
  <p class="big">{{ cur().big[0] }}<br><span>{{ cur().big[1] }}</span></p>
  <p>{{ cur().d }}</p>
  <ul>@for (x of cur().li; track x) {<li>{{ x }}</li>}</ul>
  <a class="btn btn-o" [routerLink]="i.link('contact')">{{ i.c().svcCta }}{{ cur().t }}</a>
</div>`,
})
export class SvcTabs {
  protected i = inject(I18n);
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  protected si = signal(0);
  protected cur = computed(() => this.i.c().svc[this.si()]);

  protected pick(n: number, focus: boolean) {
    this.si.set(n);
    if (focus) queueMicrotask(() => this.el.nativeElement.querySelector<HTMLElement>('#svt-' + n)?.focus());
  }

  protected key(ev: KeyboardEvent, n: number) {
    const len = this.i.c().svc.length;
    const fwd = this.i.dir() === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const back = this.i.dir() === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (ev.key === 'ArrowDown' || ev.key === fwd) { ev.preventDefault(); this.pick((n + 1) % len, true); }
    else if (ev.key === 'ArrowUp' || ev.key === back) { ev.preventDefault(); this.pick((n - 1 + len) % len, true); }
  }
}
