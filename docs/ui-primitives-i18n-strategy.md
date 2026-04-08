# UI Primitives i18n Strategy

## Third-Party Solutions Evaluation

### Your Stack

- **CMS App**: Next.js 15 + Payload CMS (has built-in i18n)
- **Web App**: Remix
- **Shared Libraries**: Need to work with both frameworks

### Recommended: i18next + react-i18next

**Why this is the best choice:**

✅ **Framework agnostic** - Works with both Remix and Next.js  
✅ **Industry standard** - 11M+ downloads/week, battle-tested  
✅ **TypeScript support** - Full type-safety with plugins  
✅ **Payload integration** - Can sync with Payload's i18n  
✅ **Server + Client** - SSR support for both frameworks  
✅ **Zero config** - Minimal setup, maximum flexibility

#### Installation

```bash
pnpm add i18next react-i18next
pnpm add -D @types/i18next
```

#### Quick Setup

**1. Create shared translations:**

```typescript
// libs/shared/util/i18n/src/lib/translations/index.ts
export const resources = {
  en: {
    common: {
      callout: {
        tagsTitle: 'Using tags to organize media files',
        tagsDesc1: 'Use tags to organize your media files...'
      },
      social: {
        clickToCopy: 'Click to copy',
        copied: 'Copied',
        copyFailed: 'Failed to copy to clipboard'
      }
    }
  },
  sv: {
    common: {
      callout: {
        tagsTitle: 'Använd etiketter för att organisera mediafiler',
        tagsDesc1: 'Använd etiketter för att organisera dina mediafiler...'
      },
      social: {
        clickToCopy: 'Klicka för att kopiera',
        copied: 'Kopierad',
        copyFailed: 'Kopiering misslyckades'
      }
    }
  }
} as const;
```

**2. Initialize i18next:**

```typescript
// libs/shared/util/i18n/src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './translations';

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false // React already escapes
  },
  ns: ['common'],
  defaultNS: 'common'
});

export default i18n;
```

**3. Use in components:**

```typescript
// libs/shared/ui/primitives/src/lib/callout/Callout.tsx
import { useTranslation } from 'react-i18next';

export const Callout = () => {
  const { t } = useTranslation('common');

  return <AlertTitle>{t('callout.tagsTitle')}</AlertTitle>;
};
```

**4. Integrate with Payload:**

```typescript
// apps/cms/src/payload.config.ts
import i18n from '@codeware/shared/util/i18n';

export default buildConfig({
  i18n: {
    // Sync Payload's locale with i18next
    fallbackLanguage: 'en',
    supportedLanguages: { en, sv },
    translations: customTranslations
  },
  onInit: async (payload) => {
    // Set i18next locale to match Payload
    i18n.changeLanguage(payload.config.i18n.fallbackLanguage);
  }
});
```

### Alternative Options Compared

| Solution            | Pros                                                    | Cons                                  | Best For                   |
| ------------------- | ------------------------------------------------------- | ------------------------------------- | -------------------------- |
| **i18next** ⭐      | Framework agnostic, mature, type-safe, works everywhere | Slightly more setup                   | Your multi-framework setup |
| **react-intl**      | FormatJS ecosystem, ICU message format                  | Less TypeScript support, more verbose | Complex message formatting |
| **next-intl**       | Perfect Next.js integration, type-safe                  | Next.js only, won't work in Remix     | Next.js-only projects      |
| **remix-i18next**   | Built for Remix, uses i18next                           | Remix-specific wrapper                | Remix-only projects        |
| **typesafe-i18n**   | Extreme type-safety, lightweight                        | Newer, smaller community              | Greenfield projects        |
| **Lingui**          | Modern API, compile-time optimization                   | Build step required, less mature      | Performance-critical apps  |
| **Custom solution** | Full control, minimal deps                              | Maintenance burden, reinventing wheel | Simple projects            |

### Recommendation for Your Project

**Use i18next + react-i18next because:**

1. **Works in both apps** - Remix and Next.js support
2. **Shared translations** - Single source of truth in `libs/shared/util/i18n`
3. **Payload integration** - Can sync locales with Payload's i18n
4. **TypeScript support** - With `typescript` plugin:

   ```typescript
   import 'i18next';
   import type { resources } from './translations';

   declare module 'i18next' {
     interface CustomTypeOptions {
       resources: (typeof resources)['en'];
     }
   }
   ```

