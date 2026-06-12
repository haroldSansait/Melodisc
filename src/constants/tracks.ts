export type Track = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  /**
   * Web-relative URI (bundled tracks) or device-local permanent URI (local imports).
   * For local imports on native, use this field directly as a `{ uri }` source.
   */
  artwork: string;
  /**
   * Web-relative URI (bundled tracks) or device-local permanent URI / blob URL
   * (local imports). The audio engine reads this field for both platforms.
   */
  url: string;
  /**
   * True for tracks imported from the user's local device storage.
   * Bundled tracks leave this undefined / false.
   */
  isLocal?: boolean;
};

export const tracks: Track[] = [
  {
    id: 'how-sweet',
    title: 'How Sweet',
    artist: 'NewJeans',
    genre: 'K-Pop / R&B',
    artwork: '/src/assets/artwork/CoverHowSweet.jpg',
    url: '/src/assets/audio/HowSweet-NewJeans.mp3',
  },
  {
    id: 'supernatural',
    title: 'Supernatural',
    artist: 'NewJeans',
    genre: 'K-Pop',
    artwork: '/src/assets/artwork/CoverSupernatural.jpg',
    url: '/src/assets/audio/Supernatural-NewJeans.mp3',
  },
  {
    id: 'pink-white',
    title: 'Pink + White',
    artist: 'Frank Ocean',
    genre: 'R&B / Neo-Soul',
    artwork: '/src/assets/artwork/CoverPink+White.jpg',
    url: '/src/assets/audio/Pink+White-FrankOcean.mp3',
  },
  {
    id: 'lost',
    title: 'Lost',
    artist: 'Frank Ocean',
    genre: 'R&B',
    artwork: '/src/assets/artwork/CoverLostFrankOcean.jpg',
    url: '/src/assets/audio/Lost-FrankOcean.mp3',
  },
  {
    id: 'ring-ring-ring',
    title: 'Ring Ring Ring',
    artist: 'Tyler, The Creator',
    genre: 'Neo-Soul / Rap',
    artwork: '/src/assets/artwork/CoverRingRingRing.jpg',
    url: '/src/assets/audio/RingRingRing-TylerTheCreator.mp3',
  },
  {
    id: 'sugar-on-my-tongue',
    title: 'Sugar on My Tongue',
    artist: 'Tyler, The Creator',
    genre: 'Neo-Soul',
    artwork: '/src/assets/artwork/CoverSugarOnMyTongue.jpg',
    url: '/src/assets/audio/SugarOnMyTongue-TylerTheCreator.mp3',
  },
  {
    id: 'magnolia',
    title: 'Magnolia',
    artist: 'Laufey',
    genre: 'Jazz Pop',
    artwork: '/src/assets/artwork/CoverMagnolia.jpg',
    url: '/src/assets/audio/Magnolia-Laufey.mp3',
  },
  {
    id: 'street-by-street',
    title: 'Street by Street',
    artist: 'Laufey',
    genre: 'Jazz Pop',
    artwork: '/src/assets/artwork/CoverStreetbyStreet.jpg',
    url: '/src/assets/audio/StreetbyStreet-Laufey.mp3',
  },
  {
    id: 'death-and-taxes',
    title: 'Death & Taxes',
    artist: 'Daniel Caesar',
    genre: 'R&B',
    artwork: '/src/assets/artwork/CoverDeath&Taxes.jpg',
    url: '/src/assets/audio/Death&Taxes-DanielCaesar.mp3',
  },
  {
    id: 'disillusioned',
    title: 'Disillusioned',
    artist: 'Daniel Caesar',
    genre: 'Alt R&B',
    artwork: '/src/assets/artwork/CoverDisillusioned.jpg',
    url: '/src/assets/audio/Disillusioned-DanielCaesar.mp3',
  },
  {
    id: 'smooth-operator',
    title: 'Smooth Operator',
    artist: 'Sade',
    genre: 'Smooth Jazz / R&B',
    artwork: '/src/assets/artwork/CoverSmoothOperator.jpg',
    url: '/src/assets/audio/SmoothOperator-Sade.mp3',
  },
  {
    id: 'fly-me-to-the-moon',
    title: 'Fly Me to the Moon',
    artist: 'Frank Sinatra',
    genre: 'Jazz Standards',
    artwork: '/src/assets/artwork/CoverFlyMeToTheMoon.jpg',
    url: '/src/assets/audio/FlyMeToTheMoon-FrankSinatra.mp3',
  },
  {
    id: 'virtual-insanity',
    title: 'Virtual Insanity (Remastered 2006)',
    artist: 'Jamiroquai',
    genre: 'Acid Jazz / Funk',
    artwork: '/src/assets/artwork/CoverVirtualInsanity.jpg',
    url: '/src/assets/audio/VirtualInsanity-Remastered 2006-Jamiroquai.mp3',
  },
  {
    id: 'chicago',
    title: 'Chicago',
    artist: 'Michael Jackson',
    genre: 'Pop / R&B',
    artwork: '/src/assets/artwork/CoverChicago.jpg',
    url: '/src/assets/audio/Chicago-MichaelJackson.mp3',
  },
  {
    id: 'araw-araw',
    title: 'Araw-Araw',
    artist: 'Ben&Ben',
    genre: 'OPM / Indie Folk',
    artwork: '/src/assets/artwork/CoverAraw-Araw.jpg',
    url: '/src/assets/audio/Araw-Araw-Ben&Ben.mp3',
  },
  {
    id: 'lifetime-reimagined',
    title: 'Lifetime (Reimagined)',
    artist: 'Ben&Ben',
    genre: 'OPM / Indie Pop',
    artwork: '/src/assets/artwork/CoverLifetime(Reimagined).jpg',
    url: '/src/assets/audio/Lifetime(Reimagined)-Ben&Ben.mp3',
  },
  {
    id: 'multo',
    title: 'Multo',
    artist: 'Cup of Joe',
    genre: 'OPM / Indie Pop',
    artwork: '/src/assets/artwork/CoverMulto.jpg',
    url: '/src/assets/audio/Multo-CupofJoe.mp3',
  },
  {
    id: 'patutunguhan',
    title: 'Patutunguhan',
    artist: 'Cup of Joe',
    genre: 'OPM / Indie Pop',
    artwork: '/src/assets/artwork/CoverPatutunguhan.jpg',
    url: '/src/assets/audio/Patutunguhan-CupofJoe.mp3',
  },
  {
    id: 'crank',
    title: 'CRANK',
    artist: 'Playboi Carti',
    genre: 'Rage Rap',
    artwork: '/src/assets/artwork/CoverCRANK.jpg',
    url: '/src/assets/audio/CRANK-PlayboiCarti.mp3',
  },
  {
    id: 'i-love-u-i-hate-u',
    title: 'I Love U I Hate U',
    artist: 'Playboi Carti',
    genre: 'Rage Rap',
    artwork: '/src/assets/artwork/CoverILoveUIHateU.jpg',
    url: '/src/assets/audio/ILoveUIHateU-PlayboiCarti.mp3',
  },
];
