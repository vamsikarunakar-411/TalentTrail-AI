import { translations, SUPPORTED_LANGUAGES } from './translations.js';

const STORAGE_KEY = 'talenttrail_selected_language';

/**
 * Returns currently saved language or defaults to 'en-US'
 */
export function getSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      return saved;
    }
  } catch (e) {
    // Ignore localStorage access issues in restricted contexts
  }
  return 'en-US';
}

/**
 * Persists selected language to localStorage
 */
export function saveLanguage(langCode) {
  try {
    if (SUPPORTED_LANGUAGES.some(l => l.code === langCode)) {
      localStorage.setItem(STORAGE_KEY, langCode);
    }
  } catch (e) {
    // Ignore localStorage access issues
  }
}

/**
 * Translates a dot-notated key (e.g. 'nav.dashboard') for the given language.
 * Robust against null/undefined params or when langCode is passed as second argument.
 * Falls back to English if key is missing in target language.
 */
export function t(key, params = {}, langCode = 'en-US') {
  let actualParams = params;
  let targetLang = langCode;

  // Support overload t('key', 'te-IN') where 2nd argument is the language code
  if (typeof params === 'string' && SUPPORTED_LANGUAGES.some(l => l.code === params)) {
    targetLang = params;
    actualParams = {};
  } else if (!actualParams || typeof actualParams !== 'object' || Array.isArray(actualParams)) {
    actualParams = {};
  }

  const activeLang = translations[targetLang] ? targetLang : 'en-US';
  const keys = (key && typeof key === 'string') ? key.split('.') : [];

  let value = translations[activeLang];
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      value = undefined;
      break;
    }
  }

  // Fallback to English if missing
  if (value === undefined && activeLang !== 'en-US') {
    let fallback = translations['en-US'];
    for (const k of keys) {
      if (fallback && typeof fallback === 'object' && k in fallback) {
        fallback = fallback[k];
      } else {
        fallback = undefined;
        break;
      }
    }
    value = fallback;
  }

  if (typeof value !== 'string') {
    return key || '';
  }

  // Replace params like {n}, {sec}, {current}, {total}
  let result = value;
  for (const [paramKey, paramVal] of Object.entries(actualParams)) {
    result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
  }

  return result;
}


/**
 * Finds language metadata by code
 */
export function getLanguageMetadata(code = 'en-US') {
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[1];
}

export { SUPPORTED_LANGUAGES, translations };
