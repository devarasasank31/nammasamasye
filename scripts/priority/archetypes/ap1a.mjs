// P1 archetypes (chunk 1/3): traffic collisions + electrical.
// Labels are BY CONSTRUCTION: every surface is an active life-safety
// report, so the deterministic safety engine must force P1.

export const AP1A = [
  {
    key: 'accident_fracture',
    expected: 'P1',
    category: 'TRAFFIC',
    subcategory: 'traffic_accident',
    group: 'g-accident',
    signals: ['life_safety', 'injury', 'immediate_danger'],
    safety: ['accident_serious_injury'],
    facts: { incidentType: 'vehicle_collision', accidentInvolved: true, injuries: ['fracture'] },
    explanation: 'Collision with a suspected fracture; unverified injury still overrides.',
    langs: {
      en: {
        train: [
          'a car crashed into my bike near {place}, my leg is fractured',
          'bike crash near {place}, my arm bone is broken',
          'scooter hit by an auto near {place}, my leg is fractured',
          'car accident at {place}, my ribs are broken',
        ],
        eval: [
          'I was hit by a car at {place} and my leg is fractured',
          'a car knocked down my bike at {place}, the bone in my arm is broken',
        ],
      },
      kn: {
        train: [
          'ಕಾರು ನಮ್ಮ ಬೈಕ್‌ಗೆ ಡಿಕ್ಕಿ ಹೊಡೆಯಿತು {place} ಬಳಿ, ನನ್ನ ಕಾಲಿನ ಮೂಳೆ ಮುರಿದಿದೆ',
          'ಅಪಘಾತ ಆಗಿದೆ {place} ಬಳಿ, ಮೂಳೆ ಮುರಿದಿದೆ',
        ],
        eval: ['ಬೈಕ್‌ಗೆ ಕಾರು ಡಿಕ್ಕಿ ಹೊಡೆಯಿತು {place} ಬಳಿ, ಮೂಳೆ ಮುರಿದಿದೆ'],
      },
      hi: {
        train: [
          'कार ने मेरी बाइक को टक्कर मारी {place} के पास, मेरी हड्डी टूट गई',
          '{place} के पास एक्सीडेंट हो गया, मेरी हड्डी टूट गई',
        ],
        eval: ['स्कूटर से टक्कर हो गई {place} पर, मेरी हड्डी टूट गई'],
      },
      te: {
        train: [
          '{place} దగ్గర యాక్సిడెంట్, నా కాలు ఎముక విరిగింది',
          '{place} దగ్గర యాక్సిడెంట్ అయింది, నా ఎముక విరిగింది',
        ],
        eval: ['{place} దగ్గర ప్రమాదం జరిగింది, నా కాలు ఎముక విరిగింది'],
      },
      hl: {
        train: ['bike ka accident near {place}, mera leg fracture ho gaya', 'car accident near {place}, meri leg fracture ho gaya'],
        eval: ['auto accident at {place}, mera haath fracture ho gaya'],
      },
    },
  },
  {
    key: 'accident_unconscious',
    expected: 'P1',
    category: 'TRAFFIC',
    subcategory: 'traffic_accident',
    group: 'g-accident',
    signals: ['life_safety', 'injury', 'immediate_danger'],
    safety: ['accident_serious_injury', 'unconscious'],
    facts: { incidentType: 'vehicle_collision', accidentInvolved: true, injuries: ['unconscious'] },
    explanation: 'Unconscious person after a collision; two safety rules fire.',
    langs: {
      en: {
        train: [
          'person unconscious after car accident near {place}',
          'a man is unconscious following a bike crash at {place}',
          'driver unconscious after the auto collision near {place}',
          'one person unconscious after the road accident at {place}',
        ],
        eval: ['after the car crash near {place} a person is lying unconscious', 'a woman became unconscious in the accident near {place}'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಕಾರು ಅಪಘಾತದ ನಂತರ ವ್ಯಕ್ತಿ ಬೇಹೋಶ ಆಗಿದ್ದಾನೆ', 'ಬೈಕ್ ಡಿಕ್ಕಿಯಾಗಿ {place} ಬಳಿ ಒಬ್ಬರು ಬೇಹೋಶ ಆಗಿದ್ದಾರೆ'],
        eval: ['{place} ಬಳಿ ಅಪಘಾತದಲ್ಲಿ ವ್ಯಕ್ತಿ ಬೇಹೋಶ ಆಗಿದ್ದಾನೆ'],
      },
      hi: {
        train: ['{place} के पास कार एक्सीडेंट के बाद व्यक्ति बेहोश पड़ा है', 'बाइक से टक्कर में {place} पर एक आदमी बेहोश है'],
        eval: ['{place} के पास सड़क दुर्घटना में व्यक्ति बेहोश है'],
      },
      te: {
        train: ['{place} దగ్గర కారు యాక్సిడెంట్ తర్వాత వ్యక్తి అపస్మారక స్థితిలో ఉన్నాడు', 'బైక్ డిక్కిలో {place} దగ్గర ఒకరికి స్పృహ లేదు'],
        eval: ['{place} దగ్గర ప్రమాదంలో వ్యక్తి అపస్మారక స్థితిలో ఉన్నాడు'],
      },
      hl: {
        train: ['{place} road accident ke baad ek aadmi unconscious pada hai', 'bike crash at {place}, driver unconscious'],
        eval: ['car accident near {place}, one person unconscious'],
      },
    },
  },
  {
    key: 'accident_bleeding',
    expected: 'P1',
    category: 'TRAFFIC',
    subcategory: 'traffic_accident',
    group: 'g-accident',
    signals: ['life_safety', 'injury', 'immediate_danger'],
    safety: ['accident_serious_injury', 'severe_bleeding'],
    facts: { incidentType: 'vehicle_collision', accidentInvolved: true, injuries: ['bleeding'] },
    explanation: 'Collision with bleeding; accident-injury and severe-bleeding rules both fire.',
    langs: {
      en: {
        train: [
          'scooter accident near {place}, blood is flowing from the head',
          'car crash at {place}, he is bleeding badly',
          'bike hit and run at {place}, blood on the road',
          'auto accident near {place}, heavy bleeding from the leg',
        ],
        eval: ['after the car accident at {place} blood is coming from the head', 'bike accident near {place}, bleeding a lot from the arm'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಸ್ಕೂಟರ್ ಅಪಘಾತ, ತಲೆಯಿಂದ ರಕ್ತ ಬರುತ್ತಿದೆ', 'ಬೈಕ್ ಡಿಕ್ಕಿ {place} ಬಳಿ, ರಕ್ತ ಸೋರುತ್ತಿದೆ'],
        eval: ['{place} ಬಳಿ ಕಾರು ಅಪಘಾತದಲ್ಲಿ ರಕ್ತ ಬರುತ್ತಿದೆ'],
      },
      hi: {
        train: ['{place} के पास स्कूटर एक्सीडेंट, सिर से खून बह रहा है', '{place} पर बाइक टक्कर, ज़ख्म से खून आ रहा है'],
        eval: ['{place} के पास कार दुर्घटना में खून बह रहा है'],
      },
      te: {
        train: ['{place} దగ్గర స్కూటర్ యాక్సిడెంట్, తల నుండి రక్తం వస్తోంది', '{place} దగ్గర బైక్ డిక్కి, గాయం నుండి రక్తం ప్రవహిస్తోంది'],
        eval: ['{place} దగ్గర కారు ప్రమాదంలో రక్తం వస్తోంది'],
      },
      hl: {
        train: ['{place} ke paas scooter accident, sar se bleeding ho rahi hai', 'bike accident at {place}, wound se kaafi bleeding hai'],
        eval: ['car accident near {place}, blood is coming from the hand'],
      },
    },
  },
  {
    key: 'live_wire_fallen',
    expected: 'P1',
    category: 'UTILITIES',
    subcategory: 'util_power',
    group: 'g-wire',
    signals: ['life_safety', 'immediate_danger', 'public_exposure'],
    safety: ['electrical_hazard'],
    facts: { incidentType: 'electrical_hazard', wireDown: true },
    explanation: 'Live/exposed wire down on a public road; life-threatening electrical hazard.',
    langs: {
      en: {
        train: [
          'live electric wire has fallen on the road near {place}',
          'an exposed wire is lying on the road at {place}',
          'snapped electric cable is lying on the road near {place}',
          'live wire fell on the road at {place} and sparking',
        ],
        eval: ['a live wire has fallen on the road near {place}', 'a broken electric line is lying on the road near {place}'],
      },
      kn: {
        train: ['ವಿದ್ಯುತ್ ತಂತಿ ರಸ್ತೆಗೆ ಬಿದ್ದಿದೆ {place} ಬಳಿ', '{place} ಬಳಿ ರಸ್ತೆಯಲ್ಲಿ ವಿದ್ಯುತ್ ತಂತಿ ಬಿದ್ದು ಬಿಟ್ಟಿದೆ'],
        eval: ['ವಿದ್ಯುತ್ ತಂತಿ ಬಿದ್ದಿದೆ {place} ಬಳಿ ರಸ್ತೆಯಲ್ಲಿ'],
      },
      hi: {
        train: ['बिजली का तार सड़क पर गिर गया है {place} के पास', 'बिजली का तार सड़क पर गिरा हुआ है {place} के पास'],
        eval: ['बिजली का तार टूट कर सड़क पर गिर गया {place} के पास'],
      },
      te: {
        train: ['విద్యుత్ తీగ రోడ్డు మీద పడింది {place} దగ్గర', '{place} దగ్గర రోడ్డు మీద విద్యుత్ తీగ జారి పడింది'],
        eval: ['{place} దగ్గర విద్యుత్ కేబుల్ తెగి రోడ్డు మీద పడింది'],
      },
      hl: {
        train: ['{place} road par live wire gir gaya hai, bahut khatra', 'live wire near {place} road, sparking ho raha hai'],
        eval: ['road par exposed wire pada hai {place} ke paas'],
      },
    },
  },
  {
    key: 'electric_shock',
    expected: 'P1',
    category: 'UTILITIES',
    subcategory: 'util_power',
    group: 'g-wire',
    signals: ['life_safety', 'immediate_danger'],
    safety: ['electrical_hazard'],
    facts: { incidentType: 'electrical_hazard', wireDown: true },
    explanation: 'Actual electric shock; the shock itself satisfies the wire-down condition.',
    langs: {
      en: {
        train: [
          'a person got electric shock from the meter box near {place}',
          'current is leaking from the meter at {place} and someone got electric shock',
          'a man received an electric shock at the substation near {place}',
          'sparking meter board near {place}, a person got electric shock',
        ],
        eval: ['electric shock at {place}, a worker fell down', 'someone electrocuted near {place} meter'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಮೀಟರ್ ಬಳಿ ವಿದ್ಯುತ್ ಶಾಕ್ ಆಗಿದೆ', 'ವಿದ್ಯುತ್ ಶಾಕ್ ಆಗಿ {place} ಬಳಿ ಒಬ್ಬರು ಬಿದ್ದಿದ್ದಾರೆ'],
        eval: ['{place} ಬಳಿ ವಿದ್ಯುತ್ ಶಾಕ್ ಆಗಿದೆ, ಒಬ್ಬರು ಬೇಹೋಶ'],
      },
      hi: {
        train: ['{place} के पास मीटर से बिजली का झटका लगा', '{place} के पास बिजली का करेंट लग गया'],
        eval: ['{place} पर बिजली का झटका लगने से आदमी गिर गया'],
      },
      te: {
        train: ['{place} దగ్గర మీటర్ దగ్గర విద్యుత్ షాక్ వచ్చింది', '{place} దగ్గర విద్యుత్ షాక్ తగిలింది ఒకరికి'],
        eval: ['{place} దగ్గర విద్యుత్ తీగ తగిలి ఒకరు పడిపోయారు'],
      },
      hl: {
        train: ['{place} meter se electric shock laga ek aadmi ko', 'electric shock near {place}, current leaking from meter'],
        eval: ['worker ko electric shock laga {place} ke paas'],
      },
    },
  },
];
