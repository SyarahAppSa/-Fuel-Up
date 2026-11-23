import type { UiStrings } from './ui';
import type { SiteContent } from '../data/content.types';

export interface LangPack { strings: Record<string, string>; ui: UiStrings; content: SiteContent }

/** Each language is a separate chunk, so visitors download only the language they read. */
export const PACK_LOADERS = {
  ar: () => import('./pack.ar').then((m) => m.PACK),
  en: () => import('./pack.en').then((m) => m.PACK),
} as const;
