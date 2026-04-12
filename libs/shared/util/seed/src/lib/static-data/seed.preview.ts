// This file is custom generated and should not be edited unless necessary.

import { capitalize } from '@codeware/shared/util/pure';

import { readMediaFiles } from './read-media-files';

const tenantSlug = {
  bamse: 'bamse',
  marvel: 'marvel',
  starWars: 'star-wars'
} as const;

const tenant = {
  bamse: { apiKey: 'b1e5c8c9-8c9b-4a1d-9c3a-7f0e5d6a1b2c' },
  marvel: { apiKey: 'd6480d2c-a74c-4ecb-81c4-278dfd11cc1c' },
  starWars: { apiKey: '8a5af03d-7382-40af-bb75-ee12c62ace23' }
} as const;

const tenantApiKeys = Object.values(tenant).map((tenant) => tenant.apiKey);

/**
 * Seed data for **PREVIEW** environment.
 *
 * @param remoteDataUrl Required for seeding media files from remote URL.
 * @returns Base seed data for the application.
 */
export const seedData = (remoteDataUrl: string | undefined) => {
  const mediaFiles = readMediaFiles(remoteDataUrl);
  if (mediaFiles.length === 0) {
    console.error('No media files found for seeding.');
  }

  return {
    categories: [
      {
        name: 'Spacecrafts',
        slug: 'spacecrafts',
        tenant: { lookupApiKey: tenant.starWars.apiKey }
      },
      {
        name: 'Technology',
        slug: 'technology',
        tenant: { lookupApiKey: tenant.marvel.apiKey }
      },
      {
        name: 'Biodling',
        slug: 'biodling',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      }
    ],
    // All tenants are seeded with media files
    media: tenantApiKeys.flatMap((lookupApiKey) =>
      mediaFiles.map(({ filePath, filename }) => ({
        alt: capitalize(filename.replace(/-/g, ' ').replace(/\.[^/.]+$/, '')),
        external: true,
        filename,
        filePath,
        tags: [{ lookupSlug: 'file-area' }],
        tenant: { lookupApiKey }
      }))
    ),
    pages: [
      // =========
      // Star Wars
      // =========
      {
        name: 'Home',
        slug: 'home',
        header: 'Welcome to the Galaxy Archives',
        layoutContent:
          "## About Our Galaxy\n\nWelcome to a journey through the Star Wars universe! Here you'll find information about some of the most iconic characters who have shaped the fate of the galaxy. From wise Jedi Masters to brave Rebels, our archives contain knowledge spanning multiple eras of galactic history.\n\n## Featured Content\n\nExplore our collection of character profiles, each telling the story of individuals who have left their mark on the galaxy. Whether you're interested in the ways of the Force or the struggles of the Rebellion, you'll find detailed information about their roles, achievements, and impact on galactic events.",
        tenant: { lookupApiKey: tenant.starWars.apiKey }
      },
      {
        name: 'Obi-Wan',
        slug: 'obi-wan-kenobi',
        header: 'Obi-Wan Kenobi: The Legendary Jedi Master',
        layoutContent:
          "## The Negotiator\n\nObi-Wan Kenobi, also known as Ben Kenobi, was a legendary Jedi Master who served the Galactic Republic during its final years. Renowned for his skills as a negotiator, he earned his nickname through his preferred approach to conflict resolution.\n\n## Legacy of Training\n\nAs a Jedi Master, Obi-Wan was responsible for training Anakin Skywalker, who would later become Darth Vader. Years later, he would also become Luke Skywalker's first mentor in the ways of the Force, setting in motion events that would eventually lead to the fall of the Galactic Empire.",
        tenant: { lookupApiKey: tenant.starWars.apiKey }
      },
      {
        name: 'Leia',
        slug: 'princess-leia',
        header: 'Princess Leia Organa: Leader of the Rebellion',
        layoutContent:
          "## Royal Heritage\n\nPrincess Leia Organa of Alderaan was one of the Rebellion's greatest leaders. Adopted daughter of Bail and Breha Organa, she grew up as part of Alderaan's royal family while secretly being trained in politics and resistance.\n\n## Rebel Leader\n\nAs a leader of the Rebel Alliance, Leia demonstrated exceptional tactical ability and unwavering courage. Her diplomatic skills, combined with her fierce determination, made her an instrumental figure in the fight against the Empire.",
        tenant: { lookupApiKey: tenant.starWars.apiKey }
      },
      {
        name: 'Luke',
        slug: 'luke-skywalker',
        header: 'Luke Skywalker: The Last Jedi',
        layoutContent:
          '## Journey to Becoming a Jedi\n\nLuke Skywalker began his journey as a simple moisture farmer on Tatooine before discovering his connection to the Force. Under the guidance of Obi-Wan Kenobi and later Master Yoda, he embarked on the path to become a Jedi Knight.\n\n## Hero of the Rebellion\n\nAs the pilot who destroyed the first Death Star and later a full-fledged Jedi Knight, Luke became a symbol of hope for the Rebel Alliance. His unwavering belief in the good within his father ultimately led to the redemption of Anakin Skywalker and the downfall of the Empire.',
        tenant: { lookupApiKey: tenant.starWars.apiKey }
      },
      {
        name: 'Yoda',
        slug: 'master-yoda',
        header: 'Master Yoda: The Wise Jedi Master',
        layoutContent:
          '## Grand Master of the Jedi Order\n\nFor over 800 years, Yoda trained Jedi as the Grand Master of the Jedi Order. His wisdom, deep connection to the Force, and unique teaching methods helped shape generations of Jedi Knights.\n\n## Legacy of Wisdom\n\nEven in exile after the fall of the Republic, Yoda continued to serve the light side of the Force. His training of Luke Skywalker proved crucial in preserving the Jedi ways and ultimately bringing balance to the Force.',
        tenant: { lookupApiKey: tenant.starWars.apiKey }
      },
      {
        name: 'Darth Vader',
        slug: 'darth-vader',
        header: 'Darth Vader: Dark Lord of the Sith',
        layoutContent:
          "## Rise of Vader\n\nOnce a powerful Jedi Knight, Anakin Skywalker was seduced by the dark side of the Force and became Darth Vader. As the Emperor's chief enforcer, he helped hunt down the remaining Jedi and establish Imperial rule across the galaxy.\n\n## The Empire's Enforcer\n\nAs a Dark Lord of the Sith, Vader commanded the Empire's military might with terrifying efficiency. His mastery of the Force and tactical brilliance made him one of the most feared figures in the galaxy.",
        tenant: { lookupApiKey: tenant.starWars.apiKey }
      },
      // ======
      // Marvel
      // ======
      {
        name: 'Home',
        slug: 'home',
        header: 'Welcome to the Marvel Universe',
        layoutContent:
          "## About Our Universe\n\nStep into the magnificent world of Marvel! Here you'll discover information about some of Earth's mightiest heroes and most compelling characters. From super soldiers to genius inventors, our archives contain knowledge spanning multiple eras of heroic adventures.\n\n## Featured Content\n\nDive into our collection of character profiles, each telling the story of remarkable individuals who have shaped the fate of our world and beyond. Whether you're interested in technological marvels or mystical powers, you'll find detailed information about their origins, abilities, and greatest achievements.",
        tenant: { lookupApiKey: tenant.marvel.apiKey }
      },
      {
        name: 'Iron Man',
        slug: 'iron-man',
        header: 'Tony Stark: The Armored Avenger',
        layoutContent:
          '## Genius Inventor\n\nTony Stark transformed from a brilliant weapons inventor into a hero who would reshape the future of technology and heroism. His revolutionary Iron Man suit represents the pinnacle of human innovation and determination.\n\n## Leader and Protector\n\nAs a founding member of the Avengers, Tony has dedicated his genius and resources to protecting Earth. His journey from self-centered businessman to selfless hero has inspired generations.',
        tenant: { lookupApiKey: tenant.marvel.apiKey }
      },
      {
        name: 'Thor',
        slug: 'thor',
        header: 'Thor: God of Thunder',
        layoutContent:
          "## Asgardian Heritage\n\nThor, son of Odin, wields the mighty hammer Mjolnir as the God of Thunder. His journey between Asgard and Earth has made him a unique bridge between two worlds.\n\n## Mighty Avenger\n\nAs one of Earth's mightiest heroes, Thor brings both godlike power and noble wisdom to the defense of humanity. His growth from an arrogant prince to a humble protector demonstrates the true meaning of worthiness.",
        tenant: { lookupApiKey: tenant.marvel.apiKey }
      },
      {
        name: 'Spider-Man',
        slug: 'spider-man',
        header: 'Peter Parker: The Amazing Spider-Man',
        layoutContent:
          '## Origin Story\n\nBitten by a radioactive spider, Peter Parker gained extraordinary abilities. Living by his uncle\'s words that "with great power comes great responsibility," he became one of New York\'s greatest protectors.\n\n## Friendly Neighborhood Hero\n\nBalancing everyday life with heroic duties, Spider-Man represents the best of both worlds. His wit, intelligence, and unwavering sense of responsibility make him a unique figure in the superhero community.',
        tenant: { lookupApiKey: tenant.marvel.apiKey }
      },
      {
        name: 'Black Widow',
        slug: 'black-widow',
        header: 'Natasha Romanoff: Master Spy and Avenger',
        layoutContent:
          "## Elite Agent\n\nNatasha Romanoff's journey from Russian spy to Avenger is a testament to the power of redemption. Her unparalleled skills in espionage and combat make her one of the world's deadliest operatives.\n\n## Heart of the Team\n\nDespite lacking superhuman powers, Black Widow's strategic mind and unwavering loyalty have made her essential to the Avengers. Her sacrifices and dedication have helped save the world numerous times.",
        tenant: { lookupApiKey: tenant.marvel.apiKey }
      },
      {
        name: 'Hulk',
        slug: 'hulk',
        header: 'Bruce Banner: The Incredible Hulk',
        layoutContent:
          "## Scientific Genius\n\nDr. Bruce Banner's exposure to gamma radiation transformed him into the incredibly powerful Hulk. His struggle to balance his brilliant scientific mind with the raw power of the Hulk defines his unique journey.\n\n## Strongest Avenger\n\nDespite being feared by many, the Hulk has proven himself a hero time and again. Banner's scientific genius combined with Hulk's raw strength makes him one of Earth's most formidable defenders.",
        tenant: { lookupApiKey: tenant.marvel.apiKey }
      },
      // =====
      // Bamse
      // =====
      {
        name: 'Hem',
        slug: 'home',
        header: 'Välkommen till Bamses värld',
        layoutContent:
          '## Om Vår Värld\n\nVälkommen till den fantastiska världen av Bamse! Här kan du upptäcka information om några av de mest älskade karaktärerna i den svenska barnlitteraturen. Från världens starkaste björn till hans modiga vänner, innehåller våra arkiv kunskap som sträcker sig över många äventyr och lärdomar.\n\n## Utvalt Innehåll\n\nUtforska vår samling av karaktärsprofiler, där varje berättar historien om individer som har format Bamses värld. Oavsett om du är intresserad av styrka, vänskap eller mod, hittar du detaljerad information om deras ursprung, egenskaper och största bedrifter.',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      },
      {
        name: 'Bamse',
        slug: 'bamse',
        header: 'Bamse: Världens Starkaste Björn',
        layoutContent:
          '## Om Bamse\n\nBamse är världens starkaste björn, känd för sin vänlighet och mod. Tillsammans med sina vänner, Lille Skutt och Skalman, upplever han många äventyr och lär ut viktiga livslektioner.\n\n## Styrka och Vänskap\n\nBamse använder sin styrka för att hjälpa andra och bekämpa orättvisor. Hans vänskap och lojalitet gör honom till en älskad hjälte i den svenska barnlitteraturen.',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      },
      {
        name: 'Lille Skutt',
        slug: 'lille-skutt',
        header: 'Lille Skutt: Den Modiga Kaninen',
        layoutContent:
          '## Om Lille Skutt\n\nLille Skutt är en modig kanin och en av Bamses bästa vänner. Trots sin rädsla för det mesta, visar han stort mod när det verkligen gäller.\n\n## Mod och Loajalitet\n\nLille Skutt är alltid där för att stödja Bamse och hans vänner. Hans mod och lojalitet gör honom till en viktig del av gänget och en älskad karaktär i Bamses värld.',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      },
      {
        name: 'Skalman',
        slug: 'skalman',
        header: 'Skalman: Den Kloka Sköldpaddan',
        layoutContent:
          '## Om Skalman\n\nSkalman är en klok sköldpadda och en av Bamses närmaste vänner. Han är känd för sina uppfinningar och sin kärlek till mat, särskilt pannkakor.\n\n## Visdom och Uppfinningsrikedom\n\nSkalman använder sin visdom och uppfinningsrikedom för att hjälpa Bamse och Lille Skutt i deras äventyr. Hans kloka råd och innovativa lösningar gör honom till en ovärderlig medlem av gänget.',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      },
      {
        name: 'Vargen',
        slug: 'vargen',
        header: 'Vargen: Den Listiga Skurken',
        layoutContent:
          '## Om Vargen\n\nVargen är den listiga skurken i Bamses värld. Trots sina många försök att stjäla Bamses dunderhonung, misslyckas han alltid på grund av sin egen klumpighet och Bamses styrka.\n\n## List och Komik\n\nVargens ständiga försök att överlista Bamse och hans vänner ger upphov till många komiska situationer. Hans envishet och misslyckanden gör honom till en underhållande karaktär i berättelserna.',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      },
      {
        name: 'Farmor',
        slug: 'farmor',
        header: 'Farmor: Den Omtänksamma Äldre Damen',
        layoutContent:
          '## Om Farmor\n\nFarmor är Bamses omtänksamma och kloka farmor. Hon tar hand om Bamse och hans vänner, och hennes kök är alltid fullt av god mat och kärlek.\n\n## Omtanke och Visdom\n\nFarmors kärlek och visdom är en viktig del av Bamses värld. Hon ger råd och stöd till Bamse och hans vänner, och hennes närvaro skapar en känsla av trygghet och värme i berättelserna.',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      }
    ],
    posts: [
      {
        title: 'The Rise and Fall of the Empire',
        slug: 'rise-and-fall-of-empire',
        createdAt: '2026-09-01',
        authors: [{ lookupEmail: 'yoda@local.dev' }],
        categories: [],
        content:
          '## The Birth of Imperial Rule\n\nThe transformation of the Republic into the Empire stands as one of the most significant events in galactic history.\n\n> "So this is how liberty dies... with thunderous applause." - Padmé Amidala\n\nThe key factors that enabled Palpatine\'s rise to power:\n\n* The manipulation of the Trade Federation\n* The engineered Clone Wars\n* The systematic dismantling of democratic institutions\n* The turning of Anakin Skywalker\n\n## The Rebellion Rises\n\nFrom the ashes of the Republic, hope emerged. The Rebel Alliance formed from:\n\n* Disillusioned Senators\n* Former Republic military officers\n* Oppressed planetary systems\n* Idealistic freedom fighters\n\n> "The more you tighten your grip, Tarkin, the more star systems will slip through your fingers."\n\n## Legacy\n\nThe Empire\'s fall teaches us that:\n\n* No military might can overcome the will of free peoples\n* Hope remains strongest in the darkest times\n* The light side of the Force will always prevail',
        tenant: { lookupApiKey: tenant.starWars.apiKey }
      },
      {
        title: 'Jedi Training Methods',
        slug: 'jedi-training-methods',
        createdAt: '2026-09-15',
        authors: [{ lookupEmail: 'luke@local.dev' }],
        categories: [],
        content:
          '## Traditional Approaches\n\n> "A Jedi must have the deepest commitment, the most serious mind." - Master Yoda\n\nThe path to becoming a Jedi requires:\n\n* Meditation and Force attunement\n* Lightsaber combat training\n* Study of Jedi philosophy\n* Practical application of Force abilities\n\n## Modern Adaptations\n\nThe changing galaxy has necessitated new training methods:\n\n* Accelerated combat training\n* Focus on practical Force applications\n* Emphasis on stealth and survival\n* Integration of modern technology\n\n> "Your focus determines your reality."\n\nRemember that the Force:\n\n* Flows through all living things\n* Requires balance and harmony\n* Demands patience and discipline',
        tenant: { lookupApiKey: tenant.starWars.apiKey }
      },
      {
        title: 'Spacecraft of the Rebellion',
        slug: 'spacecraft-of-rebellion',
        createdAt: '2026-09-30',
        authors: [
          { lookupEmail: 'luke@local.dev' },
          { lookupEmail: 'yoda@local.dev' }
        ],
        categories: [{ lookupSlug: 'spacecrafts' }],
        content:
          '## Famous Vessels\n\nThe Rebel Alliance relied on various spacecraft to combat the Empire:\n\n* X-wing Starfighter\n  * Versatile and agile\n  * Equipped with hyperdrive\n  * Proven track record\n* Y-wing Bomber  * Durable design\n  * Heavy payload capacity\n\n> "She may not look like much, but she\'s got it where it counts, kid."\n\n## Iconic Modifications\n\nThe most successful modifications included:\n\n* Enhanced shield generators\n* Modified weapon systems\n* Upgraded navigation computers\n\n> "Great shot kid, that was one in a million!"\n\nMaintenance tips:\n\n* Regular hyperdrive alignment\n* Frequent shield calibration\n* Careful power distribution',
        tenant: { lookupApiKey: tenant.starWars.apiKey }
      },
      {
        title: 'Evolution of the Avengers',
        slug: 'evolution-of-avengers',
        createdAt: '2026-10-05',
        authors: [{ lookupEmail: 'thor@local.dev' }],
        categories: [],
        content:
          '## The Initiative\n\n> "There was an idea... to bring together a group of remarkable people."\n\nThe original team formed from:\n\n* Tony Stark - Technical genius\n* Steve Rogers - Natural leader\n* Thor - Asgardian strength\n* Bruce Banner - Scientific brilliance\n* Natasha Romanoff - Strategic expertise\n* Clint Barton - Precision and skill\n\n## Team Dynamics\n\nKey factors in the team\'s success:\n\n* Complementary abilities\n* Trust building\n* Shared mission focus\n* Adaptability in crisis\n\n> "We may not be able to save the Earth, but you can be damn sure we\'ll avenge it."\n\nLessons learned:\n\n* Unity overcomes individual limitations\n* Leadership requires sacrifice\n* Heroes can come from anywhere',
        tenant: { lookupApiKey: tenant.marvel.apiKey }
      },
      {
        title: 'Science of Super Soldiers',
        slug: 'science-of-super-soldiers',
        createdAt: '2026-10-10',
        authors: [{ lookupEmail: 'hulk@local.dev' }],
        categories: [],
        content:
          '## Historical Development\n\nThe super soldier program revolutionized human enhancement:\n\n* Dr. Erskine\'s Original Formula\n  * Enhanced strength\n  * Improved agility\n  * Accelerated healing\n* Modern Attempts\n  * Various successes and failures\n  * Ethical considerations\n\n> "The serum amplifies everything that is inside. Good becomes great; bad becomes worse."\n\n## Current Research\n\nAreas of ongoing investigation:\n\n* Genetic modification\n* Biological enhancement\n* Technological integration\n* Neural advancement\n\n> "Our very strength invites challenge. Challenge incites conflict. And conflict... breeds catastrophe."',
        tenant: { lookupApiKey: tenant.marvel.apiKey }
      },
      {
        title: 'Tech Revolution',
        slug: 'tech-revolution',
        createdAt: '2026-10-12',
        authors: [{ lookupEmail: 'hulk@local.dev' }],
        categories: [{ lookupSlug: 'technology' }],
        content:
          '## Arc Reactor Technology\n\n> "Sometimes you gotta run before you can walk."\n\nKey innovations include:\n\n* Miniaturized power sources\n* Clean energy applications\n* Advanced propulsion systems\n* Neural interface developments\n\n## Future of Combat Suits\n\nNext-generation features:\n\n* Nano-tech integration\n* AI-driven responses\n* Adaptive armor systems\n* Multi-environment functionality\n\n> "The suit and I are one."\n\nSafety protocols:\n\n* Biometric security\n* Emergency protocols\n* Power management\n* Environmental controls',
        tenant: { lookupApiKey: tenant.marvel.apiKey }
      },
      // =====
      // Bamse
      // =====
      {
        title: 'Bamses Styrka',
        slug: 'bamses-styrka',
        createdAt: '2026-10-15',
        authors: [{ lookupEmail: 'bamse@local.dev' }],
        categories: [{ lookupSlug: 'biodling' }],
        content:
          '## Bamses Styrka\n\n> "Styrka kommer från vänskap och mod."\n\nBamse är världens starkaste björn:\n\n* Styrka från dunderhonung\n* Mod och vänskap\n* Skyddar de svaga\n* Lär ut viktiga värderingar\n\n## Äventyr och Lärdomar\n\nBamses äventyr:\n\n* Hjälper vänner i nöd\n* Bekämpar orättvisor\n* Lär ut moral och etik\n* Inspirerar till godhet\n\n> "Med styrka kommer ansvar."',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      },
      {
        title: 'Vänskapens Kraft',
        slug: 'vanskapens-kraft',
        createdAt: '2026-10-20',
        authors: [{ lookupEmail: 'bamse@local.dev' }],
        categories: [],
        content:
          '## Vänskapens Kraft\n\n> "Vänskap är den största styrkan."\n\nBamse och hans vänner visar:\n\n* Vikten av samarbete\n* Att stå upp för varandra\n* Att hjälpa de som behöver det mest\n* Att sprida godhet och vänlighet\n\n## Lärdomar\n\nVänskapens lärdomar:\n\n* Styrka genom gemenskap\n* Mod att göra det rätta\n* Att värdera och respektera andra\n* Att inspirera till positiva handlingar\n\n> "Med vänskap kommer ansvar."',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      },
      {
        title: 'Skalman och Uppfinningarnas Värld',
        slug: 'skalman-och-uppfinningarnas-varld',
        createdAt: '2026-10-25',
        authors: [
          { lookupEmail: 'bamse@local.dev' },
          { lookupEmail: 'skutt@local.dev' }
        ],
        categories: [],
        content:
          '## Skalman och Uppfinningarnas Värld\n\n> "Uppfinningar gör världen bättre."\n\nSkalman är en mästare på uppfinningar:\n\n* Skapande av innovativa lösningar\n* Teknologiska framsteg\n* Vetenskapliga upptäckter\n* Inspirerar till kreativitet\n\n## Äventyr och Lärdomar\n\nSkalmans äventyr:\n\n* Hjälper vänner med uppfinningar\n* Löser problem med kreativitet\n* Lär ut vetenskap och teknik\n* Inspirerar till innovation\n\n> "Med kunskap kommer ansvar."',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      },
      {
        title: 'Vargens List och Komik',
        slug: 'vargens-list-och-komik',
        createdAt: '2026-10-30',
        authors: [
          { lookupEmail: 'bamse@local.dev' },
          { lookupEmail: 'skutt@local.dev' }
        ],
        categories: [],
        content:
          '## Vargens List och Komik\n\n> "List och humor går hand i hand."\n\nVargen är känd för sin list och komik:\n\n* Skicklig på att lösa problem\n* Använder humor för att lätta upp stämningen\n* Inspirerar till kreativt tänkande\n* Lär ut vikten av att tänka utanför boxen\n\n## Äventyr och Lärdomar\n\nVargens äventyr:\n\n* Hjälper vänner med kluriga situationer\n* Löser problem med list\n* Lär ut vikten av humor och kreativitet\n* Inspirerar till positiva handlingar\n\n> "Med list och humor kommer ansvar."',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      },
      {
        title: 'Farmors Omtanke och Visdom',
        slug: 'farmors-omtanke-och-visdom',
        createdAt: '2026-11-05',
        authors: [{ lookupEmail: 'skutt@local.dev' }],
        categories: [{ lookupSlug: 'biodling' }],
        content:
          '## Farmors Omtanke och Visdom\n\n> "Omtanke och visdom går hand i hand."\n\nFarmor är känd för sin omtanke och visdom:\n\n* Skicklig på att ge råd\n* Inspirerar till eftertanke\n* Lär ut vikten av empati\n* Inspirerar till godhet\n\n## Äventyr och Lärdomar\n\nFarmors äventyr:\n\n* Hjälper vänner med kloka råd\n* Löser problem med visdom\n* Lär ut vikten av omtanke och empati\n* Inspirerar till positiva handlingar\n\n> "Med omtanke och visdom kommer ansvar."',
        tenant: { lookupApiKey: tenant.bamse.apiKey }
      }
    ],
    // All tenants get file area and color-coded tags for testing purposes
    tags: tenantApiKeys.flatMap((lookupApiKey) => {
      const isBamse = lookupApiKey === tenant.bamse.apiKey;
      return [
        {
          name: isBamse ? 'Indigo' : 'Indigo',
          slug: 'indigo',
          brand: { color: 'indigo-500', icon: 'TagIcon' },
          tenant: { lookupApiKey }
        },
        {
          name: isBamse ? 'Orange' : 'Orange',
          slug: 'orange',
          brand: { color: 'orange-500', icon: 'TagIcon' },
          tenant: { lookupApiKey }
        },
        {
          name: isBamse ? 'Teal' : 'Teal',
          slug: 'teal',
          brand: { color: 'teal-500', icon: 'TagIcon' },
          tenant: { lookupApiKey }
        },
        {
          name: isBamse ? 'Filyta' : 'File area',
          slug: 'file-area',
          brand: { color: 'green-500', icon: 'EyeIcon' },
          tenant: { lookupApiKey }
        }
      ];
    }),
    tenants: [
      {
        name: 'Star Wars',
        slug: tenantSlug.starWars,
        description: 'Star Wars inspired tenant.',
        locale: 'en',
        supportedLocales: ['en', 'sv'],
        apiKey: tenant.starWars.apiKey
      },
      {
        name: 'Marvel',
        slug: tenantSlug.marvel,
        description: 'Marvel inspired tenant.',
        locale: 'en',
        supportedLocales: ['en', 'sv'],
        apiKey: tenant.marvel.apiKey
      },
      {
        name: 'Bamse',
        slug: tenantSlug.bamse,
        description: 'Bamse-inspirerad tenant.',
        locale: 'sv',
        supportedLocales: ['sv'],
        apiKey: tenant.bamse.apiKey
      }
    ],
    users: [
      // =========
      // Star Wars
      // =========
      {
        name: 'Yoda',
        description: 'Admin access to Star Wars',
        email: 'yoda@local.dev',
        password: '',
        role: 'user',
        locale: 'en',
        tenants: [
          {
            lookupApiKey: tenant.starWars.apiKey,
            role: 'admin'
          }
        ]
      },
      {
        name: 'Luke',
        description: 'User access to Star Wars',
        email: 'luke@local.dev',
        password: '',
        role: 'user',
        locale: 'en',
        tenants: [{ lookupApiKey: tenant.starWars.apiKey, role: 'user' }]
      },
      // ======
      // Marvel
      // ======
      {
        name: 'Hulk',
        description: 'Admin access to Marvel',
        email: 'hulk@local.dev',
        password: '',
        role: 'user',
        locale: 'en',
        tenants: [
          {
            lookupApiKey: tenant.marvel.apiKey,
            role: 'admin'
          }
        ]
      },
      {
        name: 'Thor',
        description: 'User access to Marvel',
        email: 'thor@local.dev',
        password: '',
        role: 'user',
        locale: 'en',
        tenants: [{ lookupApiKey: tenant.marvel.apiKey, role: 'user' }]
      },
      // =====
      // Bamse
      // =====
      {
        name: 'Bamse',
        description: 'Admin access to Bamse',
        email: 'bamse@local.dev',
        password: '',
        role: 'user',
        locale: 'sv',
        tenants: [{ lookupApiKey: tenant.bamse.apiKey, role: 'admin' }]
      },
      {
        name: 'Lille Skutt',
        description: 'User access to Bamse',
        email: 'skutt@local.dev',
        password: '',
        role: 'user',
        locale: 'sv',
        tenants: [{ lookupApiKey: tenant.bamse.apiKey, role: 'user' }]
      },
      // ======================================
      // System user with access to all tenants
      // ======================================
      {
        name: 'System User',
        description: 'Access to manage the system',
        email: 'system@local.dev',
        password: '',
        role: 'system-user',
        locale: 'en',
        tenants: []
      }
    ]
  };
};
