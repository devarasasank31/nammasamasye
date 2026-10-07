// P3 archetypes (chunk 4/4): housing dispute + negation/resolved hard negatives.

export const AP3D = [
  {
    key: 'housing_deposit',
    expected: 'P3',
    category: 'HOUSING',
    subcategory: 'housing_tenant',
    group: 'g-housing',
    signals: ['persistence'],
    safety: [],
    facts: { incidentType: 'housing' },
    explanation: 'Deposit dispute with the landlord; civil issue on the routine floor.',
    langs: {
      en: {
        train: ['my landlord has not returned the deposit near {place} for 2 months', 'the landlord near {place} is not returning my deposit', 'deposit dispute with the owner near {place} since 45 days', 'owner is not giving back my deposit near {place}'],
        eval: ['my deposit was not returned by the landlord near {place}', 'the owner near {place} still has my deposit after 2 months'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಮಾಲೀಕರು ಡೆಪಾಸಿಟ್ ಹಣ ಹಿಂತಿರುಗಿಸುತ್ತಿಲ್ಲ', '{place} ಬಳಿ ಬಾಡಿಗೆ ವಿಚಾರದಲ್ಲಿ ಜಗಳ ನಡೆದಿದೆ'],
        eval: ['{place} ಬಳಿ ಮನೆ ಮಾಲೀಕರು ಡೆಪಾಸಿಟ್ ಕೊಟ್ಟಿಲ್ಲ'],
      },
      hi: {
        train: ['{place} के पास मकान मालिक डिपॉज़िट नहीं लौटा रहा', '{place} पर किराए के पैसे को लेकर विवाद है'],
        eval: ['{place} के पास मकान मालिक ने डिपॉज़िट वापस नहीं किया'],
      },
      te: {
        train: ['{place} దగ్గర యజమాని డిపాజిట్ తిరిగి ఇవ్వడం లేదు', '{place} దగ్గర అద్దె విషయంలో గొడవ ఉంది'],
        eval: ['{place} దగ్గర ఇల్లు యజమాని డిపాజిట్ ఇవ్వలేదు'],
      },
      hl: {
        train: ['{place} ke paas landlord deposit nahi de raha 2 mahine se', 'owner ke saath deposit dispute near {place}'],
        eval: ['{place} ke paas landlord ne deposit wapas nahi kiya'],
      },
    },
  },
  {
    key: 'negation_wire_supply_cut',
    expected: 'P3',
    category: 'UTILITIES',
    subcategory: 'util_power',
    group: 'g-wire',
    signals: [],
    safety: [],
    facts: { incidentType: 'electrical_hazard' },
    explanation: 'Hard negative: a wire scare that is denied and the supply is cut — never P1.',
    tags: ['negation'],
    langs: {
      en: {
        train: [
          'people say there is a live wire scare but there is no live wire on the road, supply is cut and safe now',
          'i saw a wire near {place} but the supply is cut so it is not live',
        ],
        eval: ['there is no live wire at {place}, the line is dead and safe now'],
      },
      kn: {
        train: ['{place} ಬಳಿ ವಿದ್ಯುತ್ ತಂತಿ ಇಲ್ಲ, ಸಪ್ಲೈ ಕಟ್ ಆಗಿದೆ'],
        eval: ['{place} ಬಳಿ ಯಾವುದೇ ವಿದ್ಯುತ್ ತಂತಿ ಇಲ್ಲ, ಸುರಕ್ಷಿತ'],
      },
      hi: {
        train: ['{place} के पास कोई लाइव तार नहीं है, सप्लाई कट है'],
        eval: ['{place} पर बिजली का तार नहीं है, लाइन बंद है'],
      },
      te: {
        train: ['{place} దగ్గర ప్రత్యక్ష విద్యుత్ తీగ లేదు, సప్లై కట్'],
        eval: ['{place} దగ్గర విద్యుత్ తీగ లేదు, లైన్ డెడ్'],
      },
      hl: {
        train: ['{place} road par koi live wire nahi hai, supply cut hai'],
        eval: ['{place} ke paas live wire nahi hai, safe hai abhi'],
      },
    },
  },
  {
    key: 'negation_no_accident_clear',
    expected: 'P3',
    category: 'TRAFFIC',
    subcategory: 'traffic_accident',
    group: 'g-accident',
    signals: [],
    safety: [],
    facts: { incidentType: 'vehicle_collision' },
    explanation: 'Hard negative: accident was yesterday, everyone is fine, road clear — never P1.',
    tags: ['negation'],
    langs: {
      en: {
        train: ['there was an accident yesterday but everyone is fine and the road is clear', 'a crash happened near {place} but everyone is okay now'],
        eval: ['minor accident near {place} earlier, everyone is fine and the road is clear'],
      },
      kn: {
        train: ['ನಿನ್ನೆ ಅಪಘಾತ ಆಯಿತು ಆದರೆ ಎಲ್ಲರೂ ಸರಿ ಇದ್ದಾರೆ ರಸ್ತೆ ಸರಿಯಾಗಿದೆ'],
        eval: ['{place} ಬಳಿ ಅಪಘಾತ ಆಗಿತ್ತು, ಎಲ್ಲರೂ ಸುರಕ್ಷಿತ'],
      },
      hi: {
        train: ['कल एक्सीडेंट हुआ था लेकिन सब लोग ठीक हैं और सड़क खाली है'],
        eval: ['{place} के पास एक्सीडेंट हुआ था, सब ठीक हैं'],
      },
      te: {
        train: ['నిన్న ప్రమాదం జరిగింది కానీ అందరూ సరే ఉన్నారు రోడ్డు క్లియర్'],
        eval: ['{place} దగ్గర ప్రమాదం జరిగింది, అందరూ సరే'],
      },
      hl: {
        train: ['kal accident hua tha lekin sab log theek hain aur raasta clear hai'],
        eval: ['{place} ke paas accident hua tha, sab theek hain'],
      },
    },
  },
];
