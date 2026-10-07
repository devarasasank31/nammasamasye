// P1 archetypes (chunk 3/3): drowning, gas, violence, bleeding, cave-in.

export const AP1C = [
  {
    key: 'drowning',
    expected: 'P1',
    category: 'CIVIC',
    subcategory: 'civic_parks',
    group: 'g-water',
    signals: ['life_safety', 'immediate_danger'],
    safety: ['drowning'],
    facts: { incidentType: 'drowning' },
    explanation: 'Drowning risk; current or not, it is an active rescue situation.',
    langs: {
      en: {
        train: ['a child is drowning in the lake near {place}', 'a man is drowning in the canal at {place}', 'someone is drowning in the pond near {place}', 'a boy is drowning in the river near {place}'],
        eval: ['the child at {place} is drowning now', 'a woman is drowning in the lake near {place}'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಕೆರೆಯಲ್ಲಿ ಮಗು ಮುಳುಗುತ್ತಿದೆ', '{place} ಬಳಿ ಹೊಳೆಯಲ್ಲಿ ವ್ಯಕ್ತಿ ಮುಳುಗುತ್ತಿದ್ದಾನೆ'],
        eval: ['{place} ಬಳಿ ಕೆರೆಯಲ್ಲಿ ಒಬ್ಬರು ಮುಳುಗುತ್ತಿದ್ದಾರೆ'],
      },
      hi: {
        train: ['{place} के पास तालाब में एक बच्चा डूब रहा है', '{place} के पास नहर में एक आदमी डूब गया'],
        eval: ['{place} के पास तालाब में एक आदमी डूब रहा है'],
      },
      te: {
        train: ['{place} దగ్గర చెరువులో పిల్లాడు మునిగిపోతున్నాడు', '{place} దగ్గర కాలువలో ఒకరు మునిగారు'],
        eval: ['{place} దగ్గర సరస్సులో ఒక చిన్నారి మునిగిపోతోంది'],
      },
      hl: {
        train: ['{place} ke paas talab mein bachcha drowning ho raha hai', 'a man is drowning in the canal near {place}'],
        eval: ['child drowning near {place} lake'],
      },
    },
  },
  {
    key: 'gas_leak',
    expected: 'P1',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-gas',
    signals: ['life_safety', 'immediate_danger'],
    safety: ['gas_chemical_hazard'],
    facts: { incidentType: 'gas_chemical_hazard' },
    explanation: 'Gas leak or chemical exposure; evacuation-level hazard.',
    langs: {
      en: {
        train: ['gas leak near {place}, strong smell in the lane', 'chemical smell coming from the factory at {place}', 'there is a gas leak at {place} road', 'toxic fumes near {place}, people are coughing'],
        eval: ['smell of gas near {place} shop', 'chemical leak from the tanker at {place}'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಅನಿಲ ಸೋರಿಕೆ ಇದೆ', '{place} ಬಳಿ ರಾಸಾಯನಿಕ ವಾಸನೆ ಬರುತ್ತಿದೆ'],
        eval: ['{place} ಬಳಿ ಅನಿಲ ಸೋರಿಕೆಯಿಂದ ಜನರು ಓಡುತ್ತಿದ್ದಾರೆ'],
      },
      hi: {
        train: ['{place} के पास गैस रिसाव है', '{place} के पास रासायनिक गंध आ रही है'],
        eval: ['{place} पर गैस रिसाव से लोग भाग रहे हैं'],
      },
      te: {
        train: ['{place} దగ్గర వాయువు సోరుతోంది', '{place} దగ్గర రసాయన వాసన వస్తోంది'],
        eval: ['{place} దగ్గర వాయువు సోరిక జరుగుతోంది'],
      },
      hl: {
        train: ['{place} ke paas gas leak hai, tej smell aa rahi hai', 'chemical smell near {place} factory'],
        eval: ['gas leak at {place} lane, log bhag rahe hain'],
      },
    },
  },
  {
    key: 'stabbing',
    expected: 'P1',
    category: 'PUBLIC_SAFETY',
    subcategory: 'safety_harassment',
    group: 'g-violence',
    signals: ['life_safety', 'immediate_danger'],
    safety: ['active_violence'],
    facts: { incidentType: 'physical_violence' },
    explanation: 'Weapon or life-threatening violence in progress.',
    langs: {
      en: {
        train: ['a man was stabbed with a knife near {place}', 'a person attacked me with a knife near {place}', 'someone is trying to kill me near {place} with a weapon', 'a man was stabbed near {place} and is bleeding'],
        eval: ['mob attack near {place}, one man beaten badly', 'someone chased me with a knife near {place}'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಕತ್ತಿಯಿಂದ ಹಲ್ಲೆ ನಡೆದಿದೆ', '{place} ಬಳಿ ಕತ್ತಿಯಿಂದ ಇಬ್ಬರಿಗೆ ಹಲ್ಲೆ ಮಾಡಿದ್ದಾರೆ'],
        eval: ['{place} ಬಳಿ ಕೊಲೆಗೆ ಯತ್ನ, ಕತ್ತಿ ಬಳಸಿದ್ದಾರೆ'],
      },
      hi: {
        train: ['{place} के पास एक आदमी को चाकू से मारा गया', '{place} पर चाकू से हमला हुआ'],
        eval: ['{place} के पास जान से मारने की धमकी दी जा रही है'],
      },
      te: {
        train: ['{place} దగ్గర ఒకరిని కత్తితో దాడి చేశారు', '{place} దగ్గర కత్తితో దాడి జరిగింది'],
        eval: ['{place} దగ్గర హత్య చేస్తానని బెదిరింపు'],
      },
      hl: {
        train: ['{place} ke paas stabbing hui, knife se', 'kisi ne knife se attack kiya {place} par'],
        eval: ['a man attacked me with a knife near {place} and ran away'],
      },
    },
  },
  {
    key: 'severe_bleeding_road',
    expected: 'P1',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-bleed',
    signals: ['life_safety', 'injury', 'immediate_danger'],
    safety: ['severe_bleeding'],
    facts: { incidentType: 'vehicle_collision', injuries: ['bleeding'] },
    explanation: 'Severe bleeding or blood on the road, with no vehicle named; still an override.',
    langs: {
      en: {
        train: ['blood is on the road near {place}, bleeding heavily', 'there is a pool of blood on the road near {place}', 'heavy bleeding on the road near {place}', 'bleeding badly on the road near {place}, blood is everywhere'],
        eval: ['someone is bleeding badly near {place}, blood on the ground', 'blood is everywhere on the road near {place}'],
      },
      kn: {
        train: ['{place} ಬಳಿ ರಸ್ತೆಯಲ್ಲಿ ರಕ್ತ ಸೋರುತ್ತಿದೆ, ಭಾರಿ ರಕ್ತ', '{place} ಬಳಿ ರಸ್ತೆಯಲ್ಲಿ ರಕ್ತ ಬಿಟ್ಟಿದೆ, ತೀವ್ರ ರಕ್ತ'],
        eval: ['{place} ಬಳಿ ರಸ್ತೆಯಲ್ಲಿ ರಕ್ತ ಬರುತ್ತಿದೆ, ಭಾರಿ ರಕ್ತ ಸೋರಿಕೆ'],
      },
      hi: {
        train: ['{place} के पास सड़क पर खून बह रहा है, काफी खून', '{place} पर सड़क में खून बह रहा है और बहुत खून है'],
        eval: ['{place} के पास सड़क पर खून काफी बह रहा है'],
      },
      te: {
        train: ['{place} దగ్గర రోడ్డు మీద రక్తం భారిగా ప్రవహిస్తోంది', '{place} దగ్గర రోడ్డు మీద రక్తం తీవ్రంగా వస్తోంది'],
        eval: ['{place} దగ్గర రోడ్డు మీద రక్తం భారిగా ఉంది'],
      },
      hl: {
        train: ['{place} road par blood aa raha hai, heavy bleeding', 'road par heavy bleeding near {place}, blood on the road'],
        eval: ['{place} road par bleeding ho rahi hai, blood is on the road'],
      },
    },
  },
  {
    key: 'road_cave_in',
    expected: 'P1',
    category: 'UTILITIES',
    subcategory: 'civic_water_supply',
    group: 'g-pothole',
    signals: ['life_safety', 'immediate_danger', 'public_exposure'],
    safety: ['structural_collapse'],
    facts: { incidentType: 'structural_collapse' },
    explanation: 'Road caved in after a water main break; cause drives routing, safety drives the band.',
    langs: {
      en: {
        train: ['the water main broke near {place} and that is why the road caved in', 'a water pipe burst under the road at {place}, the road has caved in', 'water main broke near {place} causing the road to cave in', 'the road near {place} has caved in because the water pipe broke'],
        eval: ['road caved in near {place} as the water main broke under it', 'because a supply pipe broke, the road near {place} caved in'],
      },
      kn: {
        train: ['{place} ಬಳಿ ನೀರಿನ ಪೈಪ್ ಒಡೆದು ರಸ್ತೆ ಕುಸಿದಿದೆ', '{place} ಬಳಿ ರಸ್ತೆ ಕುಸಿದಿದೆ, ಒಳಚರಂಡಿ ಪೈಪ್ ಒಡೆದಿದೆ'],
        eval: ['{place} ಬಳಿ ನೀರಿನ ಪೈಪ್ ಹಾಳಾಗಿ ರಸ್ತೆ ಕುಸಿದಿದೆ'],
      },
      hi: {
        train: ['{place} के पास पानी का पाइप टूटने से सड़क का हिस्सा गिर गया', '{place} के पास नल की लाइन फूटने से सड़क गिर गया'],
        eval: ['{place} पर सड़क का हिस्सा गिर गया क्योंकि पाइप टूट गया'],
      },
      te: {
        train: ['{place} దగ్గర నీటి పైపు పగిలి రోడ్డు కుప్పకూలింది', '{place} దగ్గర రోడ్డు కూలిపోయింది, వాటర్ పైపు తెగిపోయింది'],
        eval: ['{place} దగ్గర పైపు పగిలి రోడ్డు కుప్పకూలింది'],
      },
      hl: {
        train: ['water main break near {place}, road cave in ho gaya', 'water pipe toot gaya {place} mein, road caved in'],
        eval: ['road caved in near {place} because water main broke'],
      },
    },
  },
];
