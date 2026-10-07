// P1 archetypes (chunk 2/3): fire, collapse, trapped, open manhole.

export const AP1B = [
  {
    key: 'fire_shop',
    expected: 'P1',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-fire',
    signals: ['life_safety', 'immediate_danger', 'public_exposure'],
    safety: ['fire_explosion'],
    facts: { incidentType: 'fire_explosion' },
    explanation: 'Active fire in a public place; no AI step is needed to call this P1.',
    langs: {
      en: {
        train: ['a shop is on fire near {place}', 'fire broke out in the building at {place}', 'the house near {place} is burning with flames', 'a vehicle is on fire near {place}'],
        eval: ['flames are coming from the shop near {place}', 'there is a blaze at {place} near the market'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಅಂಗಡಿಗೆ ಬೆಂಕಿ ಹತ್ತಿದೆ', '{place} ಬಳಿ ಮನೆಗೆ ಬೆಂಕಿ ಹತ್ತಿದೆ'],
        eval: ['{place} ಬಳಿ ಅಂಗಡಿಯಲ್ಲಿ ಬೆಂಕಿ ಹತ್ತಿ ಉರಿಯುತ್ತಿದೆ'],
      },
      hi: {
        train: ['{place} के पास दुकान में आग लग गई है', '{place} के पास मकान में आग लगी है'],
        eval: ['{place} के पास आग लगने से धुआं उठ रहा है'],
      },
      te: {
        train: ['{place} దగ్గర దుకాణంలో అగ్ని పెట్టింది', '{place} దగ్గర ఇంటికి మంటలు వచ్చాయి'],
        eval: ['{place} దగ్గర అగ్ని మంటలు కనిపిస్తున్నాయి'],
      },
      hl: {
        train: ['{place} ke paas dukan mein aag lag gayi', 'fire broke out near {place} building'],
        eval: ['shop mein aag lag gayi {place} ke paas'],
      },
    },
  },
  {
    key: 'cylinder_blast',
    expected: 'P1',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-fire',
    signals: ['life_safety', 'immediate_danger', 'public_exposure'],
    safety: ['fire_explosion'],
    facts: { incidentType: 'fire_explosion' },
    explanation: 'Cylinder blast or explosion is handled as an active fire event.',
    langs: {
      en: {
        train: ['gas cylinder blast at a house near {place}', 'a cooking cylinder exploded in the kitchen at {place}', 'cylinder blast near {place}, flames everywhere', 'LPG cylinder exploded near {place} shop'],
        eval: ['there was a cylinder blast at {place} last night', 'an explosion happened near {place} from a gas cylinder'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಮನೆಯಲ್ಲಿ ಸಿಲಿಂಡರ್ ಸ್ಫೋಟ', '{place} ಬಳಿ ಅಡುಗೆ ಸಿಲಿಂಡರ್ ಸ್ಫೋಟ ಆಗಿದೆ'],
        eval: ['{place} ಬಳಿ ಗ್ಯಾಸ್ ಸಿಲಿಂಡರ್ ಸ್ಫೋಟ ಆಗಿದೆ'],
      },
      hi: {
        train: ['{place} के पास घर में सिलेंडर विस्फोट हो गया', '{place} पर सिलेंडर विस्फोट हुआ'],
        eval: ['{place} के पास रसोई सिलेंडर में विस्फोट हुआ'],
      },
      te: {
        train: ['{place} దగ్గర ఇంట్లో సిలిండర్ పేలుడు', '{place} దగ్గర సిలిండర్ పేలుడు జరిగింది'],
        eval: ['{place} దగ్గర గ్యాస్ సిలిండర్ పేలుడు'],
      },
      hl: {
        train: ['{place} ke paas gas cylinder blast ho gaya', 'cylinder exploded near {place} house'],
        eval: ['kitchen mein cylinder blast near {place}'],
      },
    },
  },
  {
    key: 'building_collapse',
    expected: 'P1',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-collapse',
    signals: ['life_safety', 'immediate_danger', 'public_exposure'],
    safety: ['structural_collapse'],
    facts: { incidentType: 'structural_collapse' },
    explanation: 'Structural collapse including about-to-fall; uncertainty escalates.',
    langs: {
      en: {
        train: ['the building near {place} has collapsed', 'a wall of the house at {place} is collapsing', 'the roof of the shop near {place} caved in', 'an old building near {place} is about to fall'],
        eval: ['a portion of the building at {place} has collapsed', 'the shed near {place} has caved in'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಕಟ್ಟಡ ಕುಸಿದಿದೆ', '{place} ಬಳಿ ಗೋಡೆ ಬಿದ್ದಿದೆ'],
        eval: ['{place} ಬಳಿ ಹಳೆ ಕಟ್ಟಡ ಕುಸಿದಿದೆ'],
      },
      hi: {
        train: ['{place} के पास भवन गिर गया है', '{place} के पास दीवार गिर गई'],
        eval: ['{place} पर पुराना मकान गिरने वाला है'],
      },
      te: {
        train: ['{place} దగ్గర భవనం కుప్పకూలింది', '{place} దగ్గర గోడ పడిపోయింది'],
        eval: ['{place} దగ్గర పాత భవనం కూలిపోయింది'],
      },
      hl: {
        train: ['{place} building collapse ho gayi', '{place} building par wall collapse ho gaya'],
        eval: ['old building near {place} has collapsed'],
      },
    },
  },
  {
    key: 'people_trapped_lift',
    expected: 'P1',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-collapse',
    signals: ['life_safety', 'immediate_danger'],
    safety: ['person_trapped'],
    facts: { incidentType: 'trapped_rescue' },
    explanation: 'Person trapped, rescue needed; may-be-trapped also escalates.',
    langs: {
      en: {
        train: ['two people are trapped inside the lift near {place}', 'a worker is stuck under the debris near {place}', 'people may be trapped in the collapsed building at {place}', 'a child is trapped in the well near {place}'],
        eval: ['three persons are trapped inside the lift at {place}', 'someone is trapped under the fallen wall near {place}'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಲಿಫ್ಟ್ ಒಳಗೆ ಇಬ್ಬರು ಸಿಕ್ಕಿ ಹಾಕಿಕೊಂಡಿದ್ದಾರೆ', '{place} ಬಳಿ ಮಲಬೆ ಒಳಗೆ ಒಬ್ಬರು ಸಿಕ್ಕಿ ಹಾಕಿಕೊಂಡಿದ್ದಾರೆ'],
        eval: ['{place} ಬಳಿ ಬಾವಿಯಲ್ಲಿ ಮಗು ಸಿಕ್ಕಿ ಹಾಕಿಕೊಂಡಿದೆ'],
      },
      hi: {
        train: ['{place} के पास लिफ्ट के अंदर दो लोग फंसे हैं', '{place} के पास मलबे में एक मजदूर फंसा है'],
        eval: ['{place} पर कुएं में एक बच्चा फंस गया'],
      },
      te: {
        train: ['{place} దగ్గర లిఫ్ట్ లోపల ఇద్దరు చిక్కుకున్నారు', '{place} దగ్గర శిథిలాల్లో ఒక కార్మికుడు చిక్కుకుపోయాడు'],
        eval: ['{place} దగ్గర బావిలో పిల్లాడు చిక్కుకున్నాడు'],
      },
      hl: {
        train: ['{place} lift ke andar do log trapped hain', 'stuck inside the lift near {place}'],
        eval: ['two people trapped in the well at {place}'],
      },
    },
  },
  {
    key: 'open_manhole',
    expected: 'P1',
    category: 'CIVIC',
    subcategory: 'civic_drainage',
    group: 'g-manhole',
    signals: ['life_safety', 'immediate_danger', 'public_exposure'],
    safety: ['open_manhole'],
    facts: { incidentType: 'sewage_contamination', openManhole: true },
    explanation: 'Open or missing manhole cover is a fall hazard; sewage overflow alone is only scored.',
    langs: {
      en: {
        train: ['open manhole on the road near {place}, cover is missing', 'the manhole cover is missing near {place} footpath', 'manhole is open near {place}, someone may fall', 'missing manhole cover at {place} road'],
        eval: ['the cover of the manhole is gone at {place} road', 'an open manhole near {place} is dangerous for children'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಗಟರ್ ಮುಚ್ಚಳ ಇಲ್ಲ, ರಸ್ತೆಯಲ್ಲಿ ತೆರೆದಿದೆ', '{place} ಬಳಿ ಗಟರ್ ಕವರ್ ಕಾಣಿಸುತ್ತಿಲ್ಲ'],
        eval: ['{place} ಬಳಿ ಗಟರ್ ಮುಚ್ಚಳ ತೆರೆದಿದೆ'],
      },
      hi: {
        train: ['{place} के पास मैनहोल खुला है, कवर गायब है', '{place} पर गटर का कवर नहीं है'],
        eval: ['{place} के पास मैनहोल खुला है'],
      },
      te: {
        train: ['{place} దగ్గర గటర్ కవర్ లేదు', '{place} దగ్గర గటర్ మూత లేదు'],
        eval: ['{place} దగ్గర రోడ్డు మీద గటర్ కవర్ లేదు'],
      },
      hl: {
        train: ['open manhole near {place} road, cover gayab hai', 'open manhole near {place}, koi gir sakta hai'],
        eval: ['manhole cover missing at {place} road'],
      },
    },
  },
];
