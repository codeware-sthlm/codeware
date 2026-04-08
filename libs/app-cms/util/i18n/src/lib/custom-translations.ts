import type {
  I18n,
  NestedKeysStripped,
  TFunction
} from '@payloadcms/translations';
import { enTranslations } from '@payloadcms/translations/languages/en';
import z from 'zod';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const customTranslationsSchema = z.object({
  authentication: z.object({
    cannotAssignToWorkspace: z.string(),
    cannotRemoveFromWorkspace: z.string(),
    crossTenantDenied: z.string()
  }),
  collection: z.object({
    cardWithSuffix: z.string(),
    socialMediaWithSuffix: z.string()
  }),
  general: z.object({ clearSelectedColor: z.string() }),
  media: z.object({
    calloutDescriptions: z.string(),
    calloutTitle: z.string()
  }),
  validation: z.object({
    mustBelongToWorkspace: z.string(),
    notSupportedLocale: z.string(),
    phoneNumber: z.string()
  })
});

type CustomTranslations = z.infer<typeof customTranslationsSchema>;

export const customTranslations: Record<'en' | 'sv', CustomTranslations> = {
  en: {
    authentication: {
      cannotAssignToWorkspace:
        "You don't have permission to assign users to this workspace.",
      cannotRemoveFromWorkspace:
        "You don't have permission to remove users from this workspace.",
      crossTenantDenied:
        'Access denied. This workspace is not accessible without proper tenant access.'
    },
    collection: {
      cardWithSuffix: 'Card {{suffix}}',
      socialMediaWithSuffix: 'Social Media {{suffix}}'
    },
    general: {
      clearSelectedColor: 'Clear selected color'
    },
    media: {
      calloutDescriptions: `Use tags to organize your media files and easily select them in file areas.
Tags can be created in the "Tags" collection.
You can assign multiple tags to a media file.`,
      calloutTitle: 'Using tags to organize media files'
    },
    validation: {
      mustBelongToWorkspace: 'User must belong to a workspace.',
      notSupportedLocale: `Selected locale "{{locale}}" is not supported by the current tenant.
Supported locales: {{locales}}`,
      phoneNumber: 'Please enter a valid phone number'
    }
  },
  sv: {
    authentication: {
      cannotAssignToWorkspace:
        'Du har inte behörighet att tilldela användare till den här arbetsytan.',
      cannotRemoveFromWorkspace:
        'Du har inte behörighet att ta bort användare från den här arbetsytan.',
      crossTenantDenied:
        'Åtkomst nekad. Den här arbetsytan är inte tillgänglig utan rätt behörighet.'
    },
    collection: {
      cardWithSuffix: 'Kort {{suffix}}',
      socialMediaWithSuffix: 'Sociala Medier {{suffix}}'
    },
    general: {
      clearSelectedColor: 'Ta bort vald färg'
    },
    media: {
      calloutDescriptions: `Använd etiketter för att organisera dina mediafiler och enkelt välja dem i filområden.
Etiketter kan skapas i samlingen "Etiketter".
Du kan tilldela flera etiketter till en mediafil.`,
      calloutTitle: 'Använd etiketter för att organisera mediafiler'
    },
    validation: {
      mustBelongToWorkspace: 'Användaren måste tillhöra en arbetsyta.',
      notSupportedLocale: `Valt språk "{{locale}}" stöds inte av den aktuella arbetsytan.
Språk som stöds: {{locales}}`,
      phoneNumber: 'Ange ett giltigt telefonnummer'
    }
  }
};

export const customT = (t: I18n['t']) => t as TFunction<TranslationsKeys>;

export type TranslationsObject = CustomTranslations & typeof enTranslations;
export type TranslationsKeys = NestedKeysStripped<TranslationsObject>;