5. **SSR support** - Server-side rendering in both frameworks
6. **Community** - Huge ecosystem, many plugins, active maintenance

### Practical Migration Example

**Before (current PoC in SocialMediaBlock):**

```typescript
type LangCode = 'en' | 'sv';
type TextKey = 'clickToCopy' | 'copyFailed' | 'copied';

const langKey: Record<TextKey, Record<LangCode, string>> = {
  clickToCopy: { en: 'Click to copy', sv: 'Klicka för att kopiera' },
  copyFailed: { en: 'Failed to copy to clipboard', sv: 'Kopiering misslyckades' },
  copied: { en: 'Copied', sv: 'Kopierad' }
};

const textFactory = (code: LangCode) => (key: TextKey): string => langKey[key][code];

// Usage
const t = textFactory(locale as LangCode);
<TooltipContent>{t('clickToCopy')}</TooltipContent>
```

**After (with i18next):**

```typescript
import { useTranslation } from 'react-i18next';

// Usage - that's it!
const { t } = useTranslation('common');
<TooltipContent>{t('social.clickToCopy')}</TooltipContent>
```

**Benefits:**

- ✅ No manual factories
- ✅ Auto-completion in VSCode
- ✅ Missing key warnings
- ✅ Same API everywhere
- ✅ Pluralization, interpolation built-in

### Framework-Specific Setup

**For Remix (apps/web):**

```typescript
// app/root.tsx
import { useChangeLanguage } from 'remix-i18next/react';
import { useTranslation } from 'react-i18next';

export function Root() {
  const { i18n } = useTranslation();
  const locale = useLoaderData<typeof loader>();

  // Sync locale from server
  useChangeLanguage(locale);

  return <Outlet />;
}
```

**For Next.js (apps/cms):**

```typescript
// app/layout.tsx or providers
import { I18nextProvider } from 'react-i18next';
import i18n from '@codeware/shared/util/i18n';

export function Providers({ children, locale }) {
  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
```

### TypeScript Type-Safety

**Add to `libs/shared/util/i18n/src/lib/i18n.d.ts`:**

```typescript
import 'react-i18next';
import { resources } from './translations';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof resources)['en'];
  }
}
```

**Now you get:**

```typescript
const { t } = useTranslation();

// ✅ Autocomplete works
t('social.clickToCopy');

// ❌ TypeScript error: Property 'nonexistent' does not exist
t('social.nonexistent');
```

### Implementation Plan

1. ✅ Install i18next packages: `pnpm add i18next react-i18next`
2. ✅ Create `libs/shared/util/i18n` with translations
3. ✅ Add TypeScript declarations for type-safety
4. ✅ Initialize i18next in shared library
5. ✅ Update Callout component to use `useTranslation` hook
6. ✅ Update SocialMediaBlock to replace PoC with i18next
7. ✅ Replace hardcoded strings in Payload collections
8. ✅ Setup providers in both apps (Remix + Next.js)
9. ✅ Test locale switching in both apps

### Quick Start Commands

```bash
# 1. Install dependencies
pnpm add i18next react-i18next

# 2. Generate i18n library
nx g @nx/js:library util/i18n --directory=libs/shared

# 3. Add translations and setup
# Follow examples above

# 4. Test in both apps
nx run cms:dev
nx run web:dev
```

---

## Custom Solution (Original Proposal)

> **Note**: The custom solution below works, but i18next is recommended for better ecosystem support and maintainability.

## Problem

UI primitives in `libs/shared/ui/primitives` are used in contexts where Payload's i18n system is not available:

- Client-side components outside Payload admin
- Server-rendered components without i18n context
- Shared components used across CMS and web apps

**Current issues:**

1. Hardcoded English text in component usage (e.g., Callout in `media.collection.ts`)
2. Inconsistent i18n approaches (see PoC in `SocialMediaBlock.tsx`)
3. No centralized translation management for UI primitives

## Solution: Shared Translation System

### Architecture

```
libs/
  shared/
    util/
      i18n/               # NEW: Shared i18n utilities
        src/
          lib/
            translations.ts        # Translation definitions
            i18n-context.tsx      # React context for locale
            use-translations.tsx  # Hook for components
            types.ts              # Type definitions
```

