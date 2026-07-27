import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from './locales/en/common.json'
import teCommon from './locales/te/common.json'
import hiCommon from './locales/hi/common.json'
import taCommon from './locales/ta/common.json'
import knCommon from './locales/kn/common.json'

const resources = {
  en: { translation: enCommon },
  te: { translation: teCommon },
  hi: { translation: hiCommon },
  ta: { translation: taCommon },
  kn: { translation: knCommon }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'te', 'hi', 'ta', 'kn'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
