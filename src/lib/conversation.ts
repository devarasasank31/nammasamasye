// Lightweight conversational intents handled locally so the bot replies
// instantly and naturally instead of firing every message at the classifier.

export type ChatIntent =
  | 'greeting'
  | 'thanks'
  | 'help'
  | 'yes'
  | 'no'
  | 'bye'
  | 'report'
  | 'track';

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

export function detectIntent(text: string): ChatIntent | null {
  const s = norm(text);
  if (!s) return null;

  // Single-token matches must be exact, otherwise "traffic" matches "hi".
  const exact = (list: string[]) => list.includes(s);
  const phrase = (list: string[]) => list.some(p => s.includes(p));

  const GREETING_EXACT = [
    'hi', 'hii', 'hello', 'hey', 'hola', 'hy', 'hai', 'sup',
    'namaskara', 'namaskar', 'namaskaram', 'namaste', 'namskara',
  ];
  const GREETING_PHRASE = [
    'good morning', 'good evening', 'good afternoon', 'good night',
    'how are you', 'how r u', 'how are you doing', 'whats up', 'what is up',
    'ellinda', 'hege ide', 'hegiddare',
  ];

  const THANKS_EXACT = ['thanks', 'thx', 'thanku', 'dhanyavad', 'shukriya', 'nandri', 'thanksu'];
  const THANKS_PHRASE = ['thank you', 'thank u', 'thanks a lot', 'dhanyavadagalu', 'dhanyavadha', 'thankyou'];

  const HELP_PHRASE = [
    'what can you do', 'what can you help', 'how does this work', 'how to use',
    'instructions', 'how it works', 'enu madutte',
  ];

  const YES = ['yes', 'yeah', 'yep', 'yup', 'ok', 'okay', 'sure', 'fine', 'haan', 'ha'];
  const NO = ['no', 'nope', 'nah', 'noo', 'illa'];

  const BYE_EXACT = ['bye', 'goodbye', 'tata'];
  const BYE_PHRASE = ['see you', 'see u', 'bye bye'];

  const REPORT_PHRASE = ['file a complaint', 'raise issue', 'start report', 'file report', 'report an issue'];
  const TRACK_PHRASE = ['check status', 'my reports', 'where is my report', 'status of my', 'track my'];

  if (exact(BYE_EXACT) || phrase(BYE_PHRASE)) return 'bye';
  if (exact(THANKS_EXACT) || phrase(THANKS_PHRASE)) return 'thanks';
  if (exact(GREETING_EXACT) || phrase(GREETING_PHRASE)) return 'greeting';
  if (phrase(HELP_PHRASE) || s === 'help') return 'help';
  if (exact(YES)) return 'yes';
  if (exact(NO)) return 'no';
  if (exact(['report']) || phrase(REPORT_PHRASE)) return 'report';
  if (exact(['track']) || phrase(TRACK_PHRASE)) return 'track';
  return null;
}

export interface IntentReply {
  text: string;
  action?: 'open_report' | 'open_track';
}

export function intentReply(intent: string, lang: string): IntentReply {
  const en = (k: string) => tLang(k, lang);

  switch (intent) {
    case 'greeting':
      return { text: en('greeting') };
    case 'thanks':
      return { text: en('thanks') };
    case 'help':
      return { text: en('help') };
    case 'bye':
      return { text: en('bye') };
    case 'report':
      return { text: en('report'), action: 'open_report' };
    case 'track':
      return { text: en('track'), action: 'open_track' };
    default:
      return { text: en('generic') };
  }
}

