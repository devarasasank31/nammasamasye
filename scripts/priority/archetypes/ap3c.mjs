// P3 archetypes (chunk 3/4): corruption, harassment, cyber, minor crash, dog.

export const AP3C = [
  {
    key: 'bribe_demand',
    expected: 'P3',
    category: 'CORRUPTION',
    subcategory: 'bribes',
    group: 'g-corruption',
    signals: ['persistence'],
    safety: [],
    facts: { incidentType: 'corruption' },
    explanation: 'Bribe demanded at an office; corruption is scored, never a safety band.',
    langs: {
      en: {
        train: ['an official asked for a bribe near {place} office', 'the staff demanded extra money for my application at {place}', 'they are demanding a bribe at the office near {place}', 'bribe was demanded for the certificate at {place}'],
        eval: ['an officer asked for bribe at {place} office', 'extra money was demanded at the counter near {place}'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಕಚೇರಿಯಲ್ಲಿ ಲಂಚ ಕೇಳುತ್ತಿದ್ದಾರೆ', '{place} ಬಳಿ ಅಧಿಕಾರಿ ಹಣ ಕೇಳುತ್ತಿದ್ದಾರೆ'],
        eval: ['{place} ಬಳಿ ಪ್ರಮಾಣಪತ್ರಕ್ಕೆ ಲಂಚ ಕೇಳಿದ್ದಾರೆ'],
      },
      hi: {
        train: ['{place} के दफ़्तर में रिश्वत माँगी जा रही है', '{place} पर अधिकारी घूस माँग रहा है'],
        eval: ['{place} के पास सर्टिफिकेट के लिए रिश्वत माँगी जा रही है'],
      },
      te: {
        train: ['{place} దగ్గర ఆఫీసులో లంచం అడుగుతున్నారు', '{place} దగ్గర అధికారి డబ్బులు అడుగుతున్నాడు'],
        eval: ['{place} దగ్గర సర్టిఫికెట్ కోసం లంచం అడుగుతున్నారు'],
      },
      hl: {
        train: ['{place} office mein bribe maang raha hai staff', 'certificate ke liye bribe maang rahe hain near {place}'],
        eval: ['{place} counter par extra money demand kar rahe hain'],
      },
    },
  },
  {
    key: 'stalking_daily',
    expected: 'P3',
    category: 'PUBLIC_SAFETY',
    subcategory: 'safety_harassment',
    group: 'g-harassment',
    signals: ['life_safety', 'persistence'],
    safety: [],
    facts: { incidentType: 'harassment_stalking' },
    explanation: 'Persistent stalking without weapon or life threat; harassment score, not P1.',
    langs: {
      en: {
        train: ['a man is stalking me near {place} every day', 'someone is following me near {place} daily', 'eve teasing near {place} every evening', 'he keeps following me near {place} since a week'],
        eval: ['a person is stalking me near {place} daily', 'someone follows me near {place} every day'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಪ್ರತಿದಿನ ಒಬ್ಬ ವ್ಯಕ್ತಿ ಹಿಂಬಾಲಿಸುತ್ತಿದ್ದಾನೆ', '{place} ಬಳಿ ಕಿರುಕುಳ ನೀಡುತ್ತಿದ್ದಾರೆ'],
        eval: ['{place} ಬಳಿ ದಿನಂಪ್ರತಿ ಹಿಂಬಾಲಿಸುತ್ತಿದ್ದಾರೆ'],
      },
      hi: {
        train: ['{place} के पास कोई रोज़ मेरा पीछा करता है', '{place} पर रोज़ परेशान किया जा रहा है'],
        eval: ['{place} के पास रोज़ कोई मेरा पीछा करता है'],
      },
      te: {
        train: ['{place} దగ్గర ప్రతిరోజూ ఒకరు వెంటపడుతున్నారు', '{place} దగ్గర రోజూ వేధిస్తున్నారు'],
        eval: ['{place} దగ్గర ఎవరో వెంటపడుతున్నారు రోజూ'],
      },
      hl: {
        train: ['{place} ke paas roz koi mera peecha karta hai', 'roz harassment ho rahi hai near {place}'],
        eval: ['koi roz following karta hai near {place}'],
      },
    },
  },
  {
    key: 'cyber_otp_fraud',
    expected: 'P3',
    category: 'DIGITAL',
    subcategory: 'cybercrime',
    group: 'g-cyber',
    signals: ['persistence'],
    safety: [],
    facts: { incidentType: 'cybercrime' },
    explanation: 'OTP fraud reported; digital crime, no physical danger.',
    langs: {
      en: {
        train: ['someone did OTP fraud near {place} and took money', 'a phishing call cheated me near {place}', 'my account was hacked near {place}, money gone', 'online fraud near {place}, the OTP was shared'],
        eval: ['OTP scam near {place}, money cheated', 'a fraud call near {place} took the OTP'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಒಟಿಪಿ ವಂಚನೆ ಆಗಿದೆ', '{place} ಬಳಿ ಸೈಬರ್ ವಂಚನೆಯಿಂದ ಹಣ ಕಳೆದು ಹೋಗಿದೆ'],
        eval: ['{place} ಬಳಿ ಒಟಿಪಿ ಮೋಸದಿಂದ ಹಣ ಪೋತು ಹೋಗಿದೆ'],
      },
      hi: {
        train: ['{place} के पास ओटीपी फ्रॉड हुआ, पैसे चले गए', '{place} पर साइबर धोखाधड़ी से पैसे निकल गए'],
        eval: ['{place} के पास फ्रॉड कॉल से ओटीपी शेयर हो गया'],
      },
      te: {
        train: ['{place} దగ్గర ఒటిపి మోసం జరిగింది', '{place} దగ్గర సైబర్ మోసంతో డబ్బులు పోయాయి'],
        eval: ['{place} దగ్గర ఫ్రాడ్ కాల్‌తో ఒటిపి ఇచ్చేశాను'],
      },
      hl: {
        train: ['{place} ke paas OTP fraud ho gaya, paise chale gaye', 'phishing call se fraud near {place}'],
        eval: ['{place} par fraud call aaya aur OTP share ho gaya'],
      },
    },
  },
  {
    key: 'minor_crash_no_injury',
    expected: 'P3',
    category: 'TRAFFIC',
    subcategory: 'traffic_accident',
    group: 'g-accident',
    signals: ['public_exposure'],
    safety: [],
    facts: { incidentType: 'vehicle_collision' },
    explanation: 'Brushing crash with no injuries; scored below the band, routine floor keeps P3.',
    langs: {
      en: {
        train: ['a minor crash near {place}, both vehicles are damaged and nobody was hurt', 'two bikes brushed near {place}, no injuries and both left', 'small collision near {place}, nobody was injured', 'the vehicles touched near {place} and nobody was hurt'],
        eval: ['a minor collision at {place} with no injuries', 'two autos brushed near {place}, nobody was hurt'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಸಣ್ಣ ಅಪಘಾತ, ಯಾರಿಗೂ ಗಾಯ ಆಗಿಲ್ಲ', '{place} ಬಳಿ ಎರಡು ವಾಹನ ತಾಕಿದೆ, ಗಾಯ ಇಲ್ಲ'],
        eval: ['{place} ಬಳಿ ಅಪಘಾತ ಆಗಿಲ್ಲ, ವಾಹನಗಳು ಮಾತ್ರ ಹಾಳಾಗಿವೆ'],
      },
      hi: {
        train: ['{place} के पास छोटी टक्कर हुई, कोई घायल नहीं', '{place} पर दो बाइक टकराईं, किसी को चोट नहीं लगी'],
        eval: ['{place} के पास टक्कर हुई पर कोई घायल नहीं है'],
      },
      te: {
        train: ['{place} దగ్గర చిన్న ప్రమాదం, ఎవరికీ గాయం కాలేదు', '{place} దగ్గర రెండు వాహనాలు ఢీకొన్నాయి, గాయాలు లేవు'],
        eval: ['{place} దగ్గర ప్రమాదం జరిగింది కానీ ఎవరికీ గాయం కాలేదు'],
      },
      hl: {
        train: ['{place} ke paas halki si scratch hui, koi hurt nahi hua', 'do bike takra gayi near {place}, koi injured nahi'],
        eval: ['{place} ke paas choti si collision hui, nobody was hurt'],
      },
    },
  },
  {
    key: 'stray_dog_bitten_minor',
    expected: 'P3',
    category: 'CIVIC',
    subcategory: 'civic_stray_animals',
    group: 'g-dog',
    signals: ['life_safety'],
    safety: [],
    facts: { incidentType: 'animal_attack' },
    explanation: 'Dog bite with no bleeding or severe injury; scored, stays at P3.',
    langs: {
      en: {
        train: ['a stray dog bit my child near {place} but there is no bleeding', 'the dog bit my hand near {place}, nobody was badly hurt', 'a street dog bit near {place}, no blood came', 'the dog near {place} bit my leg, it is not serious'],
        eval: ['a stray dog bit my son near {place} with no bleeding', 'the dog near {place} bit but nobody was badly hurt'],
      },
      kn: {
        train: ['{place} ಬಳಿ ಒಂಟಿ ನಾಯಿ ಮಗನಿಗೆ ಕಡಿದೆ, ರಕ್ತ ಇಲ್ಲ', '{place} ಬಳಿ ನಾಯಿ ಕಡಿದೆ, ಗಂಭೀರವಾಗಿಲ್ಲ'],
        eval: ['{place} ಬಳಿ ನಾಯಿ ಕಡಿದೆ ಆದರೆ ರಕ್ತ ಇಲ್ಲ'],
      },
      hi: {
        train: ['{place} के पास आवारा कुत्ते ने बच्चे को काटा, खून नहीं निकला', '{place} पर कुत्ते ने हाथ काटा, कोई गंभीर चोट नहीं'],
        eval: ['{place} के पास कुत्ते ने काटा, कोई ज़ख्म नहीं है'],
      },
      te: {
        train: ['{place} దగ్గర వీధి కుక్క పిల్లాడిని కాటు వేసింది, రక్తం లేదు', '{place} దగ్గర కుక్క కాటు వేసింది, తీవ్రంగా లేదు'],
        eval: ['{place} దగ్గర కుక్క కాటు వేసింది కానీ రక్తం లేదు'],
      },
      hl: {
        train: ['{place} ke paas stray dog ne bachche ko kaata, bleeding nahi ho rahi', 'dog ne haath kaata near {place}, koi serious wound nahi'],
        eval: ['{place} ke paas dog ne kaata, koi bleeding nahi hai'],
      },
    },
  },
];
