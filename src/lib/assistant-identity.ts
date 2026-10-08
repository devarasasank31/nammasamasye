// Configured identity for the chatbot (spec §21). All values come from
// environment configuration — replies never invent names, creators or dates.

export type AssistantIdentityKind = 'who' | 'creator' | 'created_when' | 'version';

export interface AssistantIdentity {
  name: string;
  creator: string;
  creationDate: string;
  version: string;
}

export function assistantIdentity(): AssistantIdentity {
  return {
    name: process.env.ASSISTANT_NAME?.trim() || 'Namma Samasye AI',
    creator: process.env.ASSISTANT_CREATOR?.trim() || 'the NammaSamasye project',
    creationDate: process.env.ASSISTANT_CREATION_DATE?.trim() || '',
    version: process.env.ASSISTANT_VERSION?.trim() || '',
  };
}

const WHO_PATTERNS: RegExp[] = [
  /^(who|what) are you\b/i,
  /\byour name\b/i,
  /\bwhat should i call you\b/i,
  /\bare you (chatgpt|openai|gpt[- ]?\d|gemini|claude)\b/i,
  /\bare you (an? )?(ai|bot|robot|assistant)\b/i,
];

const CREATOR_PATTERNS: RegExp[] = [
  /\bwho (made|built|created|developed|trained) (you|ur)\b/i,
  /\bwho('?s| is) (your |the )?(creator|author|developer)\b/i,
  /\bwhat company (made|built|created) you\b/i,
  /\bare you (from|by) openai\b/i,
];

const CREATED_WHEN_PATTERNS: RegExp[] = [
  /\bwhen were you (made|built|created|developed|trained|deployed)\b/i,
  /\bwhen did you (start|launch|come into)\b/i,
  /\byour (creation|birth) date\b/i,
];

const VERSION_PATTERNS: RegExp[] = [
  /\bwhat('?s| is) your version\b/i,
  /\bwhich version are you\b/i,
  /\bhow old are you\b/i,
];

/** Fast, deterministic identity intent — never needs an external AI call. */
export function identityIntent(text: string): AssistantIdentityKind | null {
  const s = text.trim();
  if (!s) return null;
  if (CREATED_WHEN_PATTERNS.some(p => p.test(s))) return 'created_when';
  if (CREATOR_PATTERNS.some(p => p.test(s))) return 'creator';
  if (VERSION_PATTERNS.some(p => p.test(s))) return 'version';
  if (WHO_PATTERNS.some(p => p.test(s))) return 'who';
  return null;
}

const REPLIES: Record<AssistantIdentityKind, Record<string, (id: AssistantIdentity) => string>> = {
  who: {
    en: id => `I'm ${id.name}, the AI assistant for NammaSamasye, helping Bengaluru citizens report and understand civic issues.`,
    kn: id => `ನಾನು ${id.name} — NammaSamasye ನ AI ಸಹಾಯಕ. ಬೆಂಗಳೂರಿನ ಪೌರರು ನಗರ ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಲು ಮತ್ತು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.`,
    hi: id => `मैं ${id.name} हूँ, NammaSamasye का AI सहायक — बेंगलुरु के नागरिकों की नागरिक समस्याएँ रिपोर्ट करने और समझने में मदद करता हूँ।`,
    te: id => `నేను ${id.name} — NammaSamasye యొక్క AI సహాయకుడు. బెంగళూరు పౌరులు సమస్యలను నివేదించడానికి, అర్థం చేసుకోవడానికి నేను సహాయం చేస్తాను.`,
  },
  creator: {
    en: id => `I was created by ${id.creator} for NammaSamasye.`,
    kn: id => `ನನ್ನನ್ನು NammaSamasye ಗಾಗಿ ${id.creator} ರಚಿಸಿದರು.`,
    hi: id => `मुझे NammaSamasye के लिए ${id.creator} ने बनाया है।`,
    te: id => `నన్ను NammaSamasye కోసం ${id.creator} సృష్టించారు.`,
  },
  created_when: {
    en: id => id.creationDate
      ? `I was created on ${id.creationDate}.`
      : 'My creation date is not configured, so I will not invent one — ask the NammaSamasye team.',
    kn: id => id.creationDate
      ? `ನನ್ನನ್ನು ${id.creationDate} ರಂದು ರಚಿಸಲಾಯಿತು.`
      : 'ನನ್ನ ರಚನಾ ದಿನಾಂಕ ಕಾನ್ಫಿಗರ್ ಆಗಿಲ್ಲ, ಆದ್ದರಿಂದ ನಾನು ದಿನಾಂಕ ಊಹಿಸುವುದಿಲ್ಲ — NammaSamasye ತಂಡವನ್ನು ಕೇಳಿ.',
    hi: id => id.creationDate
      ? `मुझे ${id.creationDate} को बनाया गया था।`
      : 'मेरी निर्माण तिथि कॉन्फ़िगर नहीं है, इसलिए मैं कोई तिथि नहीं बनाऊँगा — NammaSamasye टीम से पूछें।',
    te: id => id.creationDate
      ? `నన్ను ${id.creationDate} న సృష్టించారు.`
      : `నా సృష్టి తేదీ కాన్ఫిగర్ చేయబడలేదు, కాబట్టి నేను తేదీని ఊహించను — NammaSamasye బృందాన్ని అడగండి.`,
  },
  version: {
    en: id => id.version ? `I'm ${id.name} version ${id.version}.` : `I'm ${id.name}; my version number isn't configured.`,
    kn: id => id.version ? `ನಾನು ${id.name}, ಆವೃತ್ತಿ ${id.version}.` : `ನಾನು ${id.name}; ಆವೃತ್ತಿ ಸಂಖ್ಯೆ ಕಾನ್ಫಿಗರ್ ಆಗಿಲ್ಲ.`,
    hi: id => id.version ? `मैं ${id.name} संस्करण ${id.version} हूँ।` : `मैं ${id.name} हूँ; मेरा संस्करण नंबर कॉन्फ़िगर नहीं है।`,
    te: id => id.version ? `నేను ${id.name} వెర్షన్ ${id.version}.` : `నేను ${id.name}; నా వెర్షన్ నంబర్ కాన్ఫిగర్ చేయబడలేదు.`,
  },
};

export function identityReply(kind: AssistantIdentityKind, lang: string): string {
  const bank = REPLIES[kind];
  const fn = bank[lang] || bank.en;
  return fn(assistantIdentity());
}
