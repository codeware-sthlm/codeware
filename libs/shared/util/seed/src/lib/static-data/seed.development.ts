// This file is custom generated and should not be edited unless necessary.

import { capitalize } from '@codeware/shared/util/pure';

import { readMediaFiles } from './read-media-files';

/**
 * Seed data for **DEVELOPMENT** environment.
 *
 * @param remoteDataUrl Optionally read remote media files from a URL, otherwise read local media files.
 * @returns Base seed data for the application.
 */
export const seedData = (remoteDataUrl: string | undefined) => {
  const mediaFiles = readMediaFiles(remoteDataUrl);
  if (mediaFiles.length === 0) {
    console.warn('No media files found for seeding.');
  }

  return {
    categories: [
      {
        name: 'Star Types',
        slug: 'star-types',
        tenant: { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542' }
      },
      {
        name: 'Star Clusters',
        slug: 'star-clusters',
        tenant: { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542' }
      },
      {
        name: 'Stellar Evolution',
        slug: 'stellar-evolution',
        tenant: { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542' }
      },
      {
        name: 'Lunar Features',
        slug: 'lunar-features',
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      },
      {
        name: 'Moon Phases',
        slug: 'moon-phases',
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      },
      {
        name: 'Planetary Moons',
        slug: 'planetary-moons',
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      },
      {
        name: 'Solar Activity',
        slug: 'solar-activity',
        tenant: { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985' }
      },
      {
        name: 'Solar System',
        slug: 'solar-system',
        tenant: { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985' }
      }
    ],
    // Only moon tenant is seeded with media files
    media: mediaFiles.map(({ filePath, filename }) => ({
      alt: capitalize(filename.replace(/-/g, ' ').replace(/\.[^/.]+$/, '')),
      external: true,
      filename,
      filePath,
      tags: [{ lookupSlug: 'file-area' }],
      tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
    })),
    pages: [
      {
        name: 'Red Giants',
        header: 'Massive Stars in Their Late Stage',
        layoutContent:
          "## Red Giants 🔴\nRed giants are stars that have exhausted the hydrogen fuel in their cores and expanded to many times their original size.\n### Characteristics of Red Giants\nRed giants have cooler surface temperatures than main sequence stars, giving them their characteristic reddish color. Despite their lower surface temperature, they are extremely luminous due to their enormous size.\n\nBetelgeuse in the constellation Orion is one of the most famous red giants visible to the naked eye. Its diameter is so large that if placed at the center of our solar system, it would extend beyond the orbit of Mars.\n\nRed giants represent a relatively short phase in stellar evolution. Our own Sun will eventually become a red giant in about 5 billion years, expanding to engulf Mercury and Venus and possibly reaching Earth's orbit.\n\nThe expansion occurs when a star's core hydrogen is depleted, causing the core to contract and heat up while the outer layers expand and cool. This process significantly alters a star's properties in terms of temperature, luminosity, and size.\n\nAfter the red giant phase, intermediate-mass stars like our Sun will shed their outer layers to form a planetary nebula with a white dwarf at the center. More massive stars may continue to heavier elements fusion before ending as supernovae.\n",
        slug: 'red-giants',
        tenant: { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542' }
      },
      {
        name: 'Binary Stars',
        header: 'Stellar Systems with Two Stars',
        layoutContent:
          '## Binary Stars ⭐⭐\nBinary star systems consist of two stars orbiting around their common center of mass.\n### Types of Binary Systems\nBinary stars are extremely common in our galaxy, with more than half of all Sun-like stars believed to exist in binary or multiple-star systems. They come in several varieties, including visual binaries (can be resolved through telescopes), spectroscopic binaries (detected through spectrum analysis), and eclipsing binaries (where stars pass in front of each other from our perspective).\n\nThe study of binary stars is crucial for determining stellar masses. By analyzing their orbital motions, astronomers can calculate the masses of the component stars with great precision - information that\'s difficult to obtain for isolated stars.\n\nBinary star systems can evolve in fascinating ways, especially when the stars have different masses. The more massive star will reach the giant phase first, potentially transferring material to its companion. This interaction can lead to novae, type Ia supernovae, and the formation of exotic objects like neutron stars and black holes.\n\nAlgol, also known as the "Demon Star," is a famous eclipsing binary in the Perseus constellation. Its brightness noticeably dims approximately every 2.87 days when the dimmer star passes in front of the brighter one from our perspective.\n\nSome binary systems contain a stellar remnant like a white dwarf, neutron star, or black hole, making them important laboratories for studying extreme physics.\n',
        slug: 'binary-stars',
        tenant: { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542' }
      },
      {
        name: 'Neutron Stars',
        header: 'Ultra-Dense Stellar Remnants',
        layoutContent:
          '## Neutron Stars 🌟\nNeutron stars are the incredibly dense remnants of massive stars that have ended their lives in supernovae.\n### Properties of Neutron Stars\nNeutron stars are among the densest objects known in the universe. They pack roughly 1.4 solar masses into a sphere only about 20 kilometers in diameter. A teaspoon of neutron star material would weigh billions of tons on Earth.\n\nDespite their small size, neutron stars have extremely powerful magnetic fields, often trillions of times stronger than Earth\'s. They also rotate incredibly rapidly, with some completing multiple rotations per second. As they rotate, their magnetic fields sweep through space, creating beams of radiation that we can detect as pulses when they point toward Earth - these are known as pulsars.\n\nThe discovery of pulsars in 1967 by Jocelyn Bell Burnell was a landmark achievement in astronomy. Initially, the regular pulsations were so precise that they were briefly considered possible signals from alien civilizations, nicknamed "LGM" (Little Green Men).\n\nNeutron stars can exist in binary systems with ordinary stars, white dwarfs, or even other neutron stars. When a neutron star pulls material from a companion, it can create spectacular X-ray emissions and other high-energy phenomena.\n\nThe extreme conditions within neutron stars cannot be replicated in laboratories on Earth, making them unique cosmic laboratories for studying matter under extreme pressure and density.\n',
        slug: 'neutron-stars',
        tenant: { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542' }
      },
      {
        name: 'Lunar Maria',
        header: 'The Dark Plains of the Moon',
        layoutContent:
          "## Lunar Maria 🌑\nLunar maria are the dark, basaltic plains on the Moon formed by ancient volcanic eruptions.\n### Formation and Characteristics\nThe term \"maria\" (Latin for \"seas\") dates back to early astronomers who mistook these dark regions for actual bodies of water. We now know they are vast solidified flows of basaltic lava that erupted billions of years ago.\n\nLunar maria cover about 16% of the Moon's surface, primarily on the near side. The most prominent maria include Mare Imbrium (Sea of Rains), Mare Serenitatis (Sea of Serenity), and Mare Tranquillitatis (Sea of Tranquility) - where humans first landed during the Apollo 11 mission.\n\nThese dark plains formed between 3 and 3.5 billion years ago when molten magma from the Moon's interior flooded large impact basins. The maria are significantly younger than the lighter, heavily cratered highland regions that make up most of the lunar surface.\n\nThe maria contain fewer craters than the highlands because they formed later in the Moon's history, after the heaviest period of meteorite bombardment. They also contain higher concentrations of iron-rich minerals, which gives them their darker appearance.\n\nSamples returned by Apollo astronauts revealed that maria basalts differ in composition from Earth's volcanic rocks, providing important clues about the Moon's formation and evolution.\n",
        slug: 'lunar-maria',
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      },
      {
        name: 'Lunar Craters',
        header: 'Impact Features on the Moon',
        layoutContent:
          '## Lunar Craters 🌕\nLunar craters are bowl-shaped depressions formed by meteoroid impacts on the Moon\'s surface.\n### Formation and Significance\nWithout atmospheric protection, the Moon has preserved a record of impacts spanning more than 4 billion years. The largest lunar craters exceed 200 kilometers in diameter, while the smallest are microscopic. This preserved impact history makes the Moon an invaluable cosmic time capsule.\n\nCraters typically feature a raised rim, an interior bowl, and sometimes a central peak formed when the surface rebounded after impact. Larger impacts can create complex crater structures with terraced walls and multiple peaks.\n\nSome of the most prominent lunar craters include Tycho, with its distinctive ray system of ejected material stretching hundreds of kilometers; Copernicus, often called the "Monarch of the Moon"; and Clavius, one of the largest craters visible from Earth.\n\nThe distribution and density of craters in different regions help scientists determine the relative ages of lunar surfaces. Heavily cratered areas are generally older, having been exposed to impacts for a longer period. This principle was crucial in understanding the Moon\'s geological history.\n\nLunar craters are named after notable scientists, philosophers, and explorers. This naming convention, established by the International Astronomical Union, honors figures like Copernicus, Kepler, and Aristotle.\n',
        slug: 'lunar-craters',
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      },
      {
        name: 'Lunar Phases',
        header: 'The Changing Face of the Moon',
        layoutContent:
          '## Lunar Phases 🌓\nLunar phases are the different appearances of the Moon as seen from Earth during its monthly orbit.\n### The Lunar Cycle\nThe Moon completes a full cycle of phases approximately every 29.5 days, a period known as a synodic month. This cycle begins with the New Moon (when the Moon is between Earth and the Sun), proceeds through waxing phases as more of the illuminated side becomes visible, reaches Full Moon (when the Moon and Sun are on opposite sides of Earth), and then wanes until returning to New Moon.\n\nThe primary phases in order are: New Moon, Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, Last Quarter, and Waning Crescent. At First and Last Quarter phases, exactly half of the Moon\'s visible face is illuminated.\n\nLunar phases occur because the Moon orbits Earth while both bodies orbit the Sun. As the Moon moves around Earth, the angle between the Sun, Moon, and Earth changes, altering which portion of the Moon\'s sunlit side is visible from our perspective.\n\nThe Moon always presents approximately the same face toward Earth due to tidal locking. This synchronous rotation means that the Moon\'s rotation period matches its orbital period around Earth, resulting in one side (the near side) always facing us, while the far side remains hidden from direct view.\n\nThroughout history, lunar phases have been used to track time, with many calendars based on the lunar cycle. The words "month" and "moon" share etymological roots in many languages, reflecting this ancient connection.\n',
        slug: 'lunar-phases',
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      },
      {
        name: 'Solar Flares',
        header: 'Powerful Eruptions on the Sun',
        layoutContent:
          "## Solar Flares ☀️\nSolar flares are massive explosions on the Sun's surface that release energy, light, and high-speed particles into space.\n### Formation and Impact\nSolar flares occur near sunspots, temporary dark patches on the Sun's surface where intense magnetic fields emerge. These magnetic fields can become twisted and suddenly reconnect, releasing enormous amounts of energy. A typical large flare can release energy equivalent to millions of 100-megaton hydrogen bombs exploding simultaneously.\n\nThe frequency of solar flares follows the 11-year solar cycle, with more flares occurring during solar maximum when sunspot activity is highest. Flares are classified by their X-ray brightness, with the most powerful being X-class flares, followed by M, C, B, and A-class flares in decreasing order of intensity.\n\nThe radiation from solar flares can disrupt radio communications, GPS navigation, and power grids on Earth. They can also pose a radiation hazard to astronauts and electronic equipment in space. The most powerful recorded flare, the Carrington Event of 1859, caused auroras visible as far south as the Caribbean and disrupted telegraph systems worldwide.\n\nNASA and other space agencies continuously monitor the Sun for flare activity using satellites like the Solar Dynamics Observatory (SDO) and the Solar and Heliospheric Observatory (SOHO). These observations help scientists better understand solar physics and provide early warnings about potentially disruptive solar events.\n\nSolar flares are often associated with coronal mass ejections (CMEs), massive clouds of solar plasma that can travel through space at speeds of several million miles per hour, potentially reaching Earth within 1-3 days.\n",
        slug: 'solar-flares',
        tenant: { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985' }
      },
      {
        name: 'Solar Wind',
        header: 'The Stream of Particles from the Sun',
        layoutContent:
          "## Solar Wind 🌞\nThe solar wind is a continuous stream of charged particles (primarily electrons and protons) flowing outward from the Sun in all directions.\n### Properties and Effects\nThe solar wind originates in the Sun's corona, the outermost layer of the solar atmosphere where temperatures exceed one million degrees Celsius. At these temperatures, the Sun's gravity cannot hold onto the rapidly moving particles, allowing them to escape into space.\n\nThe solar wind travels at speeds ranging from 300 to 800 kilometers per second (about 1 to 2 million miles per hour). It carries with it the Sun's magnetic field, creating what we call the heliosphere - a vast bubble of solar influence that extends far beyond Pluto.\n\nWhen the solar wind interacts with Earth's magnetic field, it creates a protective magnetosphere around our planet, shielding us from much of the solar radiation. However, some particles can enter near the poles, colliding with atmospheric molecules to create the beautiful aurora borealis (northern lights) and aurora australis (southern lights).\n\nThe solar wind is not uniform but varies in density, temperature, and speed. \"Fast\" solar wind originates from coronal holes, regions where the Sun's magnetic field extends out into space without closing back on itself. \"Slow\" solar wind comes from regions near the Sun's equator during periods of low solar activity.\n\nThe interaction between the solar wind and the interstellar medium creates a boundary called the heliopause, which the Voyager spacecraft crossed in 2012, becoming the first human-made objects to enter interstellar space.\n",
        slug: 'solar-wind',
        tenant: { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985' }
      },
      {
        name: 'Solar Dynamo',
        header: 'The Engine Behind Solar Activity',
        layoutContent:
          "## Solar Dynamo 🧲☀️\nThe solar dynamo is the mechanism that generates the Sun's magnetic field and drives its 11-year activity cycle.\n### How It Works\nThe solar dynamo operates through the combined effects of differential rotation and convection within the Sun. The Sun doesn't rotate as a solid body - its equator completes a rotation in about 25 days, while the poles take about 35 days. This differential rotation stretches and wraps the magnetic field lines, while convection currents lift and twist them.\n\nThis process creates a self-sustaining dynamo effect that continuously regenerates the Sun's magnetic field. Over time, the field becomes increasingly complex and twisted, leading to increasing numbers of sunspots, flares, and other magnetic phenomena - what we observe as the solar maximum period of the cycle.\n\nEventually, the magnetic field becomes so tangled that it essentially \"resets\" itself in a process called magnetic reconnection. The field simplifies and reverses polarity, beginning the next cycle with the magnetic north and south poles switched. This complete cycle, from one polarity to the same polarity again, takes approximately 22 years (two 11-year sunspot cycles).\n\nThe solar dynamo doesn't operate at a constant rate. Historical records show periods of unusually low activity, such as the Maunder Minimum (1645-1715), when sunspots were extremely rare and Europe experienced a \"Little Ice Age.\" This suggests a potential connection between solar magnetic activity and Earth's climate, though the exact relationship remains an area of active research.\n\nStudying the solar dynamo helps scientists predict solar activity, which is crucial for anticipating space weather events that can affect satellites, power grids, and telecommunications on Earth.\n",
        slug: 'solar-dynamo',
        tenant: { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985' }
      },
      {
        name: 'Home',
        slug: 'home',
        header: 'We are all made of stars.',
        layoutContent:
          "## Antares\nA massive red supergiant in the constellation Scorpius. Its name means 'rival of Mars' due to its reddish color. It's about 700 times larger than our Sun and is one of the brightest stars in the night sky.\n## Vega\nThough not extremely small (about 2.5 times the radius of our Sun), Vega is a famous star with a simple name that's relatively smaller than giants like Antares. It's the fifth brightest star in the night sky and is part of the Summer Triangle.",
        tenant: { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542' }
      },
      {
        name: 'Home',
        slug: 'home',
        header: 'Look at the silver moon.',
        layoutContent:
          "## Titan\nSaturn's largest moon and the second-largest moon in our solar system. It's bigger than the planet Mercury and is the only moon with a thick atmosphere.\n## Phobos\nOne of Mars' tiny moons, measuring only about 22 kilometers (14 miles) across. Its name means 'fear' in Greek, and it orbits extremely close to Mars, completing an orbit in less than 8 hours.",
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      },
      {
        name: 'Home',
        slug: 'home',
        header: 'Islands in the sun.',
        layoutContent:
          "## Rigel\nThis blue supergiant is about 79 times larger than our Sun and one of the brightest stars in the night sky.\n## Ross\nA tiny red dwarf star named after astronomer Frank Ross who discovered it. It's only about 15% the size of our Sun and relatively close to our solar system.",
        tenant: { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985' }
      }
    ],
    posts: [
      {
        title: 'Supergiant Stars',
        slug: 'supergiant-stars',
        authors: [{ lookupEmail: 'antares@local.dev' }],
        categories: [{ lookupSlug: 'star-types' }],
        content:
          "# Supergiant Stars\nSupergiant stars are the most massive and luminous stars in the universe. These stellar giants have exhausted the hydrogen in their cores and expanded to enormous sizes. Betelgeuse in the constellation Orion is a famous example, with a diameter roughly 700 times that of our Sun.\n\nThese stars have relatively short lifespans of only a few million years compared to the billions of years that smaller stars like our Sun live. Their enormous mass causes them to burn through their nuclear fuel at an accelerated rate.\n\nDespite their rarity, supergiants have played a crucial role in the universe's evolution. When they die in spectacular supernova explosions, they create and distribute heavy elements throughout the cosmos that eventually form new stars, planets, and even life.\n\n## Observational Characteristics\nSupergiants come in different spectral types from blue to red. Blue supergiants like Rigel are extremely hot with surface temperatures around 20,000 Kelvin, while red supergiants like Antares are cooler (around 3,500 Kelvin) but much larger in physical size.\n\nThe extreme luminosity of these stars makes them visible across vast cosmic distances, allowing astronomers to use them as standard candles for measuring distances to other galaxies. Their atmospheres also provide valuable laboratories for studying stellar physics under extreme conditions.\n\n",
        tenant: { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542' }
      },
      {
        title: 'White Dwarf Stars',
        slug: 'white-dwarf-stars',
        authors: [{ lookupEmail: 'vega@local.dev' }],
        categories: [{ lookupSlug: 'star-types' }],
        content:
          '# White Dwarf Stars\nWhite dwarfs represent the final evolutionary state for the vast majority of stars in our universe, including our Sun. These stellar remnants form when stars of low to medium mass have exhausted their nuclear fuel and shed their outer layers.\n\nDespite having masses comparable to our Sun, white dwarfs are incredibly dense, compressing that mass into a volume roughly the size of Earth. A sugar cube-sized piece of white dwarf material would weigh approximately one ton on Earth.\n\nThese stars no longer produce energy through nuclear fusion. Instead, they slowly cool over billions of years, eventually fading to black dwarfs (though the universe isn\'t old enough for any white dwarfs to have cooled completely yet).\n\n## Physical Properties\nWhite dwarfs are supported against gravitational collapse by electron degeneracy pressure, a quantum mechanical effect that prevents electrons from occupying the same energy states. This creates an upper mass limit called the Chandrasekhar limit (about 1.4 solar masses) beyond which electron degeneracy cannot prevent collapse.\n\nIn binary systems, white dwarfs can pull material from companion stars, sometimes leading to nova explosions when hydrogen accumulates on their surfaces and undergoes fusion. If a white dwarf accumulates enough mass to approach the Chandrasekhar limit, it may explode as a Type Ia supernova, which astronomers use as "standard candles" for measuring cosmic distances.\n\n',
        tenant: { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542' }
      },
      {
        title: 'The Hertzsprung-Russell Diagram',
        slug: 'the-hertzsprung-russell-diagram',
        authors: [{ lookupEmail: 'vega@local.dev' }],
        categories: [{ lookupSlug: 'stellar-evolution' }],
        content:
          "# The Hertzsprung-Russell Diagram\nThe Hertzsprung-Russell (H-R) diagram is one of the most important tools in stellar astronomy, providing a graphical relationship between stars' luminosities and their surface temperatures or spectral classifications. Developed independently by Ejnar Hertzsprung and Henry Norris Russell in the early 1900s, this diagram revolutionized our understanding of stellar evolution.\n\nThe diagram plots stars with temperature or spectral class on the x-axis (hottest to coolest, moving right) and luminosity or absolute magnitude on the y-axis (brightest at the top). When stars are plotted this way, they don't distribute randomly but instead fall into distinct groupings that reveal their evolutionary stages.\n\nThe main sequence is a diagonal band running from the upper left (hot, luminous stars) to the lower right (cool, dim stars) where stars spend most of their hydrogen-burning lives. Our Sun is a G-type main sequence star situated in the middle regions of this band.\n\n## Evolutionary Tracks\nAs stars evolve, they move to different regions of the H-R diagram. When a main sequence star exhausts its core hydrogen, it moves upward and rightward to become a red giant. More massive stars evolve into supergiants in the upper right portion of the diagram.\n\nThe diagram also shows white dwarfs clustered in the lower left - hot but dim stars in their final evolutionary stages. By studying a star's position on the H-R diagram and how that position changes over time, astronomers can determine its age, mass, and evolutionary stage, making this diagram an invaluable tool for understanding stellar lifecycles.\n\n",
        tenant: { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542' }
      },
      {
        title: 'Open Star Clusters',
        slug: 'open-star-clusters',
        authors: [{ lookupEmail: 'vega@local.dev' }],
        categories: [{ lookupSlug: 'star-clusters' }],
        content:
          '# Open Star Clusters\nOpen star clusters are groups of stars that formed together from the same giant molecular cloud and remain loosely bound by mutual gravitational attraction. Unlike their densely packed cousins, globular clusters, open clusters typically contain younger stars (a few million to a few billion years old) and are found primarily in the spiral arms of galaxies.\n\nThe Milky Way contains thousands of open clusters, though only about 1,100 have been discovered and cataloged. Famous examples include the Pleiades (Seven Sisters), the Hyades in Taurus, and the Double Cluster in Perseus. Most open clusters contain between a few dozen and a few thousand stars.\n\nOpen clusters are astronomical treasure troves because all their stars formed at roughly the same time from the same molecular cloud. This means they have the same age and initial chemical composition but different masses. This makes them perfect laboratories for testing theories of stellar evolution, as astronomers can observe how stars of different masses evolve from the same starting point.\n\n## Cluster Evolution\nOver time, open clusters gradually disperse as their stars are stripped away by the gravitational influence of passing molecular clouds or other clusters. This process accelerates as the cluster orbits through the galactic disk, encountering more disruptive forces.\n\nOur Sun likely formed in an open cluster about 4.6 billion years ago, but that cluster has long since dispersed. By studying the chemical signatures of stars, astronomers can sometimes identify "siblings" of our Sun—stars that formed in the same cluster but have since been scattered throughout the galaxy.\n\n',
        tenant: { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542' }
      },
      {
        title: 'Lunar Highlands',
        slug: 'lunar-highlands',
        authors: [{ lookupEmail: 'titan@local.dev' }],
        categories: [{ lookupSlug: 'lunar-features' }],
        content:
          "# Lunar Highlands\nThe lunar highlands are the light-colored, heavily cratered regions that make up approximately 83% of the Moon's surface. These ancient terrains provide a window into the early history of our solar system, preserving a record of the intense meteorite bombardment that occurred over 4 billion years ago.\n\nUnlike the darker lunar maria, the highlands consist primarily of anorthosite, a rock composed largely of the mineral plagioclase feldspar. This composition gives the highlands their characteristic bright appearance when viewed from Earth.\n\nThe highlands represent the Moon's original crust, formed when lighter minerals floated to the surface of a molten lunar magma ocean shortly after the Moon's formation. This crust solidified around 4.5 billion years ago, making the highlands some of the oldest accessible surfaces in our solar system.\n\n## Scientific Significance\nThe heavily cratered nature of the highlands provides crucial information about the early bombardment history of the inner solar system. This period, known as the Late Heavy Bombardment, affected all inner planets, but Earth's active geology has erased most evidence of this violent epoch.\n\nApollo 16 was the only mission to land specifically in the lunar highlands, collecting samples that revealed the anorthositic composition of these regions. These samples have been crucial for understanding the Moon's formation and early evolution, suggesting that the Moon likely formed from debris ejected when a Mars-sized body collided with the early Earth.\n\n",
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      },
      {
        title: 'The Lunar Atmosphere',
        slug: 'the-lunar-atmosphere',
        authors: [{ lookupEmail: 'titan@local.dev' }],
        categories: [{ lookupSlug: 'lunar-features' }],
        content:
          "# The Lunar Atmosphere\nContrary to popular belief, the Moon does have an atmosphere, albeit an extremely tenuous one. This \"exosphere\" is so thin that its molecules rarely collide with each other, making it fundamentally different from the atmospheres of Earth or Mars.\n\nThe lunar atmosphere contains several elements including helium, argon, neon, sodium, and potassium, with a total mass of only about 10 metric tons spread across the entire Moon. By comparison, Earth's atmosphere has a mass of about 5 quadrillion metric tons.\n\nSeveral sources contribute to this tenuous atmosphere: solar wind particles captured by the Moon's weak gravitational field, outgassing from the lunar interior, and material vaporized by micrometeorite impacts. The composition varies with the lunar day/night cycle and is influenced by solar activity.\n\n## Scientific Interest\nStudying the lunar atmosphere helps scientists understand surface-exosphere interactions on airless bodies throughout the solar system. The Lunar Atmosphere and Dust Environment Explorer (LADEE) mission, which orbited the Moon in 2013-2014, made detailed measurements of this exosphere's composition and density variations.\n\nThe Moon's near-vacuum environment makes it an excellent location for certain types of astronomical observations. Without atmospheric distortion, telescopes placed on the lunar surface could achieve exceptional clarity, particularly on the far side where they would also be shielded from Earth's radio emissions.\n\n",
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      },
      {
        title: 'Lunar Water',
        slug: 'lunar-water',
        authors: [{ lookupEmail: 'phobos@local.dev' }],
        categories: [{ lookupSlug: 'lunar-features' }],
        content:
          "# Lunar Water\nFor decades, scientists believed the Moon was completely dry. This view changed dramatically in recent years as multiple missions detected the presence of water on our celestial neighbor, a discovery with profound implications for lunar science and future human exploration.\n\nWater exists on the Moon in multiple forms. Water ice is concentrated in permanently shadowed craters near the lunar poles where temperatures remain below -158°C (-250°F), cold enough to trap water molecules for billions of years. Additionally, hydration has been detected in the lunar regolith (soil) across the surface, likely in the form of hydroxyl groups (OH) bonded to minerals.\n\nThe lunar water likely comes from multiple sources: cometary impacts, interaction between the solar wind and oxygen-bearing minerals in the lunar soil, and possibly primordial water trapped during the Moon's formation. Understanding these sources helps reveal the Moon's history and evolution.\n\n## Importance for Exploration\nWater is a precious resource for space exploration. It can be split into hydrogen and oxygen for rocket fuel or life support systems, and of course, astronauts need it for drinking and other uses. The presence of accessible water could significantly reduce the mass that future missions need to launch from Earth.\n\nNASA's Artemis program, which aims to return humans to the Moon by the mid-2020s, plans to investigate lunar water resources and potentially demonstrate in-situ resource utilization technologies. The lunar south pole, with its relatively high concentration of water ice, has been selected as the target region for these missions precisely because of its potential water resources.\n\n",
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      },
      {
        title: "The Moon's Formation",
        slug: 'the-moons-formation',
        authors: [{ lookupEmail: 'phobos@local.dev' }],
        categories: [{ lookupSlug: 'planetary-moons' }],
        content:
          "# The Moon's Formation\nThe origin of the Moon has fascinated humans since ancient times, but only in recent decades have scientists developed a compelling theory for its formation. The currently accepted model, known as the Giant Impact Hypothesis, suggests that about 4.5 billion years ago, a Mars-sized body (sometimes called Theia) collided with the proto-Earth.\n\nThis catastrophic impact ejected a vast amount of material from both the impactor and Earth's mantle into orbit around our planet. Within this debris disk, material began to coalesce, eventually forming the Moon. This violent birth explains several key observations about the Earth-Moon system.\n\nComputer simulations of the impact event closely match the current Earth-Moon system, including the Moon's relatively small iron core compared to Earth's. The hypothesis also accounts for the Moon's loss of volatile elements and explains why the Moon's orbit is in the same plane as Earth's equator.\n\n## Evidence for the Theory\nSamples returned by Apollo missions have been crucial in supporting the Giant Impact Theory. Moon rocks show isotopic compositions remarkably similar to Earth's mantle, suggesting a common origin, but they contain significantly less water and other volatile elements, consistent with the high-energy, high-temperature conditions of a giant impact.\n\nThe Moon's slightly elongated orbit and the fact that it's slowly receding from Earth (currently at a rate of about 3.8 centimeters per year) are also consistent with this formation model. Additionally, the Moon's density and internal structure—with a small core making up only about 20% of its volume compared to Earth's core at 30%—align with predictions of the impact hypothesis.\n\n",
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      },
      {
        title: 'The Solar Core',
        slug: 'the-solar-core',
        authors: [{ lookupEmail: 'rigel@local.dev' }],
        categories: [{ lookupSlug: 'solar-activity' }],
        content:
          "# The Solar Core\nAt the heart of our Sun lies its core, a region of extreme conditions where nuclear fusion powers our solar system. Despite being relatively small—occupying only about 20-25% of the Sun's radius—the core contains approximately 60% of the Sun's mass due to its incredible density.\n\nThe core's temperature reaches an astonishing 15 million degrees Celsius (27 million degrees Fahrenheit), and its pressure exceeds 200 billion times Earth's atmospheric pressure. Under these extreme conditions, hydrogen nuclei are forced together to form helium through nuclear fusion, releasing enormous amounts of energy in the process.\n\nThis energy, initially in the form of gamma rays, begins a journey that will take thousands of years to reach the Sun's surface and eventually Earth. The particles interact countless times on their way outward, gradually losing energy and transforming from gamma rays to visible light that ultimately radiates into space.\n\n## Detection and Study\nHumans have never directly observed the solar core—it's hidden beneath thousands of kilometers of hot plasma. However, scientists have developed ingenious methods to study it indirectly.\n\nHelioseismology, the study of oscillations that propagate through the Sun, allows astronomers to \"see\" inside our star much as seismologists use earthquake waves to study Earth's interior. Additionally, neutrinos—nearly massless subatomic particles produced during fusion reactions—can escape the core directly and be detected on Earth, providing a real-time window into the nuclear processes happening at the Sun's center.\n\n",
        tenant: { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985' }
      },
      {
        title: 'Solar Cycles',
        slug: 'solar-cycles',
        authors: [{ lookupEmail: 'rigel@local.dev' }],
        categories: [{ lookupSlug: 'solar-activity' }],
        content:
          "# Solar Cycles\nThe Sun, far from being a static object, goes through regular cycles of activity that profoundly affect our solar system. The most prominent of these is the approximately 11-year sunspot cycle, during which the number of sunspots—dark, magnetically intense regions on the Sun's surface—rises and falls in a relatively predictable pattern.\n\nAt solar minimum, the Sun may display few or no sunspots for days or weeks. As activity increases toward solar maximum, dozens of sunspots can appear simultaneously, accompanied by increased solar flares, coronal mass ejections, and other energetic phenomena. These cycles have been observed and recorded since the early 1600s, providing one of astronomy's longest continuous data sets.\n\nThe solar cycle is actually a magnetic phenomenon. During each cycle, the Sun's magnetic field completely reverses polarity, meaning a full magnetic cycle takes about 22 years—two 11-year sunspot cycles. This reversal occurs at solar maximum, when the field is at its most tangled and chaotic state.\n\n## Effects on Earth\nSolar cycles have numerous impacts on Earth and human technology. During solar maximum, increased solar activity can disrupt radio communications, damage satellites, create radiation hazards for astronauts, and even cause power grid failures. The spectacular auroras (northern and southern lights) become more frequent and visible at lower latitudes during these active periods.\n\nScientists have also identified potential links between solar cycles and Earth's climate, though these connections are complex and the subject of ongoing research. Historical records show periods of unusually low solar activity, such as the Maunder Minimum (1645-1715), which coincided with a period of cooler temperatures in Europe known as the \"Little Ice Age.\" Understanding these relationships remains important for climate science.\n\n",
        tenant: { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985' }
      },
      {
        title: 'The Heliosphere',
        slug: 'the-heliosphere',
        authors: [{ lookupEmail: 'rigel@local.dev' }],
        categories: [{ lookupSlug: 'solar-system' }],
        content:
          "# The Heliosphere\nThe heliosphere is the vast bubble-like region of space dominated by the Sun's magnetic field and solar wind. This protective cocoon shields our solar system from the harsh interstellar radiation environment and represents the Sun's sphere of physical influence.\n\nThe solar wind—a stream of charged particles continuously flowing outward from the Sun in all directions—creates and maintains the heliosphere. As this supersonic wind travels outward, it eventually slows upon encountering resistance from the interstellar medium, forming a boundary called the termination shock. Beyond this lies the heliosheath, a turbulent region where the solar wind is compressed and slowed further.\n\nThe outermost boundary of the heliosphere is the heliopause, where the pressure of the solar wind balances with the pressure of the interstellar medium. This marks the true edge of our solar system in terms of the Sun's particle and magnetic influence. Beyond lies interstellar space.\n\n## Exploration and Discovery\nIn 2012, NASA's Voyager 1 spacecraft became the first human-made object to cross the heliopause and enter interstellar space, followed by Voyager 2 in 2018. These historic crossings provided unprecedented data about the boundary conditions between our solar system and interstellar space.\n\nThe shape of the heliosphere has been the subject of scientific debate. While often depicted as comet-like with a long tail, recent research suggests it may be more spherical or croissant-shaped. The Interstellar Boundary Explorer (IBEX) mission has been mapping the boundary regions since 2008, revealing unexpected features including a \"ribbon\" of energetic neutral atoms that appears to be aligned with the local interstellar magnetic field.\n\n",
        tenant: { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985' }
      },
      {
        title: "The Sun's Atmosphere",
        slug: 'the-suns-atmosphere',
        authors: [{ lookupEmail: 'ross@local.dev' }],
        categories: [{ lookupSlug: 'solar-activity' }],
        content:
          "# The Sun's Atmosphere\nUnlike Earth's atmosphere with its well-defined boundary, the Sun's atmosphere consists of several distinct layers that extend from its visible surface out into space. These layers exhibit fascinating and sometimes counterintuitive properties that continue to challenge our understanding of stellar physics.\n\nThe photosphere, or visible \"surface\" of the Sun, marks the lowest layer of the solar atmosphere. This relatively thin layer (about 500 kilometers thick) has a temperature of around 5,500°C (10,000°F) and is where most of the Sun's visible light originates. The granular appearance of the photosphere reveals convection cells where hot plasma rises, cools, and sinks back down.\n\nAbove the photosphere lies the chromosphere, a layer approximately 2,000 kilometers thick that appears as a thin red rim during total solar eclipses. Counter to normal expectations, temperature actually rises through the chromosphere, reaching about 20,000°C at its upper boundary. This temperature inversion represents one of the ongoing puzzles in solar physics.\n\n## The Mysterious Corona\nThe outermost layer of the Sun's atmosphere is the corona, a tenuous but extremely hot region extending millions of kilometers into space. With temperatures exceeding 1 million degrees Celsius, the corona is mysteriously hundreds of times hotter than the layers below it—a phenomenon known as the coronal heating problem.\n\nThe corona is normally invisible due to the overwhelming brightness of the photosphere, but becomes spectacularly visible during total solar eclipses as a pearly white halo around the darkened Sun. Space-based instruments with coronagraphs, which block out the Sun's disk, allow scientists to study the corona continuously. The corona has no definite outer boundary and gradually transitions into the solar wind that fills the heliosphere.\n\n",
        tenant: { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985' }
      }
    ],
    // Moon get some extra tags for media seeding besides the color tags
    tags: [
      ...[
        'a76d0168-f9b2-48d2-bc57-96e45aaf8542',
        'b9c2fb25-df77-4304-a60a-028779a2cb37',
        'f3799063-d55e-43ab-a96f-b6a386ced985'
      ].flatMap((lookupApiKey) => [
        {
          name: 'Indigo',
          slug: 'indigo',
          brand: { color: 'indigo-500', icon: 'TagIcon' },
          tenant: { lookupApiKey }
        },
        {
          name: 'Orange',
          slug: 'orange',
          brand: { color: 'orange-500', icon: 'TagIcon' },
          tenant: { lookupApiKey }
        },
        {
          name: 'Teal',
          slug: 'teal',
          brand: { color: 'teal-500', icon: 'TagIcon' },
          tenant: { lookupApiKey }
        }
      ]),
      {
        name: 'File area',
        slug: 'file-area',
        brand: { color: 'green-500', icon: 'EyeIcon' },
        tenant: { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37' }
      }
    ],
    tenants: [
      {
        name: 'Moon',
        description:
          'A moon is a natural satellite that orbits a planet or other celestial body larger than itself.',
        domains: [
          { domain: 'moon.localhost', pageTypes: ['client', 'cms'] },
          { domain: 'cms.moon.localhost', pageTypes: ['cms'] }
        ],
        apiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37'
      },
      {
        name: 'Star',
        description:
          'A star is a luminous spherical celestial body composed primarily of hydrogen and helium gas that generates energy through nuclear fusion in its core.',
        domains: [
          { domain: 'star.localhost', pageTypes: ['client', 'cms'] },
          { domain: 'cms.star.localhost', pageTypes: ['cms'] }
        ],
        apiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542'
      },
      {
        name: 'Sun',
        description:
          'A sun is the central star of a planetary system, around which planets, moons, asteroids, and other celestial bodies orbit.',
        domains: [
          { domain: 'sun.localhost', pageTypes: ['client', 'cms'] },
          { domain: 'cms.sun.localhost', pageTypes: ['cms'] }
        ],
        apiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985'
      }
    ],
    users: [
      {
        name: 'System User',
        description: 'Access to manage the whole system',
        email: 'system@local.dev',
        password: '',
        role: 'system-user',
        tenants: []
      },
      {
        name: 'Black Hole',
        description: 'Admin access to all workspaces',
        email: 'black@local.dev',
        password: '',
        role: 'user',
        tenants: [
          {
            lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542',
            role: 'admin'
          },
          {
            lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37',
            role: 'admin'
          },
          {
            lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985',
            role: 'admin'
          }
        ]
      },
      {
        name: 'Space Station',
        description: 'User access to all workspaces',
        email: 'iss@local.dev',
        password: '',
        role: 'user',
        tenants: [
          {
            lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542',
            role: 'user'
          },
          {
            lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37',
            role: 'user'
          },
          { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985', role: 'user' }
        ]
      },
      {
        name: 'Antares Star',
        description: 'Administrator access to Star',
        email: 'antares@local.dev',
        password: '',
        role: 'user',
        tenants: [
          {
            lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542',
            role: 'admin'
          }
        ]
      },
      {
        name: 'Vega Star',
        description: 'User access to Star',
        email: 'vega@local.dev',
        password: '',
        role: 'user',
        tenants: [
          { lookupApiKey: 'a76d0168-f9b2-48d2-bc57-96e45aaf8542', role: 'user' }
        ]
      },
      {
        name: 'Titan Moon',
        description: 'Administrator access to Moon',
        email: 'titan@local.dev',
        password: '',
        role: 'user',
        tenants: [
          {
            lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37',
            role: 'admin'
          }
        ]
      },
      {
        name: 'Phobos Moon',
        description: 'User access to Moon',
        email: 'phobos@local.dev',
        password: '',
        role: 'user',
        tenants: [
          { lookupApiKey: 'b9c2fb25-df77-4304-a60a-028779a2cb37', role: 'user' }
        ]
      },
      {
        name: 'Rigel Sun',
        description: 'Administrator access to Sun',
        email: 'rigel@local.dev',
        password: '',
        role: 'user',
        tenants: [
          {
            lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985',
            role: 'admin'
          }
        ]
      },
      {
        name: 'Ross Sun',
        description: 'User access to Sun',
        email: 'ross@local.dev',
        password: '',
        role: 'user',
        tenants: [
          { lookupApiKey: 'f3799063-d55e-43ab-a96f-b6a386ced985', role: 'user' }
        ]
      }
    ]
  };
};
