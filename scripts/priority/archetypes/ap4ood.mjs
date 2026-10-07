// P4 (informational, capped at 34) + OOD archetypes (zero recognisable
// concepts → outOfDistribution, needsClarification, human review).

export const AP4OOD = [
  {
    key: 'suggestion',
    expected: 'P4',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-info',
    signals: [],
    safety: [],
    facts: { incidentType: 'other_civic' },
    explanation: 'A suggestion is informational only — capped inside P4.',
    langs: {
      en: {
        train: ['i have a suggestion about the park timing near {place}', 'a suggestion for improving the junction near {place}'],
        eval: ['suggestion about the lane near {place}'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಬೀದಿ ಸುಧಾರಣೆಗೆ ಸಲಹೆ ಇದೆ', '{place} ಬಳಿ ಪಾರ್ಕ್ ಸಮಯಕ್ಕೆ ಸಲಹೆ'],
        eval: ['{place} ಬಳಿ ಸ್ವಚ್ಛತೆಗೆ ಒಂದು ಸಲಹೆ'],
      },
      hi: {
        train: ['{place} के पास सफ़ाई के लिए एक सुझाव है', '{place} पार्क के समय के लिए सुझाव'],
        eval: ['{place} के पास एक सुझाव है सड़क के लिए'],
      },
      te: {
        train: ['{place} దగ్గర శుభ్రతకు ఒక సలహా ఉంది', '{place} పార్కు సమయం కోసం సూచన'],
        eval: ['{place} దగ్గర రోడ్డుకు సలహా ఇస్తున్నాను'],
      },
      hl: {
        train: ['{place} ke liye ek suggestion hai park timing ko lekar', 'suggestion hai regarding the lane near {place}'],
        eval: ['{place} ke paas ek suggestion hai'],
      },
    },
  },
  {
    key: 'thanks_fixed',
    expected: 'P4',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-info',
    signals: [],
    safety: [],
    facts: { incidentType: 'other_civic' },
    explanation: 'A thank-you message is informational — capped inside P4.',
    langs: {
      en: {
        train: ['thank you for fixing the street light near {place}', 'thanks for the cleanup near {place}'],
        eval: ['thank you, the light near {place} is working now'],
      },
      kn: {
        train: ['{place} ಬಳಿ ದೀಪ ಸರಿ ಮಾಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ', '{place} ಬಳಿ ಕಸ ತೆಗೆದಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ'],
        eval: ['{place} ಬಳಿ ಕೆಲಸ ಮಾಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ'],
      },
      hi: {
        train: ['{place} के पास लाइट ठीक करने के लिए धन्यवाद', '{place} पर सफ़ाई के लिए धन्यवाद'],
        eval: ['{place} के पास काम के लिए धन्यवाद'],
      },
      te: {
        train: ['{place} దగ్గర లైట్ సరిచేసినందుకు ధన్యవాదాలు', '{place} దగ్గర శుభ్రతకు ధన్యవాదాలు'],
        eval: ['{place} దగ్గర పని చేసినందుకు ధన్యవాదాలు'],
      },
      hl: {
        train: ['{place} light fix karne ke liye thanks', 'thanks for the cleaning near {place}'],
        eval: ['{place} ke kaam ke liye dhanyavaad'],
      },
    },
  },
  {
    key: 'request_info',
    expected: 'P4',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-info',
    signals: [],
    safety: [],
    facts: { incidentType: 'other_civic' },
    explanation: 'A pure information query — capped inside P4.',
    langs: {
      en: {
        train: ['just asking what the timings are near {place}', 'request for information about the counter near {place}'],
        eval: ['just asking about the office hours near {place}'],
      },
      kn: {
        train: ['{place} ಬಗ್ಗೆ ಯಾವುದೇ ಸಲಹೆ ಇದೆಯಾ ಎಂದು ಕೇಳುತ್ತಿದ್ದೇನೆ'],
        eval: ['{place} ಬಗ್ಗೆ ಸಲಹೆ ಬೇಕಿತ್ತು'],
      },
      hi: {
        train: ['{place} के बारे में जानकारी चाहिए', '{place} के समय के लिए जानकारी चाहिए'],
        eval: ['{place} के बारे में बस जानकारी चाहिए'],
      },
      te: {
        train: ['{place} గురించి సమాచారం కావాలని అడుగుతున్నాను'],
        eval: ['{place} సమయాల గురించి సమాచారం కావాలి'],
      },
      hl: {
        train: ['just asking, {place} ke timings kya hain', 'just asking for information about {place} counter'],
        eval: ['just asking, {place} ke office hours kya hain'],
      },
    },
  },
  {
    key: 'well_done',
    expected: 'P4',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-info',
    signals: [],
    safety: [],
    facts: { incidentType: 'other_civic' },
    explanation: 'An appreciation message is informational — capped inside P4.',
    langs: {
      en: {
        train: ['good job on the road work near {place}', 'well done by the team near {place}'],
        eval: ['good job near {place}, keep it up'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಮಾಡಿದ ಕೆಲಸಕ್ಕೆ ಧನ್ಯವಾದ', '{place} ಬಳಿ ಸ್ವಚ್ಛತೆ ಮಾಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ'],
        eval: ['{place} ಬಳಿ ಚೆನ್ನಾಗಿ ಮಾಡಿದ್ದೀರಿ ಧನ್ಯವಾದ'],
      },
      hi: {
        train: ['{place} के पास काम के लिए बहुत बढ़िया, धन्यवाद', '{place} पर सफ़ाई के लिए बहुत अच्छा काम धन्यवाद'],
        eval: ['{place} के पास शानदार काम, धन्यवाद'],
      },
      te: {
        train: ['{place} దగ్గర చేసిన పనికి బాగుంది, ధన్యవాదాలు', '{place} దగ్గర శుభ్రత బాగా చేశారు ధన్యవాదాలు'],
        eval: ['{place} దగ్గర మంచి పని, ధన్యవాదాలు'],
      },
      hl: {
        train: ['{place} ke paas kaam bahut accha hai, well done team', 'good job near {place}'],
        eval: ['{place} ke paas shaandaar kaam, thanks'],
      },
    },
  },
  {
    key: 'ood_lost_item',
    expected: 'OOD',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-ood',
    signals: [],
    safety: [],
    facts: { incidentType: 'unknown' },
    explanation: 'No recognisable incident pattern → out of distribution, human review.',
    tags: ['ood'],
    langs: {
      en: {
        train: ['i lost my wallet near {place} yesterday'],
        eval: ['i think i left my bag at {place} last night'],
      },
      kn: {
        train: ['{place} ಬಳಿ ನನ್ನ ಹಣ ತಪ್ಪಿಹೋಗಿದೆ'],
        eval: ['{place} ಬಳಿ ನನ್ನ ಬ್ಯಾಗ್ ತಪ್ಪಿಹೋಗಿದೆ ನಿನ್ನೆ'],
      },
      hi: {
        train: ['{place} के पास मेरा पर्स छूट गया कल'],
        eval: ['{place} के पास मेरा बैग रह गया कल रात'],
      },
      te: {
        train: ['{place} దగ్గర నా పర్స్ మర్చిపోయాను'],
        eval: ['{place} దగ్గర నా బ్యాగ్ వదిలేశాను నిన్న'],
      },
      hl: {
        train: ['{place} ke paas mera purse reh gaya kal'],
        eval: ['{place} ke paas mera bag chhoot gaya raat ko'],
      },
    },
  },
  {
    key: 'ood_office_timings',
    expected: 'OOD',
    category: 'GOVERNMENT',
    subcategory: 'govt_service',
    group: 'g-ood',
    signals: [],
    safety: [],
    facts: { incidentType: 'unknown' },
    explanation: 'A timing question with no problem statement → out of distribution.',
    tags: ['ood'],
    langs: {
      en: {
        train: ['what are the office timings near {place}'],
        eval: ['when does the counter at {place} open'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಕಚೇರಿ ಸಮಯ ಏನು'],
        eval: ['{place} ಬಳಿ ಕಚೇರಿ ಯಾವಾಗ ತೆರೆಯುತ್ತದೆ'],
      },
      hi: {
        train: ['{place} के पास दफ़्तर का समय क्या है'],
        eval: ['{place} पर काउंटर कब खुलता है'],
      },
      te: {
        train: ['{place} దగ్గర ఆఫీసు సమయం ఏమిటి'],
        eval: ['{place} దగ్గర కౌంటర్ ఎప్పుడు తెరుస్తారు'],
      },
      hl: {
        train: ['{place} office ka time kya hai'],
        eval: ['{place} counter kab khulta hai'],
      },
    },
  },
  {
    key: 'ood_park_programme',
    expected: 'OOD',
    category: 'CIVIC',
    subcategory: 'civic_parks',
    group: 'g-ood',
    signals: [],
    safety: [],
    facts: { incidentType: 'unknown' },
    explanation: 'Event query about a park, not a defect → out of distribution.',
    tags: ['ood'],
    langs: {
      en: {
        train: ['is there a programme in the park near {place} this weekend'],
        eval: ['any event happening at the park near {place}'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಪಾರ್ಕ್‌ನಲ್ಲಿ ಈ ವಾರ ಯಾವುದಾದರೂ ಕಾರ್ಯಕ್ರಮ ಇದೆಯಾ'],
        eval: ['{place} ಬಳಿ ಪಾರ್ಕ್‌ನಲ್ಲಿ ಏನಾದರೂ ಇದೆಯಾ'],
      },
      hi: {
        train: ['{place} के पास पार्क में इस हफ़्ते कोई कार्यक्रम है क्या'],
        eval: ['{place} के पास पार्क में कुछ हो रहा है क्या'],
      },
      te: {
        train: ['{place} దగ్గర పార్కులో ఈ వారం ఏదైనా కార్యక్రమం ఉందా'],
        eval: ['{place} దగ్గర పార్కులో ఏమైనా ఉందా'],
      },
      hl: {
        train: ['{place} park mein is week kuch programme hai kya'],
        eval: ['{place} park mein kuch ho raha hai kya'],
      },
    },
  },
  {
    key: 'ood_birth_record',
    expected: 'OOD',
    category: 'OTHER',
    subcategory: 'custom_issue',
    group: 'g-ood',
    signals: [],
    safety: [],
    facts: { incidentType: 'unknown' },
    explanation: 'A records query with no hazard or defect → out of distribution.',
    tags: ['ood'],
    langs: {
      en: {
        train: ['where do i get the birth record near {place}'],
        eval: ['how to get a copy of the birth record from {place}'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಜನನ ಪ್ರಮಾಣಪತ್ರ ಎಲ್ಲಿ ಸಿಗುತ್ತದೆ'],
        eval: ['{place} ಬಳಿ ಜನನ ದಾಖಲೆ ಹೇಗೆ ಪಡೆಯಬೇಕು'],
      },
      hi: {
        train: ['{place} के पास जन्म प्रमाणपत्र कहाँ मिलेगा'],
        eval: ['{place} से जन्म प्रमाणपत्र कैसे लें'],
      },
      te: {
        train: ['{place} దగ్గర జనన ధృవీకరణ పత్రం ఎక్కడ వస్తుంది'],
        eval: ['{place} నుండి జనన రికార్డు ఎలా తీసుకోవాలి'],
      },
      hl: {
        train: ['{place} ke paas birth record kahan milega'],
        eval: ['{place} se birth record kaise lein'],
      },
    },
  },
];
