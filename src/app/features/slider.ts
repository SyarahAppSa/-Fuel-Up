import { DestroyRef, Directive, PLATFORM_ID, afterNextRender, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Hero carousel state: put [faSlider] on the slider section and bind slides/dots/buttons to it. */
@Directive({
  selector: '[faSlider]',
  exportAs: 'slider',
  host: { '(mouseenter)': 'hold()', '(mouseleave)': 'play()', '(focusin)': 'hold()' },
})
export class Slider {
  readonly n = 3;
  readonly cur = signal(0);
  readonly paused = signal(false);
  private timer: ReturnType<typeof setInterval> | undefined;
  private reduce = false;
  private browser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    afterNextRender(() => {
      this.reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (this.reduce) this.paused.set(true);
      this.play();
    });
    inject(DestroyRef).onDestroy(() => this.hold());
  }

  go(i: number) { this.cur.set((i + this.n) % this.n); }
  next() { this.go(this.cur() + 1); this.play(); }
  prev() { this.go(this.cur() - 1); this.play(); }
  dot(i: number) { this.go(i); this.play(); }
  toggle() { this.paused.update((p) => !p); this.play(); }
  hold() { clearInterval(this.timer); }
  play() {
    this.hold();
    if (this.browser && !this.paused() && !this.reduce) this.timer = setInterval(() => this.go(this.cur() + 1), 7000);
  }
}
