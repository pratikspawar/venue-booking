import { en } from './en';
import { mr } from './mr';
import { hi } from './hi';
import { useVenueStore } from '../store/useVenueStore';

export type LanguageCode = 'en' | 'mr' | 'hi';
export type TranslationKey = keyof typeof en;

export const translations = {
  en,
  mr,
  hi,
};

export const getTranslation = (key: TranslationKey, lang: LanguageCode = 'en'): string => {
  const dict = translations[lang] || translations.en;
  return dict[key] || translations.en[key] || key;
};

export const useTranslation = () => {
  const language = useVenueStore((s) => s.language) || 'en';
  const t = (key: TranslationKey): string => getTranslation(key, language);
  return { t, language };
};

export { en, mr, hi };
