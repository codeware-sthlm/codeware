export type SupportedLocale = 'en' | 'sv';

export type TranslationKey =
  | 'error.contactAdmin'
  | 'error.landingPageNotFound'
  | 'error.landingPageNotFoundDescription'
  | 'error.landingPageRenderFailed'
  | 'error.pageRenderFailed'
  | 'error.somethingWentWrong'
  | 'error.unableToLoadContent'
  | 'fileArea.download'
  | 'fileArea.noFiles'
  | 'fileArea.previewNotAvailable'
  | 'fileArea.search'
  | 'fileArea.sort'
  | 'fileArea.sortDateNewest'
  | 'fileArea.sortDateOldest'
  | 'fileArea.sortNameAsc'
  | 'fileArea.sortNameDesc'
  | 'fileArea.sortSizeLargest'
  | 'fileArea.sortSizeSmallest'
  | 'fileArea.typeAudio'
  | 'fileArea.typeDocument'
  | 'fileArea.typeImage'
  | 'fileArea.typeOther'
  | 'fileArea.typePdf'
  | 'fileArea.typePresentation'
  | 'fileArea.typeSpreadsheet'
  | 'fileArea.typeVideo'
  | 'form.submitSuccess'
  | 'form.submitFailed'
  | 'form.submitFailedDescription'
  | 'navigation.menu'
  | 'navigation.title'
  | 'notFound.description'
  | 'notFound.goHome'
  | 'notFound.title'
  | 'posts.readMore'
  | 'social.clickToCopy'
  | 'social.copied'
  | 'social.copyFailed'
  | 'theme.currentClickFor'
  | 'theme.dark'
  | 'theme.light'
  | 'theme.switchTo'
  | 'theme.system';

const translations: Record<SupportedLocale, Record<TranslationKey, string>> = {
  en: {
    'error.contactAdmin':
      'Please contact the administrator if the problem persists.',
    'error.landingPageNotFound': 'Landing page was not found',
    'error.landingPageNotFoundDescription':
      'Please create a page in the CMS and assign it to be a landing page.',
    'error.landingPageRenderFailed': 'The landing page could not be rendered.',
    'error.pageRenderFailed':
      "The page you're looking for could not be rendered.",
    'error.somethingWentWrong': 'Something went wrong!',
    'error.unableToLoadContent':
      'Unable to load application content. Please try again later.',
    'fileArea.download': 'Download',
    'fileArea.noFiles': 'No files',
    'fileArea.previewNotAvailable': 'Preview not available for this file type',
    'fileArea.search': 'Search...',
    'fileArea.sort': 'Sort',
    'fileArea.sortDateNewest': 'Newest first',
    'fileArea.sortDateOldest': 'Oldest first',
    'fileArea.sortNameAsc': 'Name (A-Z)',
    'fileArea.sortNameDesc': 'Name (Z-A)',
    'fileArea.sortSizeLargest': 'Size (largest)',
    'fileArea.sortSizeSmallest': 'Size (smallest)',
    'fileArea.typeAudio': 'Audio',
    'fileArea.typeDocument': 'Document',
    'fileArea.typeImage': 'Image',
    'fileArea.typeOther': 'Other',
    'fileArea.typePdf': 'PDF',
    'fileArea.typePresentation': 'Presentation',
    'fileArea.typeSpreadsheet': 'Spreadsheet',
    'fileArea.typeVideo': 'Video',
    'form.submitSuccess': 'Form submitted successfully',
    'form.submitFailed': 'Form submission failed',
    'form.submitFailedDescription': 'Please try again.',
    'navigation.menu': 'Menu',
    'navigation.title': 'Navigation',
    'notFound.description':
      'Sorry, we could not find the page you were looking for.',
    'notFound.goHome': 'Go back home',
    'notFound.title': 'Page not found',
    'posts.readMore': 'Read more',
    'social.clickToCopy': 'Click to copy',
    'social.copied': 'Copied',
    'social.copyFailed': 'Failed to copy to clipboard',
    'theme.currentClickFor': 'Current: {{current}}, click for {{next}}',
    'theme.dark': 'dark',
    'theme.light': 'light',
    'theme.switchTo': 'Switch to {{theme}} theme',
    'theme.system': 'system preference'
  },
  sv: {
    'error.contactAdmin': 'Kontakta administratören om problemet kvarstår.',
    'error.landingPageNotFound': 'Startsida hittades inte',
    'error.landingPageNotFoundDescription':
      'Skapa en sida i CMS och tilldela den som startsida.',
    'error.landingPageRenderFailed': 'Startsidan kunde inte visas.',
    'error.pageRenderFailed': 'Sidan du söker kunde inte visas.',
    'error.somethingWentWrong': 'Något gick fel!',
    'error.unableToLoadContent':
      'Det gick inte att ladda innehållet. Försök igen senare.',
    'fileArea.download': 'Ladda ner',
    'fileArea.noFiles': 'Inga filer',
    'fileArea.previewNotAvailable':
      'Förhandsgranskning ej tillgänglig för den här filtypen',
    'fileArea.search': 'Sök...',
    'fileArea.sort': 'Sortera',
    'fileArea.sortDateNewest': 'Nyast först',
    'fileArea.sortDateOldest': 'Äldst först',
    'fileArea.sortNameAsc': 'Namn (A-Ö)',
    'fileArea.sortNameDesc': 'Namn (Ö-A)',
    'fileArea.sortSizeLargest': 'Storlek (störst)',
    'fileArea.sortSizeSmallest': 'Storlek (minst)',
    'fileArea.typeAudio': 'Ljud',
    'fileArea.typeDocument': 'Dokument',
    'fileArea.typeImage': 'Bild',
    'fileArea.typeOther': 'Övrigt',
    'fileArea.typePdf': 'PDF',
    'fileArea.typePresentation': 'Presentation',
    'fileArea.typeSpreadsheet': 'Kalkylark',
    'fileArea.typeVideo': 'Video',
    'form.submitSuccess': 'Formuläret skickades in',
    'form.submitFailed': 'Formuläret kunde inte skickas in',
    'form.submitFailedDescription': 'Försök igen.',
    'navigation.menu': 'Meny',
    'navigation.title': 'Navigation',
    'notFound.description': 'Tyvärr kunde vi inte hitta sidan du letade efter.',
    'notFound.goHome': 'Gå tillbaka till startsidan',
    'notFound.title': 'Sidan hittades inte',
    'posts.readMore': 'Läs mer',
    'social.clickToCopy': 'Klicka för att kopiera',
    'social.copied': 'Kopierad',
    'social.copyFailed': 'Kopiering misslyckades',
    'theme.currentClickFor': 'Nuvarande: {{current}}, klicka för {{next}}',
    'theme.dark': 'mörkt',
    'theme.light': 'ljust',
    'theme.switchTo': 'Byt till {{theme}} tema',
    'theme.system': 'systeminställning'
  }
} as const;

/**
 * Translate a key to the given locale.
 *
 * Falls back to English if the locale is not supported.
 * Supports simple `{{variable}}` interpolation via the `vars` argument.
 */
export function t(
  locale: string,
  key: TranslationKey,
  vars?: Record<string, string>
): string {
  const lang: SupportedLocale =
    locale in translations ? (locale as SupportedLocale) : 'en';

  let result: string = translations[lang][key] ?? translations.en[key] ?? key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(`{{${k}}}`, v);
    }
  }

  return result;
}
