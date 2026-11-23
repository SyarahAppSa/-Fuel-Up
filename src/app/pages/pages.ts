import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n';
import { IconAttr } from '../shared/icon';
import { Logos, Marquee } from '../shared/logos';
import { Feat, Journey, Phone, Policy, SectList, SvcGrid, Tanks, Ticker, Why } from '../features/blocks';
import { SaMap } from '../features/map';
import { Slider } from '../features/slider';
import { SvcTabs } from '../features/svc-tabs';
import { OpsRoom } from '../features/ops/ops-room';
import { QuoteForm } from '../features/quote-form';
import { MAP, MAP_EN } from '../data/map';

const OnPush = ChangeDetectionStrategy.OnPush;
const host = { style: 'display:contents' };

@Component({
  selector: 'fa-home', host, changeDetection: OnPush, templateUrl: './home.html',
  imports: [RouterLink, IconAttr, Slider, SaMap, Ticker, SvcTabs, Why, Feat, Phone, Marquee, OpsRoom],
})
export class HomePage { protected i = inject(I18n); }

@Component({ selector: 'fa-about', host, changeDetection: OnPush, templateUrl: './about.html', imports: [RouterLink, IconAttr] })
export class AboutPage { protected i = inject(I18n); }

@Component({ selector: 'fa-services', host, changeDetection: OnPush, templateUrl: './services.html', imports: [RouterLink, SvcGrid, Tanks, SectList] })
export class ServicesPage { protected i = inject(I18n); }

@Component({ selector: 'fa-platform', host, changeDetection: OnPush, templateUrl: './platform.html', imports: [RouterLink, Feat, Phone, Journey] })
export class PlatformPage { protected i = inject(I18n); }

@Component({ selector: 'fa-clients', host, changeDetection: OnPush, templateUrl: './clients.html', imports: [RouterLink, Logos] })
export class ClientsPage { protected i = inject(I18n); }

@Component({ selector: 'fa-contact', host, changeDetection: OnPush, templateUrl: './contact.html', imports: [RouterLink, IconAttr, QuoteForm] })
export class ContactPage { protected i = inject(I18n); }

@Component({ selector: 'fa-coverage', host, changeDetection: OnPush, templateUrl: './coverage.html', imports: [RouterLink, SaMap] })
export class CoveragePage {
  protected i = inject(I18n);
  protected regKeys = ['c', 'e', 'w', 'm'];
  protected regSel = signal<string | null>(null);
  protected cityRes = signal<{ ok: boolean; text: string } | null>(null);
  /** «Do we serve your city?»: map cities + a few nearby cities, sorted in the page language */
  protected cities = computed(() => {
    const lang = this.i.lang();
    const fromMap = (MAP.cities as unknown as unknown[][]).map(
      (c) => [lang === 'en' ? (MAP_EN[c[2] as string] ?? (c[2] as string)) : (c[2] as string), c[6] as string] as [string, string],
    );
    return fromMap.concat(this.i.c().extraCities as [string, string][]).sort((a, b) => a[0].localeCompare(b[0], lang));
  });

  protected toggleRegion(k: string) { this.regSel.update((r) => (r === k ? null : k)); }
  protected pickCity(v: string) {
    const u = this.i.ui().map;
    if (!v) this.cityRes.set(null);
    else if (v === 'x') this.cityRes.set({ ok: false, text: u.otherCityMsg });
    else { this.cityRes.set({ ok: true, text: u.yesCity + this.i.c().regions[v][0] + '.' }); this.regSel.set(v); }
  }
}

@Component({ selector: 'fa-privacy', host, changeDetection: OnPush, templateUrl: './privacy.html', imports: [RouterLink, Policy] })
export class PrivacyPage { protected i = inject(I18n); }

@Component({ selector: 'fa-terms', host, changeDetection: OnPush, templateUrl: './terms.html', imports: [RouterLink, Policy] })
export class TermsPage { protected i = inject(I18n); }

@Component({ selector: 'fa-hse', host, changeDetection: OnPush, templateUrl: './hse.html', imports: [RouterLink, Policy] })
export class HsePage { protected i = inject(I18n); }

