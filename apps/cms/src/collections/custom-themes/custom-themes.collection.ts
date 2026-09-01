import { slugField } from '@codeware/app-cms/ui/fields';
import { adminGroups } from '@codeware/app-cms/util/definitions';
import { customT } from '@codeware/app-cms/util/i18n';
import {
  SITE_THEMES,
  isValidThemeSlug,
  isValidTokenName,
  isValidTokenValue
} from '@codeware/shared/theme';
import type {
  CollectionConfig,
  PayloadRequest,
  TextField,
  Validate
} from 'payload';

import { userOnlyAccess } from '../../security/user-only-access';
import { userOrApiKeyAccess } from '../../security/user-or-api-key-access';

/** Reuses the slug field's per-tenant uniqueness and dash formatting. */
const base = slugField({ sourceField: 'name', required: true }) as TextField;

/**
 * The theme's `data-theme` value.
 *
 * A slug rather than a free-text name because it goes straight into a CSS
 * selector, and it has to survive alongside the built-in themes in the same
 * attribute.
 */
const themeSlugField: TextField = {
  ...base,
  label: { en: 'Theme id', sv: 'Tema-id' },
  admin: {
    ...base.admin,
    description: {
      en: 'Identifies the theme in the page markup. Generated from the name if left empty.',
      sv: 'Identifierar temat i sidans markup. Genereras från namnet om det lämnas tomt.'
    }
  },
  validate: ((value, { req }) => {
    if (!value) {
      // `required` already reports this
      return true;
    }
    if ((SITE_THEMES as readonly string[]).includes(value)) {
      return customT((req as PayloadRequest).t)('validation:themeNameBuiltIn', {
        name: value
      });
    }
    if (!isValidThemeSlug(value)) {
      // `light` and `dark` would be indistinguishable from the colour scheme
      return ['light', 'dark'].includes(value)
        ? customT((req as PayloadRequest).t)('validation:themeNameReserved', {
            name: value
          })
        : customT((req as PayloadRequest).t)('validation:themeNameInvalid');
    }
    return true;
  }) as Validate
};

/**
 * Reject anything that could not be written into a stylesheet.
 *
 * The site injects these tokens into a `<style>` block, so the same whitelist
 * that guards the render guards the save — here it can say what was wrong
 * instead of silently dropping the token.
 */
const validateTokens =
  (scheme: 'light' | 'dark'): Validate =>
  (value) => {
    if (value === null || value === undefined || value === '') {
      return scheme === 'light' ? 'Light tokens are required.' : true;
    }
    if (typeof value !== 'object' || Array.isArray(value)) {
      return 'Expected an object of token names and values.';
    }

    const rejected = Object.entries(value as Record<string, unknown>)
      .filter(
        ([name, token]) => !isValidTokenName(name) || !isValidTokenValue(token)
      )
      .map(([name]) => name);

    if (rejected.length) {
      return `Not usable as CSS: ${rejected.join(', ')}. Names look like "--core-link"; values may only hold colours, lengths and var()/calc()/color-mix() references.`;
    }
    return true;
  };

/**
 * Custom themes collection
 *
 * Tenant-authored token sets, injected into the site at runtime as a scoped
 * `<style>` block rather than compiled into the CSS bundle. That is what lets a
 * theme ship without a build or a deploy.
 */
const customThemes: CollectionConfig = {
  slug: 'custom-themes',
  admin: {
    group: adminGroups.settings,
    defaultColumns: ['name', 'slug'],
    useAsTitle: 'name',
    description: {
      en: 'Your own themes. Select them in Site Settings to make them available on the site.',
      sv: 'Dina egna teman. Välj dem i Webbplatsinställningar för att göra dem tillgängliga på webbplatsen.'
    }
  },
  access: {
    read: userOrApiKeyAccess(),
    create: userOnlyAccess(),
    update: userOnlyAccess(),
    delete: userOnlyAccess()
  },
  labels: {
    singular: { en: 'Custom theme', sv: 'Eget tema' },
    plural: { en: 'Custom themes', sv: 'Egna teman' }
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { en: 'Name', sv: 'Namn' },
      admin: {
        description: {
          en: 'Shown to visitors in the theme selector.',
          sv: 'Visas för besökare i temaväljaren.'
        }
      }
    },
    {
      name: 'recipe',
      type: 'json',
      label: { en: 'Theme', sv: 'Tema' },
      admin: {
        description: {
          en: 'The four decisions the tokens below are generated from.',
          sv: 'De fyra val som tokens nedan genereras från.'
        },
        components: {
          Field:
            '@codeware/app-cms/ui/fields/theme-studio/ThemeStudioField.client'
        }
      }
    },
    {
      name: 'overrides',
      type: 'json',
      label: { en: 'Overrides', sv: 'Överskrivningar' },
      admin: {
        // Written by the studio's fine-tuning panel, which is where they are
        // shown with the value each one departs from
        hidden: true
      }
    },
    {
      name: 'tokensLight',
      type: 'json',
      required: true,
      label: { en: 'Light tokens', sv: 'Ljusa tokens' },
      admin: {
        description: {
          en: 'Generated by the studio. Editing by hand leaves the theme above out of step.',
          sv: 'Genereras av studion. Redigering för hand gör att temat ovan inte längre stämmer.'
        }
      },
      validate: validateTokens('light')
    },
    {
      name: 'tokensDark',
      type: 'json',
      label: { en: 'Dark tokens', sv: 'Mörka tokens' },
      admin: {
        description: {
          en: 'Only the properties that change in dark. The rest cascade from the light set.',
          sv: 'Bara de variabler som ändras i mörkt läge. Övriga ärvs från den ljusa uppsättningen.'
        }
      },
      validate: validateTokens('dark')
    },
    themeSlugField
  ]
};

export default customThemes;
