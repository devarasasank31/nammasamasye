import { Language } from '@/types';
import { scenarios, getScenarioName } from '@/data/scenarios';
import { normalizeForMatch } from '@/lib/ai/language';
import { t } from '@/lib/translations';

export interface ScenarioMatch {
  scenarioId: string;
  scenarioName: string;
  confidence: number;
  reason: string;
}

// Latin-script entries are transliterated Hindi/Kannada/Telugu, because people
// routinely type "kuch nahi", "bijli gayi" or "gundi road" in plain English
// letters. Each word is chosen to be unambiguous in English text.
const KEYWORD_MAP: Record<string, string[]> = {
  accident: ['accident', 'hit', 'collision', 'crash', 'crashed', 'bike hit', 'car hit', 'vehicle hit', 'takkar', 'ಅಪಘಾತ', 'ಢಿಕ್ಕಿ', 'ದುರ್ಘಟನೆ', 'ప్రమాదం', 'ఢీకొనడం', 'दुर्घटना', 'टक्कर'],
  parking: ['parking', 'parked', 'illegal parking', 'blocking', 'ಗಾಡಿ', 'ಪಾರ್ಕಿಂಗ್', 'పార్కింగ్', 'पार्किंग'],
  pothole: ['pothole', 'road damage', 'broken road', 'road condition', 'gaddha', 'gadda', 'gundi', 'gundhi', 'ಗುಂಡಿ', 'ರಸ್ತೆ', 'గుంత', 'रोड', 'गड्ढा'],
  garbage: ['garbage', 'trash', 'waste', 'dumping', 'kachra', 'kachre', 'kuda', 'kasa', 'chetta', 'ಕಸ', 'चेत्त', 'कचरा', 'చెత్త'],
  streetlight: ['streetlight', 'light', 'lamp', 'no light', 'street light', 'light band', 'deepam', 'ದೀಪ', 'ಲೈಟ್', 'ದీపం', 'స్ట్రీట్ లైట్'],
  traffic_stop: ['police stopped', 'traffic police', 'challan', 'chalan', 'receipt', 'fine', 'ಚಲಾನ್', 'ಪೊಲೀಸ್', 'ట్రాఫిక్', 'పోలీసు', 'चालान', 'पुलिस'],
  unofficial_payment: ['bribe', 'unofficial payment', 'asked for money', '250', '500', 'asked money', 'requested money', 'rishwat', 'rishwet', 'ghoos', 'lancha', 'paisa mange', 'ಬ್ರೈಬ್', 'ಅನಧಿಕೃತ', 'ಲಂಚ', 'అనధికార', 'लंगोट', 'घूस', 'रिश्वत', 'पैसे मांगे'],
  harassment: ['harassment', 'following', 'attacking', 'threat', 'safe', 'danger', 'pareshan', 'ದಾಳಿ', 'ಕಿರುಕುಳ', 'ಅಪಾಯ', 'ವేధింపు', 'ప్రమాదం', 'उत्पीड़न', 'परेशान', 'खतरा'],
  cybercrime: ['scam', 'fraud', 'online', 'cyber', 'suspicious link', 'transaction', 'otp', 'phishing', 'vishing', 'fake link', 'ಸೈಬರ್', 'ಮೋಸ', 'సైబర్', 'మోసం', 'साइबर', 'धोखाधड़ी'],
  tenant: ['tenant', 'landlord', 'rent', 'deposit', 'agreement', 'ಕಿರಾಯಿ', 'ಬಾಡಿಗೆ', 'ಮಾಲೀಕ', 'కిరాయి', 'యజమాని', 'किरायेदार', 'मकान मालिक'],
  noise: ['noise', 'loud', 'music', 'sound', 'shor', 'sharaba', 'awaaz', 'awaaj', 'ಶಬ್ದ', 'నಾಯ್ಸ್', 'ధ్వని', 'శబ్దం', 'शोर', 'आवाज़', 'ध्वनि'],
  power: ['power', 'electricity', 'outage', 'power cut', 'bijli', 'current gaya', 'light gaya', 'ವಿದ್ಯುತ್', 'ಪವರ್', 'ವిద్యుత్', 'బిజలీ', 'बिजली', 'पावर'],
  language: ['language', 'communicate', 'understand', 'Hindi', 'Kannada', 'Telugu', 'ಭಾಷೆ', 'భాష', 'भाषा'],
  government: ['government', 'office', 'service', 'delay', 'document', 'sarkar', 'daftar', 'ಸರ್ಕಾರ', 'ಕಛೇರಿ', 'ప్రభుత్వ', 'సర్కార్', 'सरकार', 'दफ्तर'],
  footpath: ['footpath', 'sidewalk', 'pedestrian', 'walking', 'pavement', 'ಫುಟ್‌ಪಾತ್', 'ನಡಿಗೆ', 'ఫుట్‌పాత్', 'పాదచారి', 'फुटपाथ'],
  drainage: ['drain', 'drainage', 'blocked', 'water logging', 'pani bhar', 'paani bhar', 'ಚರಂಡಿ', 'ಡ್ರೈನ್', 'డ్రైనేజీ', 'నాలు', 'नाली', 'पानी भर'],
  wrong_side: ['wrong side', 'opposite', 'oncoming', 'ulta', 'ತಪ್ಪು ಬದಿ', 'తప్పు వైపు', 'गलत दिशा', 'उल्टा'],
  bmtc_service: ['bmtc', 'bmrtc', 'bus late', 'bus did not come', 'bus not coming', 'bus broke down', 'bus breakdown', 'overcrowded bus', 'bus did not stop', 'bus skipped', 'waiting for bus', 'bus aagilla', 'bus bandidilla', 'bus nahi aayi', 'ಬಸ್ ಬಂದಿಲ್ಲ', 'ಬಸ್ ತಡ', 'ಬಸ್ ನಿಂತು', 'बस नहीं आई', 'बस लेट', 'బస్సు రాలేదు', 'బస్సు ఆలస్యం'],
  bmtc_staff: ['conductor', 'bus driver rash', 'driver argued', 'staff misbehaved', 'conductor rude', 'conductor ticket kodlilla', 'ಕಂಡಕ್ಟರ್', 'चालक', 'कंडक्टर', 'కండక్టర్'],
  bmtc_fare_ticket: ['bus fare', 'bus pass', 'buspass', 'ticket not given', 'no change', 'overcharged', 'fare more', 'bus fare issue', 'ಬಸ್ ದರ', 'ಟಿಕೆಟ್', 'बस किराया', 'टिकट नहीं', 'బస్ ఛార్జీ', 'టికెట్'],
  metro_service: ['namma metro', 'metro late', 'metro delayed', 'metro train', 'metro station', 'metro broke down', 'metro gate', 'metro token', 'metro crowded', 'bmrcl', 'metro', 'ಮೆಟ್ರೋ', 'मेट्रो', 'मेट्रो स्टेशन', 'మెట్రో'],
  civic_sense: [
    'stunt', 'stunts', 'wheelie', 'racing', 'overspeeding', 'over speeding',
    'rash driving', 'reckless', 'jumped the signal', 'jumping signal',
    'signal jump', 'red light jump', 'zebra crossing', 'no helmet',
    'helmetless', 'triple riding', 'three riding', 'drunk driving',
    'going wrong side', 'coming wrong side',
    'stunt kar rahe', 'signal toda', 'bina helmet', 'race kar rahe',
    'ಸ್ಟಂಟ್', 'ವೀಲಿ', 'ಅತಿವೇಗ', 'ಸಿಗ್ನಲ್ ದಾಟಿದ', 'ಹೆಲ್ಮೆಟ್ ಇಲ್ಲ', 'ರೇಸಿಂಗ್',
    'స్టంట్', 'వీలీ', 'అధిక వేగం', 'సిగ్నల్ దాటి', 'హెల్మెట్ లేదు', 'రేసింగ్',
    'स्टंट', 'व्हीली', 'रेसिंग', 'सिग्नल तोड़ा', 'बिना हेलमेट', 'लापरवाही',
  ],
};