// Natural follow-up when the message is still too vague to classify.
export function askMore(userInput: string, lang: string): string {
  const trimmed = userInput.trim().replace(/\s+/g, ' ').slice(0, 80);
  const short = trimmed.length > 0 && trimmed.split(' ').length <= 12;

  const bank: Record<string, { withEcho: string; plain: string }> = {
    en: {
      withEcho: `Got it — "${trimmed}". What actually happened though? Was it a pothole, water logging, garbage, a power cut, an accident, or something else?`,
      plain: 'Tell me what actually happened — was it a pothole, water logging, garbage, a power cut, an accident, or something else? A line or two is enough.',
    },
    kn: {
      withEcho: `ಅರ್ಥವಾಯಿತು — "${trimmed}". ಆದರೆ ನಿಜವಾಗಿ ಏನಾಯಿತು? ಗುಂಡಿ, ನೀರು, ಕಸ, ವಿದ್ಯುತ್ ಕಡಿತ, ಅಪಘಾತ, ಅಥವಾ ಬೇರೇನಾದರೂ?`,
      plain: 'ನಿಜವಾಗಿ ಏನಾಯಿತು ಎಂದು ಹೇಳಿ — ಗುಂಡಿ, ನೀರು ನಿಲುವು, ಕಸ, ವಿದ್ಯುತ್ ಕಡಿತ, ಅಪಘಾತ, ಅಥವಾ ಬೇರೇನಾದರೂ? ಒಂದೆರಡು ಸಾಲು ಸಾಕು.',
    },
    hi: {
      withEcho: `समझ गया — "${trimmed}"। लेकिन हुआ क्या? गड्ढा, जलभराव, कूड़ा, बिजली गुल, एक्सीडेंट, या कुछ और?`,
      plain: 'बताएँ असल में क्या हुआ — गड्ढा, जलभराव, कूड़ा, बिजली गुल, एक्सीडेंट, या कुछ और? दो-तीन पंक्तियाँ काफी हैं।',
    },
    te: {
      withEcho: `అర్థమైంది — "${trimmed}". కానీ నిజంగా ఏమి జరిగింది? గుంత, నీటి నిల్వ, చెత్త, కరెంటు పోవడం, ప్రమాదం, లేదా వేరేదైనా?`,
      plain: 'నిజంగా ఏమి జరిగిందో చెప్పండి — గుంత, నీటి నిల్వ, చెత్త, కరెంటు పోవడం, ప్రమాదం, లేదా వేరేదైనా? రెండు వాక్యాలు చాలు.',
    },
  };

  const entry = bank[lang] || bank.en;
  return short ? entry.withEcho : entry.plain;
}

