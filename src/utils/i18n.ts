import { I18n } from 'i18n-js';
import en from '../locales/en.json';
import es from '../locales/es.json';

const i18n = new I18n({
  en,
  es
});

i18n.defaultLocale = 'es';
i18n.locale = 'es';

export const updateLocale = (locale: string): void => {
  i18n.locale = locale;
};

export const t = (scope: string, options?: object): string => {
  return i18n.t(scope, options);
};

export const getI18nLocale = (): string => i18n.locale;
