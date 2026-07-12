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
  dashboard: z.object({
    badgeDraft: z.string(),
    badgeNew: z.string(),
    badgePublished: z.string(),
    contentLead: z.string(),
    continueEditing: z.string(),
    emptyActivitySub: z.string(),
    emptyActivityTitle: z.string(),
    emptyCta: z.string(),
    emptyDraftsSub: z.string(),
    emptyDraftsTitle: z.string(),
    gettingStartedDismiss: z.string(),
    gettingStartedSub: z.string(),
    gettingStartedTitle: z.string(),
    heading: z.string(),
    items: z.string(),
    lead: z.string(),
    limitLabel: z.string(),
    newButton: z.string(),
    openToEdit: z.string(),
    recentActivity: z.string(),
    tabAllContent: z.string(),
    tabHome: z.string(),
    taskAddPage: z.string(),
    taskAddPageSub: z.string(),
    taskEditMenu: z.string(),
    taskEditMenuSub: z.string(),
    taskInviteTeammate: z.string(),
    taskInviteTeammateSub: z.string(),
    taskReadMessages: z.string(),
    taskReadMessagesSub: z.string(),
    taskReadMessagesSubCount: z.string(),
    taskUploadImage: z.string(),
    taskUploadImageSub: z.string(),
    taskWritePost: z.string(),
    taskWritePostSub: z.string()
  }),
  general: z.object({ clearSelectedColor: z.string() }),
  help: z.object({
    drawerDescription: z.string(),
    drawerTitle: z.string(),
    empty: z.string(),
    loadError: z.string(),
    loading: z.string(),
    manageFaq: z.string(),
    openHelp: z.string()
  }),
  media: z.object({
    calloutDescriptions: z.string(),
    calloutTitle: z.string()
  }),
  nav: z.object({
    accountSettings: z.string(),
    collapseSidebar: z.string(),
    contentLocale: z.string(),
    contentLocaleAria: z.string(),
    create: z.string(),
    expandSidebar: z.string(),
    home: z.string(),
    interfaceLanguage: z.string(),
    logOut: z.string(),
    newBlogPost: z.string(),
    newPage: z.string(),
    noMatches: z.string(),
    openSidebar: z.string(),
    roleEditor: z.string(),
    roleSystemAdmin: z.string(),
    searchPlaceholder: z.string(),
    themeDark: z.string(),
    themeLight: z.string(),
    uploadMedia: z.string()
  }),
  palette: z.object({
    actionGettingStarted: z.string(),
    actionHelp: z.string(),
    dialogDescription: z.string(),
    dialogTitle: z.string(),
    groupActions: z.string(),
    groupNavigation: z.string(),
    groupRecent: z.string(),
    groupWorkspaces: z.string(),
    noResults: z.string(),
    openPalette: z.string(),
    placeholder: z.string(),
    searchError: z.string(),
    searching: z.string(),
    untitled: z.string(),
    workspaceAll: z.string()
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
    dashboard: {
      badgeDraft: 'Draft',
      badgeNew: 'New',
      badgePublished: 'Published',
      contentLead:
        'Everything on your site, grouped by what it does. Open a card to manage its content, or create something new right away.',
      continueEditing: 'Continue editing',
      emptyActivitySub: 'Content you and your team edit will show up here.',
      emptyActivityTitle: 'No activity yet',
      emptyCta: 'Write a post',
      emptyDraftsSub: 'Drafts you are working on will appear here.',
      emptyDraftsTitle: 'No drafts to resume',
      gettingStartedDismiss: 'Hide this checklist',
      gettingStartedSub:
        'A few steps to get your site going. They tick off by themselves as you go.',
      gettingStartedTitle: 'Getting started',
      heading: 'What would you like to do?',
      items: '{{count}} items',
      lead: "Welcome back, {{name}}. Pick a task and we'll open the right place.",
      limitLabel: 'Number of items to show',
      newButton: 'New',
      openToEdit: 'Open to edit',
      recentActivity: 'Recent activity',
      tabAllContent: 'All content',
      tabHome: 'Home',
      taskAddPage: 'Add a page',
      taskAddPageSub: 'Create a new page on the website',
      taskEditMenu: 'Edit the menu',
      taskEditMenuSub: 'Change what appears in navigation',
      taskInviteTeammate: 'Invite a teammate',
      taskInviteTeammateSub: 'Give someone access to the CMS',
      taskReadMessages: 'Read new messages',
      taskReadMessagesSub: 'Check form submissions',
      taskReadMessagesSubCount: '{{count}} form submissions are waiting',
      taskUploadImage: 'Upload an image',
      taskUploadImageSub: 'Put photos or files in the library',
      taskWritePost: 'Write a blog post',
      taskWritePostSub: 'Add a new article to the blog'
    },
    general: {
      clearSelectedColor: 'Clear selected color'
    },
    help: {
      drawerDescription: 'Answers to common questions',
      drawerTitle: 'Help',
      empty: 'No help topics have been added yet.',
      loadError: 'Could not load the help topics. Try again.',
      loading: 'Loading…',
      manageFaq: 'Manage FAQ',
      openHelp: 'Help'
    },
    media: {
      calloutDescriptions: `Tags can be used to organize your files and be displayed in the web site file area.
You can assign multiple tags to a file.`,
      calloutTitle: 'Organize files with tags'
    },
    nav: {
      accountSettings: 'Account settings',
      collapseSidebar: 'Collapse sidebar',
      contentLocale: 'Content',
      contentLocaleAria: 'Content language',
      create: 'Create',
      expandSidebar: 'Expand sidebar',
      home: 'Home',
      interfaceLanguage: 'Interface language',
      logOut: 'Log out',
      newBlogPost: 'New blog post',
      newPage: 'New page',
      noMatches: 'No matches',
      openSidebar: 'Open menu',
      roleEditor: 'Editor',
      roleSystemAdmin: 'System admin',
      searchPlaceholder: 'Filter menu…',
      themeDark: 'Dark mode',
      themeLight: 'Light mode',
      uploadMedia: 'Upload media'
    },
    palette: {
      actionGettingStarted: 'Show getting started',
      actionHelp: 'Open help',
      dialogDescription: 'Search content and run quick actions',
      dialogTitle: 'Command palette',
      groupActions: 'Quick actions',
      groupNavigation: 'Go to',
      groupRecent: 'Recent',
      groupWorkspaces: 'Workspaces',
      noResults: 'No results for "{{query}}"',
      openPalette: 'Search',
      placeholder: 'Search or jump to…',
      searchError: 'Search failed. Try again.',
      searching: 'Searching…',
      untitled: 'Untitled',
      workspaceAll: 'All workspaces'
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
    dashboard: {
      badgeDraft: 'Utkast',
      badgeNew: 'Ny',
      badgePublished: 'Publicerad',
      contentLead:
        'Allt på din webbplats, grupperat efter funktion. Öppna ett kort för att hantera innehållet, eller skapa något nytt direkt.',
      continueEditing: 'Fortsätt redigera',
      emptyActivitySub: 'Innehåll som du och ditt team redigerar visas här.',
      emptyActivityTitle: 'Ingen aktivitet ännu',
      emptyCta: 'Skriv ett inlägg',
      emptyDraftsSub: 'Utkast som du arbetar med visas här.',
      emptyDraftsTitle: 'Inga utkast att fortsätta med',
      gettingStartedDismiss: 'Dölj den här checklistan',
      gettingStartedSub:
        'Några steg för att komma igång med din webbplats. De bockas av automatiskt medan du arbetar.',
      gettingStartedTitle: 'Kom igång',
      heading: 'Vad vill du göra?',
      items: '{{count}} objekt',
      lead: 'Välkommen tillbaka, {{name}}. Välj en uppgift så öppnar vi rätt ställe.',
      limitLabel: 'Antal poster som visas',
      newButton: 'Ny',
      openToEdit: 'Öppna för att redigera',
      recentActivity: 'Senaste aktivitet',
      tabAllContent: 'Allt innehåll',
      tabHome: 'Hem',
      taskAddPage: 'Lägg till en sida',
      taskAddPageSub: 'Skapa en ny sida på webbplatsen',
      taskEditMenu: 'Redigera menyn',
      taskEditMenuSub: 'Ändra vad som visas i navigeringen',
      taskInviteTeammate: 'Bjud in en kollega',
      taskInviteTeammateSub: 'Ge någon åtkomst till CMS:et',
      taskReadMessages: 'Läs nya meddelanden',
      taskReadMessagesSub: 'Kontrollera formulärsvar',
      taskReadMessagesSubCount: '{{count}} formulärsvar väntar',
      taskUploadImage: 'Ladda upp en bild',
      taskUploadImageSub: 'Lägg bilder eller filer i biblioteket',
      taskWritePost: 'Skriv ett blogginlägg',
      taskWritePostSub: 'Lägg till en ny artikel på bloggen'
    },
    general: {
      clearSelectedColor: 'Ta bort vald färg'
    },
    help: {
      drawerDescription: 'Svar på vanliga frågor',
      drawerTitle: 'Hjälp',
      empty: 'Inga hjälpavsnitt har lagts till ännu.',
      loadError: 'Kunde inte ladda hjälpavsnitten. Försök igen.',
      loading: 'Laddar…',
      manageFaq: 'Hantera vanliga frågor',
      openHelp: 'Hjälp'
    },
    media: {
      calloutDescriptions: `Använd etiketter för att organisera dina filer och då kunna visa dem på webbplatsens filyta.
Du kan tilldela flera etiketter till en fil.`,
      calloutTitle: 'Organisera filer med etiketter'
    },
    nav: {
      accountSettings: 'Kontoinställningar',
      collapseSidebar: 'Fäll ihop sidofältet',
      contentLocale: 'Innehåll',
      contentLocaleAria: 'Innehållsspråk',
      create: 'Skapa',
      expandSidebar: 'Expandera sidofältet',
      home: 'Hem',
      interfaceLanguage: 'Gränssnittsspråk',
      logOut: 'Logga ut',
      newBlogPost: 'Nytt blogginlägg',
      newPage: 'Ny sida',
      noMatches: 'Inga träffar',
      openSidebar: 'Öppna menyn',
      roleEditor: 'Redaktör',
      roleSystemAdmin: 'Systemadministratör',
      searchPlaceholder: 'Filtrera menyn…',
      themeDark: 'Mörkt läge',
      themeLight: 'Ljust läge',
      uploadMedia: 'Ladda upp media'
    },
    palette: {
      actionGettingStarted: 'Visa kom igång',
      actionHelp: 'Öppna hjälpen',
      dialogDescription: 'Sök innehåll och kör snabbåtgärder',
      dialogTitle: 'Kommandopalett',
      groupActions: 'Snabbåtgärder',
      groupNavigation: 'Gå till',
      groupRecent: 'Senaste',
      groupWorkspaces: 'Arbetsytor',
      noResults: 'Inga träffar för "{{query}}"',
      openPalette: 'Sök',
      placeholder: 'Sök eller hoppa till…',
      searchError: 'Sökningen misslyckades. Försök igen.',
      searching: 'Söker…',
      untitled: 'Namnlös',
      workspaceAll: 'Alla arbetsytor'
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
