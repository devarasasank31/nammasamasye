import { Language } from '@/types';
import { scenarios } from '@/data/scenarios';

export interface ScenarioMatch {
  scenarioId: string;
  scenarioName: string;
  confidence: number;
  reason: string;
}

const KEYWORD_MAP: Record<string, string[]> = {
  accident: ['accident', 'hit', 'collision', 'crash', 'crashed', 'bike hit', 'car hit', 'vehicle hit', 'ಅಪಘात', 'ಢಿಕ್ಕಿ', 'ದುರ್ಘಟನೆ', 'ప్రమాదం', 'ఢీకొనడం', 'दुर्घटना', 'टक्कर'],
  parking: ['parking', 'parked', 'illegal parking', 'blocking', 'ಪಾರ್ಕಿಂಗ್', 'పార్కింగ్', 'पार्किंग'],
  pothole: ['pothole', 'road damage', 'broken road', 'road condition', 'ಗುಂಡಿ', 'ರಸ್ತೆ', 'గుంత', 'रोड', 'गड्ढा'],
  garbage: ['garbage', 'trash', 'waste', 'dumping', 'कचरा', 'ಕಸ', 'చెత్త'],
  streetlight: ['streetlight', 'light', 'lamp', 'no light', 'street light', 'ದೀಪ', 'ಲೈಟ್', 'దీపం', 'స్ట్రీట్ లైట్'],
  traffic_stop: ['police stopped', 'traffic police', 'challan', 'receipt', 'fine', 'receipt', 'ಚಲಾನ್', 'ಪೊಲೀಸ್', 'ట్రాఫిక్', 'పోలీసు', 'चालान', 'पुलिस'],
  unofficial_payment: ['bribe', 'unofficial payment', 'asked for money', '250', '500', 'asked money', 'requested money', 'ಬ್ರೈಬ್', 'ಅನಧಿಕೃತ', 'అనధికార', 'लंगोट', 'घूस', 'पैसे मांगे'],
  harassment: ['harassment', 'following', 'attacking', 'threat', 'safe', 'danger', 'ಕಿರುಕುಳ', 'ಅಪಾಯ', 'వేధింపు', 'ప్రమాదం', 'उत्पीड़न', 'खतरा'],
  cybercrime: ['scam', 'fraud', 'online', 'cyber', 'suspicious link', 'transaction', 'ಸೈಬರ್', 'ಮೋಸ', 'సైబర్', 'మోసం', 'साइबर', 'धोखाधड़ी'],
  tenant: ['tenant', 'landlord', 'rent', 'deposit', 'agreement', 'ಬಾಡಿಗೆ', 'ಮಾಲೀక', 'కిరాయి', 'యజమాని', 'किरायेदार', 'मकान मालिक'],
  noise: ['noise', 'loud', 'music', 'sound', 'ಶಬ್ದ', 'ನಾಯ್ಸ್', 'ధ్వని', 'శబ్దం', 'शोर', 'ध्वनि'],
  power: ['power', 'electricity', 'outage', 'power cut', 'ವಿದ್ಯುತ್', 'ಪವರ್', 'విద్యుత్', 'బిజలీ', 'बिजली', 'पावर'],
  language: ['language', 'communicate', 'understand', 'Hindi', 'Kannada', 'ಭಾಷೆ', 'భాష', 'भाषा'],
  government: ['government', 'office', 'service', 'delay', 'document', 'ಸರ್ಕಾರ', 'ಕಛೇರಿ', 'ప్రభుత్వ', 'సర్కార్', 'सरकार', 'दफ्तर'],
  footpath: ['footpath', 'sidewalk', 'pedestrian', 'walking', 'ಫುಟ್‌ಪಾತ್', 'ನಡಿಗೆ', 'ఫుట్‌పాత్', 'పాదచారి', 'फुटपाथ'],
  drainage: ['drain', 'drainage', 'blocked', 'water logging', 'ಚರಂಡಿ', 'ಡ್ರೈನ್', 'డ్రైనేజీ', 'నాలు', 'नाली'],
  wrong_side: ['wrong side', 'opposite', 'oncoming', 'ತಪ್ಪು ಬದಿ', 'తప్పు వైపు', 'गलत दिशा'],
};

function calculateMatch(text: string, keywords: string[]): { confidence: number; matched: string[] } {
  const lowerText = text.toLowerCase();
  const matched = keywords.filter(kw => lowerText.includes(kw.toLowerCase()));
  const confidence = Math.min(95, 40 + matched.length * 15);
  return { confidence, matched };
}

export function classifyIncident(text: string, language: Language): ScenarioMatch[] {
  const results: ScenarioMatch[] = [];
  const lowerText = text.toLowerCase();

  const scenarioKeywordMap: Record<string, string[]> = {
    traffic_accident: [...KEYWORD_MAP.accident],
    traffic_wrong_side: [...KEYWORD_MAP.wrong_side],
    traffic_parking: [...KEYWORD_MAP.parking],
    traffic_interaction: [...KEYWORD_MAP.traffic_stop],
    civic_pothole: [...KEYWORD_MAP.pothole],
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
  };

  for (const [scenarioId, keywords] of Object.entries(scenarioKeywordMap)) {
    const { confidence, matched } = calculateMatch(lowerText, keywords);
    if (matched.length > 0) {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (scenario) {
        results.push({
          scenarioId,
          scenarioName: scenario.name,
          confidence,
          reason: `The description mentions: ${matched.join(', ')}.`,
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      scenarioId: 'traffic_accident',
      scenarioName: 'General Incident',
      confidence: 30,
      reason: 'Unable to determine a specific scenario. Please select the most relevant category.',
    });
  }

  return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
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
    'ದಾಳಿ', 'ಅಪಾಯ', 'ಸಹಾಯ', 'तुरंत', 'खतरा', 'मदद',
    'దాడి', 'ప్రమాదం', 'సహాయం',
  ];
  const lower = text.toLowerCase();
  return emergencyKeywords.some(kw => lower.includes(kw));
}
