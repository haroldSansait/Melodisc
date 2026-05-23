/**
 * Static Native Asset Registry
 *
 * Metro bundler cannot resolve dynamically interpolated string paths at runtime
 * (e.g. require(`../assets/artwork/${id}.jpg`)). All require() calls must be
 * statically analyzable at bundle time.
 *
 * This registry maps each track ID to its artwork and audio require() calls.
 * Use these on native (Platform.OS !== 'web') instead of the web-relative URI paths.
 */

export const artworkAssets: Record<string, any> = {
  'how-sweet': require('../assets/artwork/CoverHowSweet.jpg'),
  'supernatural': require('../assets/artwork/CoverSupernatural.jpg'),
  'pink-white': require('../assets/artwork/CoverPink+White.jpg'),
  'lost': require('../assets/artwork/CoverLostFrankOcean.jpg'),
  'ring-ring-ring': require('../assets/artwork/CoverRingRingRing.jpg'),
  'sugar-on-my-tongue': require('../assets/artwork/CoverSugarOnMyTongue.jpg'),
  'magnolia': require('../assets/artwork/CoverMagnolia.jpg'),
  'street-by-street': require('../assets/artwork/CoverStreetbyStreet.jpg'),
  'death-and-taxes': require('../assets/artwork/CoverDeath&Taxes.jpg'),
  'disillusioned': require('../assets/artwork/CoverDisillusioned.jpg'),
  'smooth-operator': require('../assets/artwork/CoverSmoothOperator.jpg'),
  'fly-me-to-the-moon': require('../assets/artwork/CoverFlyMeToTheMoon.jpg'),
  'virtual-insanity': require('../assets/artwork/CoverVirtualInsanity.jpg'),
  'chicago': require('../assets/artwork/CoverChicago.jpg'),
  'araw-araw': require('../assets/artwork/CoverAraw-Araw.jpg'),
  'lifetime-reimagined': require('../assets/artwork/CoverLifetime(Reimagined).jpg'),
  'multo': require('../assets/artwork/CoverMulto.jpg'),
  'patutunguhan': require('../assets/artwork/CoverPatutunguhan.jpg'),
  'crank': require('../assets/artwork/CoverCRANK.jpg'),
  'i-love-u-i-hate-u': require('../assets/artwork/CoverILoveUIHateU.jpg'),
};

export const audioAssets: Record<string, any> = {
  'how-sweet': require('../assets/audio/HowSweet-NewJeans.mp3'),
  'supernatural': require('../assets/audio/Supernatural-NewJeans.mp3'),
  'pink-white': require('../assets/audio/Pink+White-FrankOcean.mp3'),
  'lost': require('../assets/audio/Lost-FrankOcean.mp3'),
  'ring-ring-ring': require('../assets/audio/RingRingRing-TylerTheCreator.mp3'),
  'sugar-on-my-tongue': require('../assets/audio/SugarOnMyTongue-TylerTheCreator.mp3'),
  'magnolia': require('../assets/audio/Magnolia-Laufey.mp3'),
  'street-by-street': require('../assets/audio/StreetbyStreet-Laufey.mp3'),
  'death-and-taxes': require('../assets/audio/Death&Taxes-DanielCaesar.mp3'),
  'disillusioned': require('../assets/audio/Disillusioned-DanielCaesar.mp3'),
  'smooth-operator': require('../assets/audio/SmoothOperator-Sade.mp3'),
  'fly-me-to-the-moon': require('../assets/audio/FlyMeToTheMoon-FrankSinatra.mp3'),
  'virtual-insanity': require('../assets/audio/VirtualInsanity-Remastered 2006-Jamiroquai.mp3'),
  'chicago': require('../assets/audio/Chicago-MichaelJackson.mp3'),
  'araw-araw': require('../assets/audio/Araw-Araw-Ben&Ben.mp3'),
  'lifetime-reimagined': require('../assets/audio/Lifetime(Reimagined)-Ben&Ben.mp3'),
  'multo': require('../assets/audio/Multo-CupofJoe.mp3'),
  'patutunguhan': require('../assets/audio/Patutunguhan-CupofJoe.mp3'),
  'crank': require('../assets/audio/CRANK-PlayboiCarti.mp3'),
  'i-love-u-i-hate-u': require('../assets/audio/ILoveUIHateU-PlayboiCarti.mp3'),
};
