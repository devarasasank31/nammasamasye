// P3 archetypes (chunk 1/4): routine civic amenities, safety floor = 36.

export const AP3A = [
  {
    key: 'streetlight_out',
    expected: 'P3',
    category: 'CIVIC',
    subcategory: 'civic_streetlight',
    group: 'g-streetlight',
    signals: ['public_exposure', 'persistence'],
    safety: [],
    facts: { incidentType: 'street_light_outage' },
    explanation: 'Streetlight not working; safety floor keeps it P3.',
    langs: {
      en: {
        train: ['the street light near {place} is not working', 'street lights are not working on the road near {place}', 'the lamp post near {place} is not working for a week', 'streetlight near {place} is dead, road is dark'],
        eval: ['no street light near {place} for a week', 'the streetlight at {place} is not working for days'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಬೀದಿ ದೀಪ ಉರಿಯುತ್ತಿಲ್ಲ', '{place} ಬಳಿ ಬೀದಿ ದೀಪ ಹೋಗಿದೆ'],
        eval: ['{place} ಬಳಿ ಒಂದು ವಾರದಿಂದ ಬೀದಿ ದೀಪ ಇಲ್ಲ'],
      },
      hi: {
        train: ['{place} के पास स्ट्रीट लाइट नहीं जल रही है', '{place} पर स्ट्रीट लाइट खराब है'],
        eval: ['{place} के पास एक हफ्ते से स्ट्रीट लाइट नहीं है'],
      },
      te: {
        train: ['{place} దగ్గర స్ట్రీట్ లైట్ వెలగడం లేదు', '{place} దగ్గర స్ట్రీట్ లైట్ పనిచేయడం లేదు'],
        eval: ['{place} దగ్గర వారం రోజులుగా స్ట్రీట్ లైట్ లేదు'],
      },
      hl: {
        train: ['{place} ke paas street light not working hai', 'street light near {place} not working, kharab hai'],
        eval: ['{place} road par street light not working, 1 week ho gaya'],
      },
    },
  },
  {
    key: 'garbage_not_collected',
    expected: 'P3',
    category: 'CIVIC',
    subcategory: 'civic_garbage',
    group: 'g-garbage',
    signals: ['public_exposure', 'persistence', 'population'],
    safety: [],
    facts: { incidentType: 'garbage_dump' },
    explanation: 'Garbage uncollected; civic routine with exposure but no danger.',
    langs: {
      en: {
        train: ['garbage is not collected near {place} for 5 days', 'the garbage bin near {place} is overflowing', 'garbage is lying on the road near {place} for a week', 'no garbage collection near {place} since 5 days'],
        eval: ['garbage has not been cleared near {place} for 5 days', 'the bin near {place} is overflowing with garbage'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಐದು ದಿನಗಳಿಂದ ಕಸ ಸಂಗ್ರಹ ಆಗಿಲ್ಲ', '{place} ಬಳಿ ಕಸ ತುಂಬಿ ಹೋಗಿದೆ'],
        eval: ['{place} ಬಳಿ ಒಂದು ವಾರದಿಂದ ಕಸ ರಾಶಿ ಆಗಿದೆ'],
      },
      hi: {
        train: ['{place} के पास 5 दिन से कचरा नहीं उठा', '{place} के पास कचरा कूड़ेदान में भरा है'],
        eval: ['{place} पर कचरा नहीं उठा, 5 दिन हो गए'],
      },
      te: {
        train: ['{place} దగ్గర 5 రోజులుగా చెత్త తీయడం లేదు', '{place} దగ్గర చెత్త బుట్ట నిండిపోయింది'],
        eval: ['{place} దగ్గర వారం రోజులుగా చెత్త తీయలేదు'],
      },
      hl: {
        train: ['garbage near {place} 5 din se nahi uthaya', 'garbage bin near {place} full hai for 3 days'],
        eval: ['garbage near {place} nahi uthaya, 5 din ho gaye'],
      },
    },
  },
  {
    key: 'pothole_routine',
    expected: 'P3',
    category: 'TRAFFIC',
    subcategory: 'traffic_pothole',
    group: 'g-pothole',
    signals: ['public_exposure', 'persistence'],
    safety: [],
    facts: { incidentType: 'road_surface_hazard' },
    explanation: 'A pothole with no injury; routine repair issue.',
    langs: {
      en: {
        train: ['there is a big pothole on the road near {place}', 'potholes near {place} are getting dangerous', 'a deep pothole has formed on the road near {place}', 'the road near {place} is full of potholes'],
        eval: ['a large pothole near {place} road', 'the road near {place} has potholes everywhere'],
      },
      kn: {
        train: ['{place} ಬಳಿ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಇದೆ', '{place} ಬಳಿ ರಸ್ತೆ ಗುಂಡಿಗಳಿಂದ ತುಂಬಿದೆ'],
        eval: ['{place} ಬಳಿ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಬಿದ್ದಿದೆ'],
      },
      hi: {
        train: ['{place} के पास सड़क में बड़ा गड्ढा है', '{place} के पास सड़क गड्ढों से भरी है'],
        eval: ['{place} पर सड़क में गड्ढा हो गया है'],
      },
      te: {
        train: ['{place} దగ్గర రోడ్డు మీద పెద్ద గుంత ఉంది', '{place} దగ్గర రోడ్డు గుంతలతో నిండి ఉంది'],
        eval: ['{place} దగ్గర రోడ్డు మీద గుంత పడింది'],
      },
      hl: {
        train: ['{place} road par bada pothole hai', 'road near {place} se potholes bhari hui hai'],
        eval: ['{place} road par kaafi pothole hain'],
      },
    },
  },
  {
    key: 'waterlogging_mild',
    expected: 'P3',
    category: 'CIVIC',
    subcategory: 'civic_drainage',
    group: 'g-water',
    signals: ['public_exposure', 'persistence'],
    safety: [],
    facts: { incidentType: 'waterlogging', waterlogging: true },
    explanation: 'Mild water logging, ankle deep; explicitly not blocked, no severe wording.',
    langs: {
      en: {
        train: ['ankle deep water logging near {place}', 'water standing near {place} after the rain', 'small water logging near {place} road', 'water logging near {place} on the footpath'],
        eval: ['shallow water logging near {place} after rain', 'water logging near {place}, ankle deep'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಸ್ವಲ್ಪ ನೀರು ನಿಂತಿದೆ', '{place} ಬಳಿ ಮಳೆಯಿಂದ ನೀರು ನಿಂತಿದೆ'],
        eval: ['{place} ಬಳಿ ಅಂಗಜೆಯಲ್ಲಿ ನೀರು ನಿಂತಿದೆ'],
      },
      hi: {
        train: ['{place} के पास थोड़ा पानी भरा है', '{place} के पास बारिश से जलभराव है'],
        eval: ['{place} पर नाली के पास थोड़ा पानी भरा है'],
      },
      te: {
        train: ['{place} దగ్గర కొంచెం నీరు చేరింది', '{place} దగ్గర వర్షంతో నీరు చేరింది'],
        eval: ['{place} దగ్గర రోడ్డు మీద కొంచెం నీరు చేరింది'],
      },
      hl: {
        train: ['water logging near {place}, thoda paani bhar gaya', 'water logging near {place} road after rain'],
        eval: ['water logging near {place}, halka paani road par'],
      },
    },
  },
  {
    key: 'sewage_mild',
    expected: 'P3',
    category: 'CIVIC',
    subcategory: 'civic_drainage',
    group: 'g-water',
    signals: ['public_exposure', 'persistence'],
    safety: [],
    facts: { incidentType: 'sewage_contamination' },
    explanation: 'Sewage seepage in the lane; below flood severity, so score floor applies.',
    langs: {
      en: {
        train: ['sewage is overflowing near {place} lane', 'sewage is leaking near {place} lane', 'stinking drain water near {place}, smell is bad', 'sewage is flowing near {place} lane'],
        eval: ['sewage is overflowing near {place} drain', 'sewage leakage near {place} lane for two days'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಚರಂಡಿ ನೀರು ಸೋರುತ್ತಿದೆ', '{place} ಬಳಿ ಒಳಚರಂಡಿ ಸೋರಿ ನೀರು ಹೊರಗೆ ಬರುತ್ತಿದೆ'],
        eval: ['{place} ಬಳಿ ಚರಂಡಿ ತುಂಬಿ ಹರಿಯುತ್ತಿದೆ'],
      },
      hi: {
        train: ['{place} के पास नाली भर गई है', '{place} के पास नाली गंदा पानी से भरी है'],
        eval: ['{place} के पास नाली का गंदा पानी सड़क पर है'],
      },
      te: {
        train: ['{place} దగ్గర మురుగు నీరు సోరుతోంది', '{place} దగ్గర మురుగు నీరు బయటకు వస్తోంది'],
        eval: ['{place} దగ్గర మురుగు నీరు రోడ్డు మీదకు వస్తోంది'],
      },
      hl: {
        train: ['{place} ke paas sewage overflow ho raha hai', 'sewage is leaking near {place} lane, smell aa rahi hai'],
        eval: ['sewage overflow near {place} nali, 2 din'],
      },
    },
  },
];
