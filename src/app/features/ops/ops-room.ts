import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, PLATFORM_ID, afterNextRender, computed, inject, signal, viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { I18n } from '../../core/i18n';
import { Icon } from '../../shared/icon';
import type { FuelSim } from './fuel-sim';

type SectorKey = 'c' | 'f' | 'l';
const KEYS: SectorKey[] = ['c', 'f', 'l'];
/** ops stage → simulator stage, and how long each stage plays when the 3D view is running (ms) */
const SIMMAP = [0, 0, 1, 2, 3, 4];
const PLAYDUR = [3000, 6500, 5500, 9500, 12500, 5500];
const SHOTS = ['aramco-tankers', 'fleet-yard', 'site-supply', 'safety-unloading'];

/** «Fuel App Operations Room»: illustrative supply journey per sector, with a 3D tanker simulation. */
@Component({
  selector: 'fa-ops-room',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ops-room.html',
})
export class OpsRoom {
  protected i = inject(I18n);
  private destroyRef = inject(DestroyRef);
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private simHost = viewChild.required<ElementRef<HTMLElement>>('simHost');

  protected keys = KEYS;
  protected shots = SHOTS;
  protected sec = signal<SectorKey>('c');
  protected st = signal(0);
  protected view = signal<'3d' | 'img'>('3d');
  protected no3d = signal(false);
  protected playing = signal(false);

  protected ops = computed(() => this.i.c().ops);
  protected ui = computed(() => this.i.ui().ops);
  protected sector = computed(() => this.ops().sectors[this.sec()]);
  protected stage = computed(() => this.ops().stages[this.st()]);

  private sim: FuelSim | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private reduce = false;

  constructor() {
    afterNextRender(() => {
      this.reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const el = this.simHost().nativeElement;
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { io.disconnect(); this.boot3d(); } }, { rootMargin: '300px' });
        io.observe(el);
        this.destroyRef.onDestroy(() => io.disconnect());
      } else this.boot3d();
    });
    this.destroyRef.onDestroy(() => { this.stop(); this.sim?.destroy(); });
  }

  private async boot3d() {
    let ok = false;
    try { const c = document.createElement('canvas'); ok = !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch { ok = false; }
    if (!ok) { this.no3d.set(true); return; }
    try {
      const [THREE, ctl, mod] = await Promise.all([
        import('three'),
        import('three/examples/jsm/controls/OrbitControls.js'),
        import('./fuel-sim'),
      ]);
      this.sim = mod.initFuelSim(this.simHost().nativeElement, THREE, ctl.OrbitControls, this.ui());
      this.sim.go(SIMMAP[this.st()], this.st() === 0);
    } catch {
      this.no3d.set(true);
    }
  }

  private sync() { this.sim?.go(SIMMAP[this.st()], this.st() === 0); }

  protected pickSector(k: SectorKey, focus = false) {
    this.stop();
    this.sec.set(k);
    this.st.set(0);
    this.sync();
    if (focus) queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('#ops-t-' + k)?.focus());
  }

  protected sectorKey(ev: KeyboardEvent) {
    const fwd = this.i.dir() === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const back = this.i.dir() === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    const d = ev.key === fwd ? 1 : ev.key === back ? -1 : 0;
    if (!d) return;
    ev.preventDefault();
    const n = KEYS.length, i = KEYS.indexOf(this.sec());
    this.pickSector(KEYS[(i + d + n) % n], true);
  }

  protected goStep(n: number, focus = false) {
    this.stop();
    this.st.set(n);
    this.sync();
    if (focus) queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('#opsSteps [aria-current="step"]')?.focus());
  }

  protected prev() { this.stop(); if (this.st() > 0) { this.st.update((v) => v - 1); this.sync(); } }
  protected next() { this.stop(); if (this.st() < 5) { this.st.update((v) => v + 1); this.sync(); } }

  protected togglePlay() {
    if (this.playing()) { this.stop(); return; }
    this.st.set(0);
    this.sync();
    this.playing.set(true);
    const tick = () => {
      this.timer = setTimeout(() => {
        if (this.st() >= 5) { this.stop(); return; }
        this.st.update((v) => v + 1);
        this.sync();
        tick();
      }, this.sim ? PLAYDUR[this.st()] : this.reduce ? 4000 : 2600);
    };
    tick();
  }

  protected stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.playing.set(false);
  }

  protected setView(v: '3d' | 'img') { this.view.set(v); }
}
