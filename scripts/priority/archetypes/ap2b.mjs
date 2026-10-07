// P2 archetypes (chunk 2/2): injury from hazard / fight, no life-threat rule.

export const AP2B = [
  {
    key: 'pothole_fall_broken_arm',
    expected: 'P2',
    category: 'TRAFFIC',
    subcategory: 'traffic_pothole',
    group: 'g-pothole',
    signals: ['injury', 'public_exposure', 'persistence'],
    safety: [],
    facts: { incidentType: 'road_surface_hazard', injuries: ['fracture'] },
    explanation: 'Pothole caused a fracture; injury escalates over routine road repair.',
    langs: {
      en: {
        train: [
          'a deep pothole near {place} made me fall, my arm is fractured, it has been there for 3 days',
          'i fell into the pothole near {place}, my hand is fractured and it has been there for 3 days',
          'the pothole near {place} broke my leg when i fell, fracture for 3 days',
          'my arm is fractured near {place} after falling into the pothole, it has been there for 3 days',
        ],
        eval: ['a deep pothole near {place} made me fall, my arm is fractured for 3 days', 'i fell into the pothole at {place} and my leg is fractured, for 3 days'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಗುಂಡಿಗೆ ಬಿದ್ದು ಕೈ ಮೂಳೆ ಮುರಿದಿದೆ, 3 ದಿನದಿಂದ', '{place} ಬಳಿ ಗುಂಡಿಗೆ ಬಿದ್ದು ಮೂಳೆ ಮುರಿದಿದೆ, 4 ದಿನಗಳಿಂದ'],
        eval: ['{place} ಬಳಿ ದೊಡ್ಡ ಗುಂಡಿಗೆ ಬಿದ್ದು ಮೂಳೆ ಮುರಿದಿದೆ, 3 ದಿನ'],
      },
      hi: {
        train: ['{place} के पास गड्ढा है, उसमें गिरने से हाथ की हड्डी टूट गई, 3 दिन से', '{place} पर गड्ढा है, उसमें गिरने से हाथ फ्रैक्चर हो गया, 3 दिन से'],
        eval: ['{place} के पास गड्ढा है, उसमें गिरने से हाथ फ्रैक्चर हुआ, 3 दिन से', '{place} पर सड़क में गड्ढा है, उसमें गिरने से पैर की हड्डी टूट गई, 3 दिन'],
      },
      te: {
        train: ['{place} దగ్గర గుంతలో పడి చేతి ఎముక విరిగింది, 3 రోజులు', '{place} దగ్గర రోడ్డు గుంతలో పడి కాలు ఎముక విరిగింది, 4 రోజులు'],
        eval: ['{place} దగ్గర గుంతలో పడి చేతి ఎముక విరిగింది, 3 రోజులు', '{place} దగ్గర లోతట్టి గుంతలో పడి చేతి ఎముక విరిగింది, 3 రోజులు'],
      },
      hl: {
        train: ['pothole near {place} made me fall, arm fracture ho gaya for 3 days', 'deep pothole near {place}, main gir gaya aur leg fracture for 3 days'],
        eval: ['deep pothole near {place}, i fell and my arm is fractured for 3 days', 'pothole near {place} se gir gaya, meri leg fracture for 3 days'],
      },
    },
  },
  {
    key: 'assault_stick_bleeding',
    expected: 'P2',
    category: 'PUBLIC_SAFETY',
    subcategory: 'safety_harassment',
    group: 'g-violence',
    signals: ['life_safety', 'injury', 'immediate_danger'],
    safety: [],
    facts: { incidentType: 'physical_violence', injuries: ['bleeding'] },
    explanation: 'Assault with a stick and bleeding; bludgeon is not in the weapon rule, so injury band applies.',
    langs: {
      en: {
        train: [
          'a man attacked me with a stick near {place}, bleeding from the head',
          'someone beat me with a stick near {place} and blood is coming',
          'a group beat a vendor with a stick near {place}, bleeding',
          'i was hit with a stick near {place}, bleeding from the hand',
        ],
        eval: ['a person attacked me with a stick near {place} and it is bleeding', 'man beaten with a stick near {place}, blood from the head'],
      },
      kn: {
        train: ['{place} ಬಳಿ ದೊಣ್ಣೆಯಿಂದ ಹಲ್ಲೆ, ರಕ್ತ ಬರುತ್ತಿದೆ', '{place} ಬಳಿ ದೊಣ್ಣೆಯಿಂದ ಹಲ್ಲೆ ಮಾಡಿದ್ದಾರೆ, ರಕ್ತ ಸೋರುತ್ತಿದೆ'],
        eval: ['{place} ಬಳಿ ದೊಣ್ಣೆಯಿಂದ ಹಲ್ಲೆ ನಡೆದಿದೆ, ರಕ್ತ ಬಂದಿದೆ'],
      },
      hi: {
        train: ['{place} के पास लाठी से हमला हुआ, सिर से खून आ रहा है', '{place} पर एक आदमी ने लाठी से मारा, खून आ रहा है'],
        eval: ['{place} के पास लाठी से मारपीट हुई, एक आदमी से खून आ रहा है'],
      },
      te: {
        train: ['{place} దగ్గర కర్రతో దాడి చేశారు, తల నుండి రక్తం', '{place} దగ్గర కర్రతో కొట్టారు, రక్తం వస్తోంది'],
        eval: ['{place} దగ్గర కర్రతో దాడిలో రక్తం వస్తోంది'],
      },
      hl: {
        train: ['{place} ke paas lathi se attack hua, bleeding ho rahi hai', 'kisi ne lathi se maara near {place}, sar se blood aa raha hai'],
        eval: ['{place} ke paas stick se mara gaya, bleeding'],
      },
    },
  },
  {
    key: 'street_fight_bleeding',
    expected: 'P2',
    category: 'PUBLIC_SAFETY',
    subcategory: 'safety_harassment',
    group: 'g-violence',
    signals: ['life_safety', 'injury', 'public_exposure'],
    safety: [],
    facts: { incidentType: 'physical_violence', injuries: ['bleeding'] },
    explanation: 'Street fight with injury in public; escalation stops short of P1 without a weapon.',
    langs: {
      en: {
        train: [
          'a street fight near {place}, one man is bleeding',
          'two men are fighting near {place} and one is bleeding',
          'a group fight near {place}, bleeding from the nose',
          'people are fighting near {place}, one person is bleeding from the face',
        ],
        eval: ['fight near {place}, one person bleeding from the face', 'a fight at {place} with blood from the nose'],
      },
      kn: {
        train: ['{place} ಬಳಿ ರಸ್ತೆಯಲ್ಲಿ ಜಗಳ, ಒಬ್ಬರಿಗೆ ರಕ್ತ ಬರುತ್ತಿದೆ', '{place} ಬಳಿ ಜಗಳವಾಗಿ ಇಬ್ಬರು ಹೊಡೆದಾಡಿಕೊಂಡಿದ್ದಾರೆ, ರಕ್ತ ಸೋರುತ್ತಿದೆ'],
        eval: ['{place} ಬಳಿ ಜಗಳದಲ್ಲಿ ಒಬ್ಬರಿಗೆ ರಕ್ತ ಬರುತ್ತಿದೆ'],
      },
      hi: {
        train: ['{place} के पास सड़क पर मारपीट, एक आदमी से खून आ रहा है', '{place} पर दो लोग लड़ रहे हैं, खून आ रहा है'],
        eval: ['{place} के पास झगड़े में एक आदमी से खून आ रहा है'],
      },
      te: {
        train: ['{place} దగ్గర రోడ్డు పై గొడవ, ఒకరికి రక్తం', '{place} దగ్గర ఇద్దరు కొట్టుకుంటున్నారు, రక్తం వస్తోంది'],
        eval: ['{place} దగ్గర గొడవలో రక్తం వస్తోంది'],
      },
      hl: {
        train: ['{place} road par ladai ho rahi hai, ek ko bleeding ho rahi hai', 'fight near {place}, ek ko bleeding ho rahi hai'],
        eval: ['jhagda near {place}, ek aadmi bleeding kar raha hai'],
      },
    },
  },
];
