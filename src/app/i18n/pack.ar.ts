import { STRINGS_AR } from './strings.ar';
import { UI_AR } from './ui.ar';
import { CONTENT_AR } from '../data/content.ar';
import type { LangPack } from './pack';

/** Everything the site needs in Arabic (loaded only for Arabic pages). */
export const PACK: LangPack = { strings: STRINGS_AR, ui: UI_AR, content: CONTENT_AR };
