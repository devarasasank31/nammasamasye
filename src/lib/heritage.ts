export type HeritageScene = 'badami' | 'hampi' | 'tipu' | 'palace' | 'formation' | 'metro' | 'today';

export interface HeritageStop {
  era: string;
  title: string;
  native: string;
  desc: string;
  scene: HeritageScene;
  sky: string;
  skyLight: string;
  glow: string;
  image: string;
  alt: string;
  credit: string;
  story: string[];
  facts: { label: string; value: string }[];
}

// Oldest to newest — every stop sits between the one before it and the one
// after it. The landing background cross-fades through these as you scroll.
export const heritage: HeritageStop[] = [
  {
    era: '6th century',
    title: 'Badami',
    native: 'ಬಾದಾಮಿ',
    desc: 'Chalukyan rock-cut caves above the Agastya lake.',
    scene: 'badami',
    sky: 'linear-gradient(180deg,#1e0d05 0%,#5d2410 42%,#b45f28 76%,#e8a76b 100%)',
    skyLight: 'linear-gradient(180deg,#9ed8f5 0%,#ffd9a6 42%,#f2954e 74%,#c8501f 100%)',
    glow: '#e0813c',
    image: '/heritage/badami.jpg',
    alt: 'A rock-cut cave temple at Badami',
    credit: 'Photo: Rajeshodayanchal, CC BY-SA 3.0, via Wikimedia Commons',
    story: [
      'From the middle of the 6th century the Chalukyas cut four temples straight out of the red sandstone cliffs above Agastya lake at Vatapi — today called Badami. This is where Karnataka temple carving begins.',
      'The columns, the eighty-armed Vamana and the dancing Nataraja on these cave walls set the grammar that every later Kannada temple would follow, from Aihole and Pattadakal down to the Hoysalas.',
    ],
    facts: [
      { label: 'Ruled by', value: 'Chalukyas of Vatapi' },
      { label: 'Around', value: '540–600 CE' },
      { label: 'Famous for', value: 'Four rock-cut cave temples' },
      { label: 'Landscape', value: 'Red sandstone cliffs, Agastya lake' },
    ],
  },
  {
    era: '14th century',
    title: 'Hampi',
    native: 'ಹಂಪೆ',
    desc: 'The ruined capital of the Vijayanagara empire.',
    scene: 'hampi',
    sky: 'linear-gradient(180deg,#170d02 0%,#54300a 42%,#ab761c 76%,#f0c15a 100%)',
    skyLight: 'linear-gradient(180deg,#8ecdf5 0%,#ffe89b 42%,#f9b93c 74%,#dd7a1c 100%)',
    glow: '#f0c15a',
    image: '/heritage/hampi.jpg',
    alt: 'The Virupaksha temple and bazaar street at Hampi',
    credit: 'Photo: iMahesh, CC BY-SA 4.0, via Wikimedia Commons',
    story: [
      'Across the Tungabhadra, Vijayanagara grew into one of the largest cities in the world — traders from Persia, Portugal and China walked its bazaars beneath the Virupaksha gopura.',
      'After the battle of Talikota in 1565 the capital was abandoned and never rebuilt. Its temples, bazaars and royal enclosures now cover roughly 25 km² of boulder country, and UNESCO listed them as a World Heritage Site in 1986.',
    ],
    facts: [
      { label: 'Capital of', value: 'Vijayanagara empire' },
      { label: 'Founded', value: 'c. 1336' },
      { label: 'Abandoned', value: '1565, after Talikota' },
      { label: 'UNESCO', value: 'World Heritage Site, 1986' },
    ],
  },
  {
    era: '1780s',
    title: 'Tipu Sultan',
    native: 'ಟಿಪ್ಪು ಸುಲ್ತಾನ್',
    desc: 'The Tiger of Mysore and his war against the Company.',
    scene: 'tipu',
    sky: 'linear-gradient(180deg,#04120b 0%,#0f3521 42%,#2c6b3a 76%,#a8bf54 100%)',
    skyLight: 'linear-gradient(180deg,#9fe0c4 0%,#dff0a8 42%,#93c65c 74%,#4b8f42 100%)',
    glow: '#c9b04a',
    image: '/heritage/tipu.jpg',
    alt: 'The summer palace of Tipu Sultan at Bangalore Fort',
    credit: 'Public domain, via Wikimedia Commons',
    story: [
      'Hyder Ali took Mysore from the Wadiyars in the 1760s, and his son Tipu Sultan ruled from 1782 until he fell defending Srirangapatna in 1799. Between them they fought the British East India Company four times and lost them only at the last.',
      'In Bengaluru he built a fort, a garden palace at Dariya Daulat and the summer palace of wood and teak inside the fort walls — the one still standing in the city, open to anyone who walks in.',
    ],
    facts: [
      { label: 'Reign', value: '1782–1799' },
      { label: 'Title', value: 'Tiger of Mysore' },
      { label: 'Fought', value: 'Four Anglo-Mysore wars' },
      { label: 'In Bengaluru', value: 'Fort and summer palace' },
    ],
  },
  {
    era: '1912',
    title: 'Mysore Palace',
    native: 'ಮೈಸೂರು ಅರಮನೆ',
    desc: "The Wadiyar seat, still the state's best-known landmark.",
    scene: 'palace',
    sky: 'linear-gradient(180deg,#130a20 0%,#3a1a4d 42%,#7b3a6b 76%,#d98a5a 100%)',
    skyLight: 'linear-gradient(180deg,#cbb6f5 0%,#ffd0e2 42%,#f9a86a 74%,#d96a3c 100%)',
    glow: '#e0a15c',
    image: '/heritage/mysore_palace.jpg',
    alt: 'Mysore Palace lit at dawn',
    credit: 'Photo: Muhammad Mahdi Karim, GFDL 1.2, via Wikimedia Commons',
    story: [
      'The old wooden palace burned down during the Dasara of 1897. Between 1897 and 1912 the Wadiyars rebuilt it in grey granite on the same courtyard, to a design by the British architect Henry Irwin.',
      'Its Indo-Saracenic domes, jewelled ceiling and the nine thresholds of the durbar hall made it the image of Mysore State worldwide, and every Dasara the golden howdah still leaves from its gates.',
    ],
    facts: [
      { label: 'Built', value: '1897–1912' },
      { label: 'Style', value: 'Indo-Saracenic' },
      { label: 'Architect', value: 'Henry Irwin' },
      { label: 'Seats', value: 'Wadiyar dynasty' },
    ],
  },
  {
    era: '1956',
    title: 'Karnataka formation',
    native: 'ಕರ್ನಾಟಕ ರಚನೆ',
    desc: 'Mysore State renamed Karnataka on 1 November.',
    scene: 'formation',
    sky: 'linear-gradient(180deg,#260708 0%,#6b0f11 42%,#c21f22 74%,#ffce00 100%)',
    skyLight: 'linear-gradient(180deg,#ffe07a 0%,#ffd24d 42%,#ff8a5c 74%,#d21f22 100%)',
    glow: '#ffce00',
    image: '/heritage/karnataka.jpg',
    alt: 'Vidhana Soudha, the seat of the Karnataka legislature in Bengaluru',
    credit: 'Photo: DeepanjanGhosh, CC BY-SA 4.0, via Wikimedia Commons',
    story: [
      'On 1 November 1956 the States Reorganisation Act drew the borders of Mysore State around the Kannada-speaking districts, adding them to the old kingdom of Mysore and opening a new chapter in the Deccan.',
      'Seventeen years later, on 1 November 1973, the state was renamed Karnataka. The business was done from Vidhana Soudha, built between 1952 and 1956 in granite above Cubbon Park.',
    ],
    facts: [
      { label: 'Formed', value: '1 November 1956' },
      { label: 'Renamed', value: 'Karnataka, 1 November 1973' },
      { label: 'Capital', value: 'Bengaluru' },
      { label: 'Legislature', value: 'Vidhana Soudha, 1956' },
    ],
  },
  {
    era: '2011',
    title: 'Namma Metro',
    native: 'ನಮ್ಮ ಮೆಟ್ರೊ',
    desc: 'Bengaluru gets its own rapid transit line.',
    scene: 'metro',
    sky: 'linear-gradient(180deg,#03081a 0%,#0c1a3c 42%,#1e3a6e 76%,#4a76b8 100%)',
    skyLight: 'linear-gradient(180deg,#8ecdf5 0%,#bcdcff 42%,#5e9ede 74%,#2a5fae 100%)',
    glow: '#5aa2e8',
    image: '/heritage/metro.jpg',
    alt: 'Interior of a Namma Metro train in Bengaluru',
    credit: 'Photo: Gpkp, CC BY-SA 4.0, via Wikimedia Commons',
    story: [
      'The first train ran on 20 October 2011 between Baiyappanahalli and M.G. Road — Bengaluru finally had a rail line of its own, 150 years after the first railway reached the city.',
      'The Purple and Green lines now carry hundreds of thousands of people a day under and over the worst traffic in the country, and the network keeps widening every year.',
    ],
    facts: [
      { label: 'Opened', value: '20 October 2011' },
      { label: 'First stretch', value: 'Baiyappanahalli – M.G. Road' },
      { label: 'Operator', value: 'BMRCL' },
      { label: 'Lines', value: 'Purple and Green' },
    ],
  },
  {
    era: 'Today',
    title: 'Bengaluru',
    native: 'ಬೆಂಗಳೂರು',
    desc: 'A tech capital where every street still has a story.',
    scene: 'today',
    sky: 'linear-gradient(180deg,#02030a 0%,#080e20 42%,#141f42 76%,#2c4273 100%)',
    skyLight: 'linear-gradient(180deg,#9ecdf7 0%,#ffd08a 42%,#ff8f5e 74%,#c9452a 100%)',
    glow: '#ffce00',
    image: '/heritage/bengaluru.jpg',
    alt: 'The Bengaluru skyline at dusk',
    credit: 'Photo: Muhammad Mahdi Karim, GFDL 1.2, via Wikimedia Commons',
    story: [
      'Kempegowda founded the mud fort town in 1537, the British made it a cantonment, and the state made it the capital — today it is where half the country’s software and most of its night-time traffic happens.',
      'Lakes, bazaars, metro lines and new towers sit on the same ground. That is the city Namma Samasye is for: seven centuries of building, and every street still worth reporting on.',
    ],
    facts: [
      { label: 'Founded', value: '1537, by Kempegowda' },
      { label: 'Role', value: 'Capital of Karnataka' },
      { label: 'Known as', value: 'Garden city, tech capital' },
      { label: 'People', value: 'Over 13 million' },
    ],
  },
];