### Implementation

#### 1. Create Translation Definitions

**File:** `libs/shared/util/i18n/src/lib/translations.ts`

```typescript
export type Locale = 'en' | 'sv';

export type TranslationKey = 'callout.tagsTitle' | 'callout.tagsDesc1' | 'callout.tagsDesc2' | 'callout.tagsDesc3' | 'social.clickToCopy' | 'social.copied' | 'social.copyFailed';

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    'callout.tagsTitle': 'Using tags to organize media files',
    'callout.tagsDesc1': 'Use tags to organize your media files and easily select them in file areas.',
    'callout.tagsDesc2': 'Tags can be created in the "Tags" collection.',
    'callout.tagsDesc3': 'You can assign multiple tags to a media file.',
    'social.clickToCopy': 'Click to copy',
    'social.copied': 'Copied',
    'social.copyFailed': 'Failed to copy to clipboard'
  },
  sv: {
    'callout.tagsTitle': 'Använd etiketter för att organisera mediafiler',
    'callout.tagsDesc1': 'Använd etiketter för att organisera dina mediafiler och enkelt välja dem i filområden.',
    'callout.tagsDesc2': 'Etiketter kan skapas i "Etiketter"-samlingen.',
    'callout.tagsDesc3': 'Du kan tilldela flera etiketter till en mediafil.',
    'social.clickToCopy': 'Klicka för att kopiera',
    'social.copied': 'Kopierad',
    'social.copyFailed': 'Kopiering misslyckades'
  }
};

/**
 * Get translation for a key in a specific locale
 */
export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] || translations.en[key] || key;
}

/**
 * Get multiple translations as an array
 */
export function tArray(locale: Locale, keys: TranslationKey[]): string[] {
  return keys.map((key) => t(locale, key));
}
```

#### 2. Create React Context (for client components)

**File:** `libs/shared/util/i18n/src/lib/i18n-context.tsx`

```typescript
'use client';

import { createContext, useContext, ReactNode } from 'react';

export type Locale = 'en' | 'sv';

interface I18nContextValue {
  locale: Locale;
  setLocale?: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({ locale: 'en' });

export function I18nProvider({
  children,
  locale: initialLocale = 'en'
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
```

#### 3. Create Translation Hook

**File:** `libs/shared/util/i18n/src/lib/use-translations.tsx`

```typescript
'use client';

import { useI18n } from './i18n-context';
import { t as translate, tArray as translateArray, TranslationKey, Locale } from './translations';

export function useTranslations() {
  const { locale } = useI18n();

  return {
    t: (key: TranslationKey) => translate(locale, key),
    tArray: (keys: TranslationKey[]) => translateArray(locale, keys),
    locale
  };
}

/**
 * Server-side or context-free translation helper
 */
export function useServerTranslations(locale: Locale = 'en') {
  return {
    t: (key: TranslationKey) => translate(locale, key),
    tArray: (keys: TranslationKey[]) => translateArray(locale, keys),
    locale
  };
}
```

### Usage Examples

#### Example 1: Update Callout in Payload Collections

**Before:**

```typescript
// media.collection.ts
components: {
  beforeListTable: [
    {
      path: '@codeware/app-cms/ui/components/Callout',
      serverProps: {
        kind: 'tip',
        title: 'Using tags to organize media files',
        description: ['Use tags to organize your media files...', 'Tags can be created in the "Tags" collection.', 'You can assign multiple tags to a media file.']
      }
    }
  ];
}
```

**After:**

```typescript
// media.collection.ts
import { t, tArray } from '@codeware/shared/util/i18n';

components: {
  beforeListTable: [
    {
      path: '@codeware/app-cms/ui/components/Callout',
      serverProps: {
        kind: 'tip',
        title: ({ locale }) => t(locale, 'callout.tagsTitle'),
        description: ({ locale }) => tArray(locale, ['callout.tagsDesc1', 'callout.tagsDesc2', 'callout.tagsDesc3'])
      }
    }
  ];
}
```

#### Example 2: Update Callout Component

**File:** `libs/shared/ui/primitives/src/lib/callout/Callout.tsx`

