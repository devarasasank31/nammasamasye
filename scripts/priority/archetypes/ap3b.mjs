// P3 archetypes (chunk 2/4): utilities, noise, transport, government service.

export const AP3B = [
  {
    key: 'power_outage',
    expected: 'P3',
    category: 'UTILITIES',
    subcategory: 'util_power',
    group: 'g-power',
    signals: ['public_exposure', 'persistence', 'population'],
    safety: [],
    facts: { incidentType: 'power_outage' },
    explanation: 'Electricity cut with no downed wire; scored low, routine-civic floor applies.',
    langs: {
      en: {
        train: ['there is no electricity near {place} since morning', 'power cut near {place} for the whole day', 'the electricity near {place} has been gone since 6 hours', 'no current near {place} since morning'],
        eval: ['power outage near {place} since morning', 'no electricity at {place} for 6 hours'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಬೆಳಿಗ್ಗೆಯಿಂದ ವಿದ್ಯುತ್ ಇಲ್ಲ', '{place} ಬಳಿ ಒಂದು ದಿನದಿಂದ ಕರೆಂಟ್ ಇಲ್ಲ'],
        eval: ['{place} ಬಳಿ ಆರು ಗಂಟೆಯಿಂದ ವಿದ್ಯುತ್ ಇಲ್ಲ'],
      },
      hi: {
        train: ['{place} के पास सुबह से बिजली नहीं है', '{place} के पास पूरे दिन से बिजली गई हुई है'],
        eval: ['{place} पर 6 घंटे से बिजली नहीं है'],
      },
      te: {
        train: ['{place} దగ్గర ఉదయం నుండి కరెంట్ లేదు', '{place} దగ్గర రోజంతా విద్యుత్ పోయింది'],
        eval: ['{place} దగ్గర 6 గంటలుగా విద్యుత్ లేదు'],
      },
      hl: {
        train: ['{place} ke paas subah se bijli nahi hai', 'power cut hai {place} mein, poora din'],
        eval: ['{place} par 6 ghante se light nahi hai'],
      },
    },
  },
  {
    key: 'water_supply_cut',
    expected: 'P3',
    category: 'CIVIC',
    subcategory: 'civic_water_supply',
    group: 'g-water',
    signals: ['public_exposure', 'persistence', 'population'],
    safety: [],
    facts: { incidentType: 'water_supply' },
    explanation: 'No water supply; essential but not dangerous, floor applies.',
    langs: {
      en: {
        train: ['there is no water supply near {place} since 3 days', 'the water pipe near {place} is not supplying water', 'no drinking water near {place} since two days', 'water supply near {place} has stopped'],
        eval: ['no water supply near {place} for 3 days', 'there is no water at {place} since morning'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಮೂರು ದಿನಗಳಿಂದ ಕುಡಿಯುವ ನೀರು ಇಲ್ಲ', '{place} ಬಳಿ ನೀರಿನ ಸರಬರಾಜು ಇಲ್ಲ'],
        eval: ['{place} ಬಳಿ ಎರಡು ದಿನಗಳಿಂದ ನೀರು ಬರುತ್ತಿಲ್ಲ'],
      },
      hi: {
        train: ['{place} के पास 3 दिन से पानी की सप्लाई नहीं है', '{place} के पास पानी नहीं आ रहा है'],
        eval: ['{place} पर दो दिन से पानी नहीं आया'],
      },
      te: {
        train: ['{place} దగ్గర 3 రోజులుగా నీటి సరఫరా లేదు', '{place} దగ్గర నీరు రావడం లేదు'],
        eval: ['{place} దగ్గర రెండు రోజులుగా తాగునీరు లేదు'],
      },
      hl: {
        train: ['{place} se 3 din se paani nahi aa raha', 'water supply band hai {place} mein'],
        eval: ['{place} par 2 din se paani nahi aaya'],
      },
    },
  },
  {
    key: 'noise_complaint',
    expected: 'P3',
    category: 'ENVIRONMENT',
    subcategory: 'env_noise',
    group: 'g-noise',
    signals: ['public_exposure', 'persistence'],
    safety: [],
    facts: { incidentType: 'noise' },
    explanation: 'Loud music noise complaint; routine disturbance, floor applies.',
    langs: {
      en: {
        train: ['loud music is playing near {place} since 11 pm', 'there is a loud speaker noise near {place}', 'the loud music from the function near {place} is disturbing', 'noise pollution near {place} since last night'],
        eval: ['loud music near {place} is still on at 1 am', 'loud speaker noise from near {place} is disturbing'],
      },
      kn: {
        train: ['{place} ಬಳಿ ರಾತ್ರಿ ಜೋರಾಗಿ ಸಂಗೀತ ಹಾಕುತ್ತಿದ್ದಾರೆ', '{place} ಬಳಿ ದೊಡ್ಡ ಶಬ್ದ ಬರುತ್ತಿದೆ'],
        eval: ['{place} ಬಳಿ ಮಧ್ಯರಾತ್ರಿ ಜೋರಾದ ಶಬ್ದ'],
      },
      hi: {
        train: ['{place} के पास रात 11 बजे से ज़ोर से संगीत चल रहा है', '{place} के पास लाउडस्पीकर की आवाज़ आ रही है'],
        eval: ['{place} पर रात एक बजे भी ज़ोर से संगीत चल रहा है'],
      },
      te: {
        train: ['{place} దగ్గర రాత్రి పదకొండు గంటలకు పెద్ద శబ్దం', '{place} దగ్గర లౌడ్ స్పీకర్ శబ్దం వస్తోంది'],
        eval: ['{place} దగ్గర అర్థరాత్రి కూడా పెద్ద శబ్దం'],
      },
      hl: {
        train: ['{place} ke paas raat 11 baje se loud music chal raha hai', 'loudspeaker noise aa rahi hai {place} se'],
        eval: ['{place} par raat 1 baje tak music chal raha hai'],
      },
    },
  },
  {
    key: 'bus_not_come',
    expected: 'P3',
    category: 'TRANSPORT',
    subcategory: 'bmtc_service',
    group: 'g-transport',
    signals: ['public_exposure', 'population', 'persistence'],
    safety: [],
    facts: { incidentType: 'transport' },
    explanation: 'Bus not arriving; service issue, no danger.',
    langs: {
      en: {
        train: ['the bus is not coming near {place} for 40 minutes', 'no bus from {place} since 40 minutes', 'buses are not stopping at {place} today', 'the bus near {place} did not come for an hour'],
        eval: ['bus has not come to {place} for 40 minutes', 'no bus service near {place} for an hour'],
      },
      kn: {
        train: ['{place} ಬಳಿ ನಲವತ್ತು ನಿಮಿಷದಿಂದ ಬಸ್ ಬರುತ್ತಿಲ್ಲ', '{place} ಬಳಿ ಬಸ್ ಬರುತ್ತಿಲ್ಲ ಒಂದು ಗಂಟೆಯಿಂದ'],
        eval: ['{place} ಬಳಿ ಒಂದು ಗಂಟೆಯಿಂದ ಬಸ್ ಇಲ್ಲ'],
      },
      hi: {
        train: ['{place} के पास 40 मिनट से बस नहीं आ रही', '{place} से एक घंटे से बस नहीं आई'],
        eval: ['{place} पर बस काफी देर से नहीं आ रही'],
      },
      te: {
        train: ['{place} దగ్గర 40 నిమిషాలుగా బస్సు రావడం లేదు', '{place} దగ్గర గంట క్రితం నుండి బస్సు లేదు'],
        eval: ['{place} దగ్గర బస్సు రాలేదు, 40 నిమిషాలు'],
      },
      hl: {
        train: ['{place} se 40 minute se bus nahi aa rahi', 'bus near {place} nahi aa rahi, 1 hour ho gaya'],
        eval: ['{place} par bus ka intezaar hai, kaafi der ho gayi'],
      },
    },
  },
  {
    key: 'govt_file_pending',
    expected: 'P3',
    category: 'GOVERNMENT',
    subcategory: 'govt_service',
    group: 'g-service',
    signals: ['persistence'],
    safety: [],
    facts: { incidentType: 'service_delay' },
    explanation: 'Application pending beyond deadline; administrative, not an emergency.',
    langs: {
      en: {
        train: ['my application at the office near {place} is pending for 20 days', 'the certificate from the office near {place} has not been issued', 'file is pending at the office near {place} beyond the deadline', 'no response from the office near {place} for 20 days'],
        eval: ['my application at {place} office is pending beyond 15 days', 'the document from the office near {place} is still not ready'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಕಚೇರಿಯಲ್ಲಿ ಅರ್ಜಿ ಇಪ್ಪತ್ತು ದಿನದಿಂದ ಬಾಕಿ ಇದೆ', '{place} ಬಳಿ ಕಚೇರಿಯಿಂದ ಪ್ರಮಾಣಪತ್ರ ಬಂದಿಲ್ಲ'],
        eval: ['{place} ಬಳಿ ಅರ್ಜಿ ಹದಿನೈದು ದಿನ ಆದರೂ ಮುಂದುವರಿದಿಲ್ಲ'],
      },
      hi: {
        train: ['{place} के दफ़्तर में आवेदन 20 दिन से लंबित है', '{place} के दफ़्तर से सर्टिफिकेट नहीं मिला'],
        eval: ['{place} दफ़्तर में आवेदन 15 दिन से पेंडिंग है'],
      },
      te: {
        train: ['{place} దగ్గర ఆఫీసులో దరఖాస్తు 20 రోజులుగా పెండింగ్', '{place} దగ్గర ఆఫీసు నుండి సర్టిఫికెట్ రాలేదు'],
        eval: ['{place} దగ్గర దరఖాస్తు 15 రోజులుగా పెండింగ్'],
      },
      hl: {
        train: ['{place} office mein application 20 din se pending hai', 'certificate nahi mil raha {place} office se'],
        eval: ['{place} office ka kaam 15 din se atka hua hai'],
      },
    },
  },
];
