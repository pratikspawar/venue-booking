import { en } from './en';
import { mr } from './mr';
import { hi } from './hi';
import { useCustomerStore } from '../store/useCustomerStore';

export type MobileLanguageCode = 'en' | 'mr' | 'hi';
export type MobileTranslationKey = keyof typeof en;

export const translations = {
  en,
  mr,
  hi,
};

export const getTranslation = (key: MobileTranslationKey, lang: MobileLanguageCode = 'en'): string => {
  const dict = translations[lang] || translations.en;
  return dict[key] || translations.en[key] || key;
};

export const useTranslation = () => {
  const language = useCustomerStore((s) => s.language) || 'en';
  const t = (key: MobileTranslationKey): string => getTranslation(key, language);
  return { t, language };
};

export { en, mr, hi };