```typescript
import { Locale, t, TranslationKey } from '@codeware/shared/util/i18n';

export type CalloutProps = {
  // For static text
  description?: Array<string>;
  title?: string;

  // For translated text (NEW)
  descriptionKeys?: Array<TranslationKey>;
  titleKey?: TranslationKey;
  locale?: Locale;

  kind?: 'info' | 'warning' | 'tip';
};

export const Callout: React.FC<CalloutProps> = ({
  description,
  descriptionKeys,
  title,
  titleKey,
  locale = 'en',
  kind
}) => {
  // Use translated keys if provided, otherwise use static text
  const displayTitle = titleKey ? t(locale, titleKey) : title;
  const displayDescription = descriptionKeys
    ? descriptionKeys.map(key => t(locale, key))
    : description || [];

  return (
    <Alert>
      {kind && <HeroIcon icon={iconMap[kind]} />}
      {displayTitle && <AlertTitle>{displayTitle}</AlertTitle>}
      <AlertDescription>
        {displayDescription.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </AlertDescription>
    </Alert>
  );
};
```

#### Example 3: Update SocialMediaBlock

**File:** `libs/shared/ui/cms-renderer/src/lib/blocks/SocialMediaBlock.tsx`

**Before (PoC approach):**

```typescript
const langKey: Record<TextKey, Record<LangCode, string>> = {
  clickToCopy: { en: 'Click to copy', sv: 'Klicka för att kopiera' }
  // ...
};
const textFactory =
  (code: LangCode) =>
  (key: TextKey): string =>
    langKey[key][code];
```

**After (using shared i18n):**

```typescript
import { useTranslations } from '@codeware/shared/util/i18n';

export const SocialMediaBlock: React.FC<SocialMediaBlockProps> = ({
  direction,
  social
}) => {
  const { navigate, locale } = usePayload();
  const { t } = useTranslations(); // Uses I18n context

  // OR if locale comes from Payload context:
  // const { t } = useServerTranslations(locale as Locale);

  return (
    <Tooltip>
      <TooltipTrigger>
        <SocialIcon platform={platform} />
      </TooltipTrigger>
      <TooltipContent>
        {t('social.clickToCopy')}
      </TooltipContent>
    </Tooltip>
  );
};
```

## Migration Steps

### Phase 1: Setup Infrastructure ✅

1. Create `libs/shared/util/i18n` library
2. Implement translation definitions
3. Create React context and hooks
4. Export from index

### Phase 2: Update UI Primitives

1. Update `Callout` component to support translation keys
2. Update `SocialMediaBlock` to use shared i18n
3. Add locale prop to components that need it

### Phase 3: Update Usage Sites

1. Update Payload collections using Callout
2. Migrate hardcoded strings to translation keys
3. Update any other UI primitive usage

### Phase 4: Integration with Payload

1. Connect Payload's i18n locale to shared i18n context
2. Ensure locale switching works across admin UI

## Benefits

✅ **Centralized translations** - All UI text in one place  
✅ **Type-safe** - TypeScript ensures translation keys exist  
✅ **Reusable** - Same system for CMS and web app  
✅ **Maintainable** - Easy to add new languages  
✅ **Flexible** - Works with and without React context  
✅ **Gradual adoption** - Components support both static and translated text

## Alternative: Payload Field-Level i18n

For Callout fields used in Payload collections, you can also use localized fields:

```typescript
// Alternative approach using Payload's localized fields
{
  type: 'group',
  name: 'calloutContent',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      defaultValue: ({ locale }) =>
        locale === 'sv' ? 'Svensk titel' : 'English title'
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true
    }
  ],
  admin: {
    hideGutter: true
  }
}
```

This approach:

- ✅ Uses Payload's built-in localization
- ✅ Allows per-tenant customization
- ❌ More verbose in collection definitions
- ❌ Doesn't help with client-side components

## Recommendation

Use the **Shared Translation System** for:

- UI primitives used across apps
- Consistent messaging (tooltips, alerts, etc.)
- Default/fallback text

Use **Payload's localized fields** for:

- Content that admins should customize
- Per-tenant variations
- Long-form content

## Next Steps

1. ✅ Create `@codeware/shared/util/i18n` library
2. Implement translation definitions with existing strings
3. Update Callout component
4. Migrate media.collection.ts Callout usage
5. Update SocialMediaBlock
6. Document usage for team
