import type {
  I18n,
  I18nClient,
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
  formSubmissions: z.object({
    allForms: z.string(),
    deletedForm: z.string(),
    empty: z.string(),
    emptyTitle: z.string(),
    exportCsv: z.string(),
    exportNeedsForm: z.string(),
    filterByForm: z.string(),
    markAllRead: z.string(),
    noValues: z.string(),
    orphanedField: z.string(),
    pageOf: z.string(),
    received: z.string(),
    total: z.string(),
    unread: z.string(),
    unreadOnly: z.string()
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
    themeAuto: z.string(),
    themeDark: z.string(),
    themeLight: z.string(),
    uploadMedia: z.string()
  }),
  palette: z.object({
    aboutDescription: z.string(),
    aboutTitle: z.string(),
    actionAbout: z.string(),
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
  tourSignups: z.object({
    anonymize: z.string(),
    anonymizeConfirm: z.string(),
    anonymized: z.string(),
    booked: z.string(),
    cancel: z.string(),
    cancelled: z.string(),
    email: z.string(),
    empty: z.string(),
    emptyUnsaved: z.string(),
    export: z.string(),
    fillSummary: z.string(),
    full: z.string(),
    heading: z.string(),
    moveDown: z.string(),
    moveUp: z.string(),
    name: z.string(),
    notes: z.string(),
    partySize: z.string(),
    people: z.string(),
    phone: z.string(),
    peopleOne: z.string(),
    promote: z.string(),
    queuePosition: z.string(),
    reorderHint: z.string(),
    restore: z.string(),
    saveFailed: z.string(),
    saved: z.string(),
    seatsLeft: z.string(),
    signedUp: z.string(),
    starterFailed: z.string(),
    starterLede: z.string(),
    starterPrivacy: z.string(),
    starterTerms: z.string(),
    status: z.string(),
    statusChanged: z.string(),
    termsAccepted: z.string(),
    waiting: z.string(),
    waitingCount: z.string(),
    waitingHeading: z.string(),
    overbooked: z.string()
  }),
  validation: z.object({
    bookingDeadlineAfterDeparture: z.string(),
    bookingNeedsDeparture: z.string(),
    labelNameTaken: z.string(),
    labelNotFound: z.string(),
    labelWrongType: z.string(),
    mustBelongToWorkspace: z.string(),
    notSupportedLocale: z.string(),
    phoneNumber: z.string(),
    signupWouldOverbook: z.string(),
    tourClosedForSignups: z.string(),
    urlInvalid: z.string()
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
      taskReadMessagesSubCount: '{{count}} unread messages',
      taskUploadImage: 'Upload an image',
      taskUploadImageSub: 'Put photos or files in the library',
      taskWritePost: 'Write a blog post',
      taskWritePostSub: 'Add a new article to the blog'
    },
    formSubmissions: {
      allForms: 'All forms',
      deletedForm: 'Deleted form',
      empty: 'Messages sent through your forms will show up here.',
      emptyTitle: 'No messages',
      exportCsv: 'Export CSV',
      exportNeedsForm: 'Pick a form to export its messages',
      filterByForm: 'Filter by form',
      markAllRead: 'Mark page as read',
      noValues: 'This message has no values.',
      orphanedField: 'This field is no longer part of the form',
      pageOf: 'Page {{page}} of {{total}}',
      received: 'Received {{when}}',
      total: '{{count}} messages',
      unread: 'Unread',
      unreadOnly: 'Unread only'
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
      themeAuto: 'System mode',
      themeDark: 'Dark mode',
      themeLight: 'Light mode',
      uploadMedia: 'Upload media'
    },
    palette: {
      aboutDescription: 'Build and deployment details for this app',
      aboutTitle: 'About',
      actionAbout: 'About',
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
    tourSignups: {
      anonymize: 'Clear passenger data',
      anonymizeConfirm:
        'Clear the name, email, phone and notes on every signup for this tour? Party sizes and statuses are kept. This cannot be undone.',
      anonymized: 'Personal data cleared',
      booked: 'Booked',
      cancel: 'Cancel signup',
      cancelled: 'Cancelled',
      email: 'Email',
      empty: 'Nobody has signed up yet.',
      emptyUnsaved: 'Save the tour first — signups arrive once it exists.',
      export: 'Export passenger list',
      fillSummary: '{{booked}} of {{max}} places taken',
      full: 'Full',
      heading: 'Signups',
      moveDown: 'Move down the queue',
      moveUp: 'Move up the queue',
      name: 'Name',
      notes: 'Notes',
      partySize: 'Party size',
      people: '{{count}} people',
      phone: 'Phone',
      peopleOne: '1 person',
      promote: 'Move to booked',
      queuePosition: 'Queue position',
      reorderHint:
        'Drag to set the order you will offer places in. Signup times stay as they were.',
      restore: 'Restore signup',
      saveFailed: 'Could not save the change.',
      saved: 'Saved',
      seatsLeft: '{{count}} places left',
      signedUp: 'Signed up',
      starterFailed: 'Could not create the page.',
      starterLede:
        'No page yet? Create a draft from our template, then review and publish it — it describes how signups are handled here, but it is not legal advice.',
      starterPrivacy: 'Create a starter privacy page',
      starterTerms: 'Create a starter terms page',
      status: 'Status',
      statusChanged: 'Status changed',
      termsAccepted: 'Terms accepted',
      waiting: 'Waiting list',
      waitingCount: '+{{count}} waiting',
      waitingHeading: 'Waiting list',
      overbooked: 'Overbooked'
    },
    validation: {
      bookingDeadlineAfterDeparture:
        'The booking deadline must be on or before the departure date.',
      bookingNeedsDeparture:
        'A tour can only be booked once it has a departure date. Use "Register interest" while the date is unconfirmed.',
      labelNameTaken: 'A "{{type}}" label named "{{name}}" already exists.',
      labelNotFound: 'The selected label no longer exists.',
      labelWrongType: 'Expected a "{{expected}}" label but got "{{actual}}".',
      mustBelongToWorkspace: 'User must belong to a workspace.',
      notSupportedLocale: `Selected locale "{{locale}}" is not supported by the current tenant.
Supported locales: {{locales}}`,
      phoneNumber: 'Please enter a valid phone number',
      signupWouldOverbook:
        'Only {{available}} of {{max}} places are left and this signup needs {{people}}. Cancel a booking or raise the maximum first.',
      tourClosedForSignups: 'This tour is closed for signups.',
      urlInvalid: 'Please enter a valid URL'
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
      taskReadMessagesSubCount: '{{count}} olästa meddelanden',
      taskUploadImage: 'Ladda upp en bild',
      taskUploadImageSub: 'Lägg bilder eller filer i biblioteket',
      taskWritePost: 'Skriv ett blogginlägg',
      taskWritePostSub: 'Lägg till en ny artikel på bloggen'
    },
    formSubmissions: {
      allForms: 'Alla formulär',
      deletedForm: 'Borttaget formulär',
      empty: 'Meddelanden som skickas via dina formulär visas här.',
      emptyTitle: 'Inga meddelanden',
      exportCsv: 'Exportera CSV',
      exportNeedsForm: 'Välj ett formulär för att exportera dess meddelanden',
      filterByForm: 'Filtrera på formulär',
      markAllRead: 'Markera sidan som läst',
      noValues: 'Det här meddelandet innehåller inga värden.',
      orphanedField: 'Fältet ingår inte längre i formuläret',
      pageOf: 'Sida {{page}} av {{total}}',
      received: 'Mottaget {{when}}',
      total: '{{count}} meddelanden',
      unread: 'Oläst',
      unreadOnly: 'Endast olästa'
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
      themeAuto: 'Systemläge',
      themeDark: 'Mörkt läge',
      themeLight: 'Ljust läge',
      uploadMedia: 'Ladda upp media'
    },
    palette: {
      aboutDescription: 'Bygg- och distributionsdetaljer för appen',
      aboutTitle: 'Om',
      actionAbout: 'Om',
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
    tourSignups: {
      anonymize: 'Rensa passageraruppgifter',
      anonymizeConfirm:
        'Vill du rensa namn, e-post, telefon och anteckningar på alla anmälningar för den här resan? Antal personer och status behålls. Detta går inte att ångra.',
      anonymized: 'Personuppgifter rensade',
      booked: 'Bokad',
      cancel: 'Avboka',
      cancelled: 'Avbokad',
      email: 'E-post',
      empty: 'Ingen har anmält sig ännu.',
      emptyUnsaved: 'Spara resan först — anmälningar kommer när den finns.',
      export: 'Exportera passagerarlista',
      fillSummary: '{{booked}} av {{max}} platser tagna',
      full: 'Fullbokad',
      heading: 'Anmälningar',
      moveDown: 'Flytta ned i kön',
      moveUp: 'Flytta upp i kön',
      name: 'Namn',
      notes: 'Anteckningar',
      partySize: 'Antal personer',
      people: '{{count}} personer',
      phone: 'Telefon',
      peopleOne: '1 person',
      promote: 'Gör till bokad',
      queuePosition: 'Köplats',
      reorderHint:
        'Dra för att ställa in i vilken ordning du erbjuder platser. Anmälningstiderna påverkas inte.',
      restore: 'Återställ anmälan',
      saveFailed: 'Det gick inte att spara ändringen.',
      saved: 'Sparat',
      seatsLeft: '{{count}} platser kvar',
      signedUp: 'Anmäld',
      starterFailed: 'Det gick inte att skapa sidan.',
      starterLede:
        'Saknar du sida? Skapa ett utkast från vår mall, läs igenom och publicera — den beskriver hur anmälningar hanteras här, men är inte juridisk rådgivning.',
      starterPrivacy: 'Skapa utkast till integritetssida',
      starterTerms: 'Skapa utkast till villkorssida',
      status: 'Status',
      statusChanged: 'Status ändrad',
      termsAccepted: 'Villkor godkända',
      waiting: 'Väntelista',
      waitingCount: '+{{count}} i kö',
      waitingHeading: 'Väntelista',
      overbooked: 'Överbokad'
    },
    validation: {
      bookingDeadlineAfterDeparture:
        'Sista bokningsdag måste vara samma dag som eller före avresedatum.',
      bookingNeedsDeparture:
        'En resa kan bara bokas när den har ett avresedatum. Använd "Intresseanmälan" så länge datumet inte är fastställt.',
      labelNameTaken:
        'Det finns redan en etikett av typen "{{type}}" med namnet "{{name}}".',
      labelNotFound: 'Den valda etiketten finns inte längre.',
      labelWrongType:
        'Förväntade en etikett av typen "{{expected}}" men fick "{{actual}}".',
      mustBelongToWorkspace: 'Användaren måste tillhöra en arbetsyta.',
      notSupportedLocale: `Valt språk "{{locale}}" stöds inte av den aktuella arbetsytan.
Språk som stöds: {{locales}}`,
      phoneNumber: 'Ange ett giltigt telefonnummer',
      signupWouldOverbook:
        'Endast {{available}} av {{max}} platser återstår och anmälan behöver {{people}}. Avboka någon eller höj maxantalet först.',
      tourClosedForSignups: 'Resan är stängd för anmälan.',
      urlInvalid: 'Ange en giltig webbadress'
    }
  }
};

/**
 * Re-type a Payload `t` so our own translation keys resolve.
 *
 * Accepts the client variant too, for admin views that render on the server
 * and only get `i18n` from `ServerProps`.
 */
export const customT = (t: I18n['t'] | I18nClient['t']) =>
  t as TFunction<TranslationsKeys>;

export type TranslationsObject = CustomTranslations & typeof enTranslations;
export type TranslationsKeys = NestedKeysStripped<TranslationsObject>;
