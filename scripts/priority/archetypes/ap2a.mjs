// P2 archetypes (chunk 1/2): hazards with exposure/injury risk but no P1 rule.

export const AP2A = [
  {
    key: 'severe_waterlogging',
    expected: 'P2',
    category: 'CIVIC',
    subcategory: 'civic_drainage',
    group: 'g-water',
    signals: ['injury', 'public_exposure', 'infra_criticality', 'persistence'],
    safety: [],
    facts: { incidentType: 'waterlogging', waterlogging: true, roadBlocked: true },
    explanation: 'Severe flooding blocking traffic for days; no life-threat keyword keeps it out of P1.',
    langs: {
      en: {
        train: [
          'severe water logging near {place}, knee deep water and the road is blocked for 3 days',
          'the road near {place} is blocked by waist deep water logging for 4 days',
          'water logging near {place}, the road is blocked for 5 days',
          'water logging near {place} since 3 days, the road is blocked',
        ],
        eval: ['knee deep water logging near {place}, road is blocked for 3 days', 'the road near {place} is blocked by deep water logging for four days'],
      },
      kn: {
        train: [
          '{place} ಬಳಿ ರಸ್ತೆಯಲ್ಲಿ ನೀರು ತುಂಬಿದೆ, ಮಂಡಿಮಟ್ಟದ ನೀರು 3 ದಿನಗಳಿಂದ ಬ್ಲಾಕ್ ಆಗಿದೆ',
          '{place} ಬಳಿ ರಸ್ತೆ ಬ್ಲಾಕ್ ಆಗಿದೆ, ನೀರು ನಿಂತು 4 ದಿನ ಆಗಿದೆ',
        ],
        eval: ['{place} ಬಳಿ ರಸ್ತೆಯಲ್ಲಿ ನೀರು ತುಂಬಿದೆ, ಮಂಡಿಮಟ್ಟದ ನೀರು ಮೂರು ದಿನ ಬ್ಲಾಕ್ ಆಗಿದೆ'],
      },
      hi: {
        train: [
          '{place} के पास घुटनों तक पानी भरा है, रास्ता 3 दिन से बंद है',
          '{place} के पास पानी भरा है और रास्ता 4 दिन से बंद है',
          '{place} के पास गंभीर जलभराव है, सड़क 5 दिन से ब्लॉक',
          '{place} के पास पानी भरा है और सड़क 3 दिन से ब्लॉक है',
        ],
        eval: ['{place} पर घुटनों तक पानी भरा है, रास्ता 3 दिन से ब्लॉक है', '{place} के पास पानी भरा है और सड़क 4 दिन से ब्लॉक है'],
      },
      te: {
        train: [
          '{place} దగ్గర రోడ్డు మీద నీరు చేరింది, మోకాళ్ల లోతు 3 రోజులుగా బ్లాక్',
          '{place} దగ్గర రోడ్డు 4 రోజులుగా బ్లాక్, నీరునిలిచిపోయింది',
        ],
        eval: ['{place} దగ్గర నీరు భారీగా చేరింది, రోడ్డు 3 రోజులుగా బ్లాక్'],
      },
      hl: {
        train: [
          'water logging near {place}, knee deep water hai aur road is blocked for 3 days',
          'waterlogging near {place}, road is blocked for 4 din se',
          '{place} flood jaisa paani bhar gaya hai, road is blocked for 5 days',
          'water logging near {place}, the road is blocked 3 din se',
        ],
        eval: ['water logging near {place}, knee deep water and road is blocked for 3 days', 'waterlogging near {place}, road is blocked hai 4 din se'],
      },
    },
  },
  {
    key: 'sewage_overflow_blocked',
    expected: 'P2',
    category: 'CIVIC',
    subcategory: 'civic_drainage',
    group: 'g-water',
    signals: ['injury', 'public_exposure', 'infra_criticality', 'persistence'],
    safety: [],
    facts: { incidentType: 'sewage_contamination', roadBlocked: true },
    explanation: 'Raw sewage flooding the road for days with a blockage; flood severity without life threat.',
    langs: {
      en: {
        train: [
          'sewage overflow near {place}, the road is blocked for 4 days',
          'the road near {place} is blocked by sewage overflow since 3 days',
          'sewage overflow near {place} has made the road blocked for 5 days',
          'the road near {place} is blocked by sewage overflow for 3 days',
        ],
        eval: ['the road is blocked by sewage overflow near {place} for 4 days', 'the road near {place} is blocked by stinking drain water for 3 days'],
      },
      kn: {
        train: [
          '{place} ಬಳಿ ಚರಂಡಿ ಸೋರಿ ರಸ್ತೆ ಬ್ಲಾಕ್ ಆಗಿದೆ, 4 ದಿನಗಳಿಂದ',
          '{place} ಬಳಿ ರಸ್ತೆ ಬ್ಲಾಕ್, ಚರಂಡಿ ಸೋರುತ್ತಿದೆ 3 ದಿನದಿಂದ',
        ],
        eval: ['{place} ಬಳಿ ಚರಂಡಿ ಸೋರಿ ರಸ್ತೆ ಮೂರು ದಿನ ಬ್ಲಾಕ್ ಆಗಿದೆ'],
      },
      hi: {
        train: [
          '{place} के पास नाली भर गई है, रास्ता 4 दिन से बंद है',
          '{place} के पास गंदा पानी और नाली रिसाव से रास्ता 3 दिन से ब्लॉक है',
        ],
        eval: ['{place} पर नाली भर गई है, रास्ता 4 दिन से ब्लॉक है'],
      },
      te: {
        train: [
          '{place} దగ్గర మురుగు నీరు రోడ్డు మీదకు పోతోంది, 4 రోజులుగా బ్లాక్',
          '{place} దగ్గర రోడ్డు 3 రోజులుగా బ్లాక్, మురుగు నీరు పొంగితోంది',
        ],
        eval: ['{place} దగ్గర మురుగు నీరు లీక్ అవుతోంది, రోడ్డు 4 రోజులుగా బ్లాక్'],
      },
      hl: {
        train: ['sewage overflow near {place}, road is blocked for 4 din', '{place} ke paas sewage overflow, road is blocked for 3 din'],
        eval: ['sewage overflow near {place}, road is blocked hai 4 din se'],
      },
    },
  },
  {
    key: 'dog_attack_bitten',
    expected: 'P2',
    category: 'CIVIC',
    subcategory: 'civic_stray_animals',
    group: 'g-dog',
    signals: ['life_safety', 'injury'],
    safety: [],
    facts: { incidentType: 'animal_attack', injuries: ['bleeding'] },
    explanation: 'Bitten by a dog with bleeding; injury present but no multi-casualty/weapon rule fires.',
    langs: {
      en: {
        train: [
          'a stray dog bit me near {place} and blood is coming',
          'the dog bit a child near {place}, bleeding from the wound',
          'a street dog attacked and bit me near {place}, bleeding',
          'dog bite near {place}, blood is coming from the hand',
        ],
        eval: ['a dog bit me at {place} and it is bleeding', 'stray dog bit a girl near {place} and bleeding from the wound'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಒಂಟಿ ನಾಯಿ ಕಚ್ಚಿದೆ, ರಕ್ತ ಬರುತ್ತಿದೆ', '{place} ಬಳಿ ನಾಯಿ ಕಡಿದಿದೆ, ರಕ್ತ ಸೋರುತ್ತಿದೆ'],
        eval: ['{place} ಬಳಿ ಸಾಕು ನಾಯಿ ಕಡಿದು ರಕ್ತ ಬಂದಿದೆ'],
      },
      hi: {
        train: ['{place} के पास आवारा कुत्ते ने काटा है, खून आ रहा है', '{place} पर कुत्ते ने काटा है, बच्चे के हाथ से खून आ रहा है'],
        eval: ['{place} के पास कुत्ते ने काटा और खून आ रहा है'],
      },
      te: {
        train: ['{place} దగ్గర వీధి కుక్క కరిచింది, రక్తం వస్తోంది', '{place} దగ్గర కుక్క కరిచింది, గాయం నుండి రక్తం'],
        eval: ['{place} దగ్గర కుక్క కరిచి రక్తం వస్తోంది'],
      },
      hl: {
        train: ['{place} ke paas dog bite hua, bleeding ho rahi hai', 'dog bite near {place}, wound se bleeding ho rahi hai'],
        eval: ['{place} ke paas dog bite, bleeding ho rahi hai'],
      },
    },
  },
];
