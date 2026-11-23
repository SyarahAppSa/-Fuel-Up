export interface Service { id: string; ic: string; t: string; s: string; big: [string, string]; d: string; li: string[]; src?: number }
export type Pair = [string, string];
export type IconTriple = [string, string, string];
export interface OpsSector { n: string; ic: string; site: string; fuel: string; photo: string; t: string[] }
export interface SiteContent {
  svc: Service[];
  why: IconTriple[];
  feat: IconTriple[];
  journey: Pair[];
  sect: [string, string, string, string][];
  tanks: [number, string][];
  logos: Record<'clients' | 'projects' | 'permits', string[][]>;
  tick: string[];
  phone: string;
  regionColors: Record<string, string>;
  regions: Record<string, Pair>;
  hubs: Record<string, string>;
  routes: (string | number)[][];
  titles: Record<string, string>;
  policies: Record<'privacy' | 'terms' | 'hse', Pair[]>;
  policyUpdated: string;
  svcCta: string;
  extraCities: Pair[];
  ops: { stages: [string, string, string, string][]; status: string[]; sectors: Record<'c' | 'f' | 'l', OpsSector> };
}