const FALLBACK_REASON: Record<Language, string> = {
  en: 'Could not match a scenario. Please pick the closest category below.',
  kn: 'ಯಾವ ಸನ್ನಿವೇಶಕ್ಕೂ ಹೊಂದಿಕೆಯಾಗಿಲ್ಲ. ಕೆಳಗಿನಿಂದ ಹತ್ತಿರದ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
  hi: 'किसी परिदृश्य से मेल नहीं खाया। नीचे सबसे करीबी श्रेणी चुनें।',
  te: 'ఏ సన్నివేశంతో సరిపోలలేదు. కింది నుండి దగ్గరి వర్గాన్ని ఎంచుకోండి.',
};

function calculateMatch(text: string, keywords: string[]): { confidence: number; matched: string[] } {
  const lowerText = text.toLowerCase();
  const matched = keywords.filter(kw => lowerText.includes(kw.toLowerCase()));
  const confidence = Math.min(95, 40 + matched.length * 15);
  return { confidence, matched };
}

export function classifyIncident(text: string, language: Language): ScenarioMatch[] {
  const results: ScenarioMatch[] = [];
  const lowerText = normalizeForMatch(text);
  // Matching understands every language, but what we show back is always the
  // language the citizen selected — typing elsewhere never switches it.
  const effectiveLanguage = language;

  const scenarioKeywordMap: Record<string, string[]> = {
    traffic_accident: [...KEYWORD_MAP.accident],
    traffic_wrong_side: [...KEYWORD_MAP.wrong_side],
    civic_sense: [...KEYWORD_MAP.civic_sense],
    traffic_parking: [...KEYWORD_MAP.parking],
    traffic_interaction: [...KEYWORD_MAP.traffic_stop],
    traffic_pothole: [...KEYWORD_MAP.pothole],
    civic_garbage: [...KEYWORD_MAP.garbage],
    civic_streetlight: [...KEYWORD_MAP.streetlight],
    civic_footpath: [...KEYWORD_MAP.footpath],
    civic_drainage: [...KEYWORD_MAP.drainage],
    safety_harassment: [...KEYWORD_MAP.harassment],
    unofficial_payment: [...KEYWORD_MAP.unofficial_payment],
    cybercrime: [...KEYWORD_MAP.cybercrime],
    housing_tenant: [...KEYWORD_MAP.tenant],
    env_noise: [...KEYWORD_MAP.noise],
    util_power: [...KEYWORD_MAP.power],
    access_language: [...KEYWORD_MAP.language],
    govt_service: [...KEYWORD_MAP.government],
    bmtc_service: [...KEYWORD_MAP.bmtc_service],
    bmtc_staff: [...KEYWORD_MAP.bmtc_staff],
    bmtc_fare_ticket: [...KEYWORD_MAP.bmtc_fare_ticket],
    metro_service: [...KEYWORD_MAP.metro_service],
  };

  for (const [scenarioId, keywords] of Object.entries(scenarioKeywordMap)) {
    const { confidence, matched } = calculateMatch(lowerText, keywords);
    if (matched.length > 0) {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (scenario) {
        results.push({
          scenarioId,
          scenarioName: getScenarioName(scenario, effectiveLanguage),
          confidence,
          reason: `The description mentions: ${matched.join(', ')}.`,
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      scenarioId: 'traffic_accident',
      scenarioName: t('general.incident', effectiveLanguage),
      confidence: 30,
      reason: FALLBACK_REASON[effectiveLanguage] || FALLBACK_REASON.en,
    });
  }

  return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

// Server-first classification: the hybrid local classifier (scenario
// retrieval + negations + safety rules) runs at /api/classify; if the request
// fails or returns nothing, fall back to the in-browser keyword map so the
// report flow never blocks on the network.
export async function classifyIncidentSmart(text: string, language: Language): Promise<ScenarioMatch[]> {
  let serverMatches: ScenarioMatch[] = [];
  try {
    const timeout = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
      ? AbortSignal.timeout(8000)
      : undefined;
    const res = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: language }),
      signal: timeout,
    });
    if (res.ok) {
      const data = await res.json() as { matches?: Array<{ scenarioId?: string; scenarioName?: string; confidence?: number; reason?: string }> };
      if (Array.isArray(data.matches)) {
        serverMatches = data.matches
          .filter(m => typeof m.scenarioId === 'string' && typeof m.confidence === 'number')
          .map(m => ({
            scenarioId: m.scenarioId!,
            scenarioName: m.scenarioName || m.scenarioId!,
            confidence: Math.max(1, Math.min(99, Math.round(m.confidence!))),
            reason: m.reason || '',
          }));
      }
    }
  } catch {
    // offline / timeout — keyword map below still works
  }

  const localMatches = classifyIncident(text, language);

  if (!serverMatches.length) return localMatches;

  // Merge by scenario id, keep the stronger confidence, rank by confidence.
  // (confidence 30 is classifyIncident's synthetic "no match" fallback — skip
  // it so a server match is never pushed down by a made-up entry.)
  const byId = new Map<string, ScenarioMatch>();
  for (const m of [...serverMatches, ...localMatches.filter(x => x.confidence > 30)]) {
    const prev = byId.get(m.scenarioId);
    if (!prev || m.confidence > prev.confidence) byId.set(m.scenarioId, m);
  }
  const merged = [...byId.values()].sort((a, b) => b.confidence - a.confidence);
  return merged.length ? merged.slice(0, 3) : localMatches;
}

export function generateAISummary(text: string, answers: Record<string, string>): string {
  const parts = [text];
  for (const [key, value] of Object.entries(answers)) {
    if (value && key !== 'additional') {
      parts.push(`${key}: ${value}`);
    }
  }
  return parts.join('. ');
}

export function isEmergencyMessage(text: string): boolean {
  const emergencyKeywords = [
    'attacking me', 'being followed', 'serious accident', 'emergency',
    'in danger', 'help me', 'dangerous', 'right now',
    'bachao', 'bachao', 'madad', 'help karo', 'meri jaan',
    'ದಾಳಿ', 'ಅಪಾಯ', 'ಸಹಾಯ', 'ಕಾಪಾಡಿ', 'तुरंत', 'खतरा', 'मदद', 'बचाओ',
    'దాడి', 'ప్రమాదం', 'సహాయం', 'కాపాడండి',
  ];
  return emergencyKeywords.some(kw => normalizeForMatch(text).includes(kw));
}
