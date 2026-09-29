export interface HeritageStop {
  era: string;
  title: string;
  native: string;
  desc: string;
  sky: string;
  glow: string;
}

// The same seven stops the timeline lists, each with the colours its century
// is painted in. The landing background cross-fades between these as you scroll.
export const heritage: HeritageStop[] = [
  {
    era: '6th century',
    title: 'Badami',
    native: 'ಬಾದಾಮಿ',
    desc: 'Chalukyan rock-cut caves above the Agastya lake.',
    sky: 'linear-gradient(180deg,#1e0d05 0%,#5d2410 42%,#b45f28 76%,#e8a76b 100%)',
    glow: '#e0813c',
  },
  {
    era: '14th century',
    title: 'Hampi',
    native: 'ಹಂಪೆ',
    desc: 'The ruined capital of the Vijayanagara empire.',
    sky: 'linear-gradient(180deg,#170d02 0%,#54300a 42%,#ab761c 76%,#f0c15a 100%)',
    glow: '#f0c15a',
  },
  {
    era: '1912',
    title: 'Mysore Palace',
    native: 'ಮೈಸೂರು ಅರಮನೆ',
    desc: "The Wadiyar seat, still the state's best-known landmark.",
    sky: 'linear-gradient(180deg,#130a20 0%,#3a1a4d 42%,#7b3a6b 76%,#d98a5a 100%)',
    glow: '#e0a15c',
  },
  {
    era: '1780s',
    title: 'Tipu Sultan',
    native: 'ಟಿಪ್ಪು ಸುಲ್ತಾನ್',
    desc: 'The Tiger of Mysore and his war against the Company.',
    sky: 'linear-gradient(180deg,#04120b 0%,#0f3521 42%,#2c6b3a 76%,#a8bf54 100%)',
    glow: '#c9b04a',
  },
  {
    era: '1956',
    title: 'Karnataka formation',
    native: 'ಕರ್ನಾಟಕ ರಚನೆ',
    desc: 'Mysore State renamed Karnataka on 1 November.',
    sky: 'linear-gradient(180deg,#260708 0%,#6b0f11 42%,#c21f22 74%,#ffce00 100%)',
    glow: '#ffce00',
  },
  {
    era: '2011',
    title: 'Namma Metro',
    native: 'ನಮ್ಮ ಮೆಟ್ರೊ',
    desc: 'Bengaluru gets its own rapid transit line.',
    sky: 'linear-gradient(180deg,#03081a 0%,#0c1a3c 42%,#1e3a6e 76%,#4a76b8 100%)',
    glow: '#5aa2e8',
  },
  {
    era: 'Today',
    title: 'Bengaluru',
    native: 'ಬೆಂಗಳೂರು',
    desc: 'A tech capital where every street still has a story.',
    sky: 'linear-gradient(180deg,#02030a 0%,#080e20 42%,#141f42 76%,#2c4273 100%)',
    glow: '#ffce00',
  },
];