function tLang(key: string, lang: string): string {
  const bank: Record<string, Record<string, string>> = {
    greeting: {
      en: 'Hello! 👋 I can help you report a civic problem in Bengaluru.\n\nTell me what happened — potholes, garbage, water, accidents, bribes, anything — in your own words, in English, Kannada, Hindi or Telugu.\n\nOr tap a category to start faster.',
      kn: 'ನಮಸ್ಕಾರ! 👋 ಬೆಂಗಳೂರಿನ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಲು ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.\n\nಏನಾಯಿತು ಎಂದು ನಿಮ್ಮ ಮಾತುಗಳಲ್ಲಿ ಹೇಳಿ — ಗುಂಡಿ, ಕಸ, ನೀರು, ಅಪಘಾತ, ಲಂಚ — ಏನಾದರೂ.\n\nಅಥವಾ ವೇಗಕ್ಕಾಗಿ ಕೆಳಗಿನ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
      hi: 'नमस्ते! 👋 मैं बेंगलुरु की समस्याएँ रिपोर्ट करने में आपकी मदद कर सकता हूँ।\n\nअपने शब्दों में बताएँ कि क्या हुआ — गड्ढा, कूड़ा, पानी, एक्सीडेंट, रिश्वत — कुछ भी।\n\nया तेज़ी से शुरू करने के लिए नीचे की श्रेणी चुनें।',
      te: 'నమస్కారం! 👋 బెంగళూరు సమస్యను నివేదించడంలో నేను సహాయం చేయగలను.\n\nఏమి జరిగిందో మీ మాటల్లో చెప్పండి — గుంత, చెత్త, నీరు, ప్రమాదం, లంచం — ఏదైనా.\n\nలేదా వేగంగా ప్రారంభించడానికి క్రింది వర్గాన్ని ఎంచుకోండి.',
    },
    thanks: {
      en: 'You’re welcome! 😊\n\nAnything else you’d like to report, or shall I help you track an existing one?',
      kn: 'ಸ್ವಾಗತ! 😊\n\nಮತ್ತೊಂದು ಏನಾದರೂ ವರದಿ ಮಾಡಬೇಕೇ, ಅಥವಾ ಹಿಂದಿನದರ ಸ್ಥಿತಿ ನೋಡಬೇಕೇ?',
      hi: 'आपका स्वागत है! 😊\n\nकुछ और रिपोर्ट करना है, या मौजूदा रिपोर्ट की स्थिति देखें?',
      te: 'దయచేసి పట్టించుకోండి! 😊\n\nమరిన్నింటిని నివేదించాలా, లేదా ఉన్న దాని స్థితి చూడాలా?',
    },
    help: {
      en: 'Here’s how I work:\n\n1️⃣ Tell me what happened in your words, or pick a category.\n2️⃣ I’ll ask a few quick questions (location, when, photos).\n3️⃣ I give you a final review, then a Safety Check before submitting.\n4️⃣ You get a tracking ID to check status anytime.\n\n🔒 Your report is anonymous — no phone number, no login.\n\n🗣️ Supported: English, ಕನ್ನಡ, हिन्दी, తెలుగు',
      kn: 'ನಾನು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತೇನೆ:\n\n1️⃣ ನಿಮ್ಮ ಮಾತುಗಳಲ್ಲಿ ಏನಾಯಿತು ಎಂದು ಹೇಳಿ, ಅಥವಾ ವರ್ಗ ಆಯ್ಕೆ ಮಾಡಿ.\n2️⃣ ನಾನು ಕೆಲವು ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳುತ್ತೇನೆ.\n3️⃣ ಅಂತಿಮ ಪರಿಶೀಲನೆ ನಂತರ ಸುರಕ್ಷಾ ಪರಿಶೀಲನೆ.\n4️⃣ ಟ್ರ್ಯಾಕಿಂಗ್ ID ಸಿಗುತ್ತದೆ.\n\n🔒 ನಿಮ್ಮ ವರದಿ ಅನಾಮಧೇಯ.',
      hi: 'मैं कैसे काम करता हूँ:\n\n1️⃣ अपने शब्दों में बताएँ, या श्रेणी चुनें।\n2️⃣ मैं कुछ छोटे सवाल पूछूँगा।\n3️⃣ अंतिम समीक्षा, फिर सुरक्षा जाँच।\n4️⃣ आपको ट्रैकिंग ID मिलेगा।\n\n🔒 आपकी रिपोर्ट गुमनाम है।',
      te: 'నేను ఎలా పనిచేస్తాను:\n\n1️⃣ మీ మాటల్లో చెప్పండి లేదా వర్గం ఎంచుకోండి.\n2️⃣ నేను కొన్ని ప్రశ్నలు అడుగుతాను.\n3️⃣ చివరి సమీక్ష, తర్వాత భద్రతా తనిఖీ.\n4️⃣ ట్రాకింగ్ ID లభిస్తుంది.\n\n🔒 మీ నివేదిక గుర్తింపు లేకుండా ఉంటుంది.',
    },
    bye: {
      en: 'Bye! 👋 Your report is safe — track it anytime with your ID.',
      kn: 'ಬೈ! 👋 ನಿಮ್ಮ ವರದಿ ಸುರಕ್ಷಿತ — ID ಮೂಲಕ ಯಾವಾಗ ಬೇಕಾದರೂ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
      hi: 'अलविदा! 👋 आपकी रिपोर्ट सुरक्षित है — ID से कभी भी ट्रैक करें।',
      te: 'బై! 👋 మీ నివేదిక సురక్షితం — ID తో ఎప్పుడైనా ట్రాక్ చేయండి.',
    },
    report: {
      en: 'Great — let’s start your report. 📝\n\nWhat happened? Describe it in your own words.',
      kn: 'ಚೆನ್ನಾಗಿದೆ — ವರದಿ ಪ್ರಾರಂಭಿಸೋಣ. 📝\n\nಏನಾಯಿತು? ನಿಮ್ಮ ಮಾತುಗಳಲ್ಲಿ ವಿವರಿಸಿ.',
      hi: 'बढ़िया — रिपोर्ट शुरू करते हैं। 📝\n\nक्या हुआ? अपने शब्दों में बताएँ।',
      te: 'బాగుంది — నివేదిక ప్రారంభిద్దాం. 📝\n\nఏమి జరిగింది? మీ మాటల్లో వివరించండి.',
    },
    track: {
      en: 'Opening your reports — you can check status with your tracking ID.',
      kn: 'ನಿಮ್ಮ ವರದಿಗಳು ತೆರೆಯಲಾಗುತ್ತಿದೆ — ಟ್ರ್ಯಾಕಿಂಗ್ ID ಮೂಲಕ ಸ್ಥಿತಿ ನೋಡಿ.',
      hi: 'आपकी रिपोर्ट खुल रही है — ट्रैकिंग ID से स्थिति देखें।',
      te: 'మీ నివేదికలు తెరుస్తున్నాం — ట్రాకింగ్ ID తో స్థితి చూడండి.',
    },
    generic: {
      en: 'I’m here to help you report a Bengaluru civic issue.\n\nTell me what happened — potholes, garbage, water logging, power cuts, accidents, bribes or anything else.',
      kn: 'ಬೆಂಗಳೂರಿನ ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಲು ನಾನಿದ್ದೇನೆ.\n\nಏನಾಯಿತು ಎಂದು ಹೇಳಿ — ಗುಂಡಿ, ಕಸ, ನೀರು, ವಿದ್ಯುತ್, ಅಪಘಾತ, ಲಂಚ.',
      hi: 'मैं बेंगलुरु की समस्या रिपोर्ट करने में मदद के लिए यहाँ हूँ।\n\nबताएँ क्या हुआ — गड्ढा, कूड़ा, जलभराव, बिजली, एक्सीडेंट, रिश्वत।',
      te: 'బెంగళూరు సమస్య నివేదించడానికి నేను ఇక్కడ ఉన్నాను.\n\nఏమి జరిగిందో చెప్పండి — గుంత, చెత్త, నీటి నిల్వ, విద్యుత్, ప్రమాదం, లంచం.',
    },
  };

  const entry = bank[key];
  if (!entry) return '';
  return entry[lang] || entry.en;
}
