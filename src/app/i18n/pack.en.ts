import { STRINGS_EN } from './strings.en';
import { UI_EN } from './ui.en';
import { CONTENT_EN } from '../data/content.en';
import type { LangPack } from './pack';

/** Everything the site needs in English (loaded only for English pages). */
export const PACK: LangPack = { strings: STRINGS_EN, ui: UI_EN, content: CONTENT_EN };
