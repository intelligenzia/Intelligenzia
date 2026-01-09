export const locales = ['fi', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fi';

export const localeNames: Record<Locale, string> = {
  fi: 'Suomi',
  en: 'English',
};
