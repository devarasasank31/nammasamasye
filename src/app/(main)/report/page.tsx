'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Language, IncidentCategory, AttachmentMeta } from '@/types';
import { getStoredLanguage, setStoredLanguage, getOrCreateSession, LANGUAGE_EVENT } from '@/services/session';
import { getScenarioById, getScenarioName } from '@/data/scenarios';
import { classifyIncident, isEmergencyMessage } from '@/ai/classify';
import { matchTrainedScenario } from '@/lib/trained-scenarios';
import { detectReplyLanguage, shouldAdoptLanguage, speechLocale, isLanguage } from '@/lib/ai/language';
import { t } from '@/lib/translations';
import { createIncident } from '@/services/incident';
import FileUploader from '@/components/FileUploader';
import dynamic from 'next/dynamic';
import type { PickedLocation } from '@/components/LocationPicker';
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-[420px] rounded-2xl bg-gray-100 animate-pulse" />,
});
import { Send, Mic, MicOff, ArrowLeft, Globe, ChevronRight, MapPin, X, Square, Link2, Plus, ShieldCheck, Paperclip, Check, Home } from 'lucide-react';

type Step = 'greeting' | 'category_select' | 'free_text' | 'scenario_match' | 'workflow' | 'review' | 'safety_review' | 'submitted';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

const categoryButtons = [
  { id: 'traffic_accident', icon: '🚗', label: 'Traffic / Accident', labelKn: 'ಸಂಚಾರ / ಅಪಘಾತ', labelHi: 'ट्रैफिक / दुर्घटना', labelTe: 'ట్రాఫిక్ / ప్రమాదం' },
  { id: 'traffic_pothole', icon: '🕳️', label: 'Pothole / Road Damage', labelKn: 'ಗುಂಡಿ / ರಸ್ತೆ ಹಾನಿ', labelHi: 'गड्ढा / सड़क क्षति', labelTe: 'గుంత / రోడ్ నష్టం' },
  { id: 'civic_garbage', icon: '🗑️', label: 'Garbage', labelKn: 'ಕಸ', labelHi: 'कचरा', labelTe: 'చెత్త' },
  { id: 'traffic_parking', icon: '🅿️', label: 'Illegal Parking', labelKn: 'ಅಕ್ರಮ ಪಾರ್ಕಿಂಗ್', labelHi: 'अवैध पार्किंग', labelTe: 'చట్టవిరుద్ధ పార్కింగ్' },
  { id: 'civic_streetlight', icon: '💡', label: 'Streetlight', labelKn: 'ಬೀದಿ ದೀಪ', labelHi: 'स्ट्रीटलाइट', labelTe: 'స్ట్రీట్ లైట్' },
  { id: 'civic_footpath', icon: '🚶', label: 'Footpath Issue', labelKn: 'ಫುಟ್‌ಪಾತ್ ಸಮಸ್ಯೆ', labelHi: 'फुटपाथ समस्या', labelTe: 'ఫుట్‌పాత్ సమస్య' },
  { id: 'civic_drainage', icon: '🚰', label: 'Drainage / Water Logging', labelKn: 'ಚರಂಡಿ / ನೀರು ನಿಲ್ಲುವಿಕೆ', labelHi: 'नाली / जलभराव', labelTe: 'డ్రైనేజీ / నీటి నిలుపుదల' },
  { id: 'civic_parks', icon: '🌳', label: 'Parks & Gardens', labelKn: 'ಉದ್ಯಾನ ಮತ್ತು ತೋಟಗಳು', labelHi: 'पार्क और बगीचे', labelTe: 'పార్కులు మరియు తోటలు' },
  { id: 'civic_water_supply', icon: '💧', label: 'Water Supply', labelKn: 'ನೀರು ಸರಬರಾಜು', labelHi: 'जल आपूर्ति', labelTe: 'నీటి సరఫరా' },
  { id: 'civic_stray_animals', icon: '🐕', label: 'Stray Animals', labelKn: 'ಬೀದಿ ಪ್ರಾಣಿಗಳು', labelHi: 'आवारा जानवर', labelTe: 'వీధి జంతువులు' },
  { id: 'traffic_interaction', icon: '👮', label: 'Police / Traffic Interaction', labelKn: 'ಪೊಲೀಸ್ / ಸಂಚಾರ ಸಂವಹನ', labelHi: 'पुलिस / ट्रैफिक', labelTe: 'పోలీసు / ట్రాఫిక్' },
  { id: 'civic_sense', icon: '🚨', label: 'Civic Sense / Violations', labelKn: 'ಸಿವಿಕ್ ಸೆನ್ಸ್ / ಉಲ್ಲಂಘನೆಗಳು', labelHi: 'सिविक सेंस / उल्लंघन', labelTe: 'సివిక్ సెన్స్ / ఉల్లంఘనలు' },
  { id: 'bribes', icon: '💰', label: 'Bribes', labelKn: 'ಲಂಚ', labelHi: 'रिश्वत', labelTe: 'లంచం' },
  { id: 'safety_harassment', icon: '🛡️', label: 'Safety / Harassment', labelKn: 'ಸುರಕ್ಷತೆ / ಕಿರುಕುಳ', labelHi: 'सुरक्षा / उत्पीड़न', labelTe: 'భద్రత / వేధింపు' },
  { id: 'cybercrime', icon: '💻', label: 'Cybercrime', labelKn: 'ಸೈಬರ್ ಅಪರಾಧ', labelHi: 'साइबर अपराध', labelTe: 'సైబర్ నేరం' },
  { id: 'housing_tenant', icon: '🏠', label: 'Tenant / Landlord', labelKn: 'ಬಾಡಿಗೆದಾರ / ಮಾಲೀಕ', labelHi: 'किरायेदार / मकानमालिक', labelTe: 'అద్దెదారు / యజమాని' },
  { id: 'env_noise', icon: '🔊', label: 'Noise Pollution', labelKn: 'ಶಬ್ದ ಮಾಲಿನ್ಯ', labelHi: 'ध्वनि प्रदूषण', labelTe: 'శబ్ద కాలుష్యం' },
  { id: 'util_power', icon: '⚡', label: 'Power Outage', labelKn: 'ವಿದ್ಯುತ್ ವಿಚ್ಛೇದನ', labelHi: 'बिजली कटौती', labelTe: 'కరెంటు పోవడం' },
  { id: 'access_language', icon: '🌐', label: 'Language Barrier', labelKn: 'ಭಾಷಾ ಅಡೆತಡೆ', labelHi: 'भाषा बाधा', labelTe: 'భాషా అడ్డంకి' },
  { id: 'govt_service', icon: '📄', label: 'Government Service', labelKn: 'ಸರ್ಕಾರಿ ಸೇವೆ', labelHi: 'सरकारी सेवा', labelTe: 'ప్రభుత్వ సేవ' },
  { id: 'something_else', icon: '❓', label: 'Something Else' },
];

function categoryLabel(
  cb: { id: string; label: string; labelKn?: string; labelHi?: string; labelTe?: string },
  lang: Language
): string {
  if (cb.id === 'something_else') return t('bot.something_else', lang);
  if (lang === 'kn' && cb.labelKn) return cb.labelKn;
  if (lang === 'hi' && cb.labelHi) return cb.labelHi;
  if (lang === 'te' && cb.labelTe) return cb.labelTe;
  return cb.label;
}

const supportedPlatforms = [
  { name: 'Google Drive', icon: '📁' },
  { name: 'YouTube', icon: '🎥' },
  { name: 'Imgur', icon: '📷' },
  { name: 'Dropbox', icon: '🪣' },
  { name: 'OneDrive', icon: '☁️' },
  { name: 'MediaFire', icon: '🔥' },
];

const VOICE_LABELS: Record<string, string> = {
  kn: 'ಕನ್ನಡ',
  hi: 'हिन्दी',
  te: 'తెలుగు',
  en: 'English',
};

function voiceLabel(locale: string): string {
  return VOICE_LABELS[locale.split('-')[0]] || VOICE_LABELS.en;
}

function isValidEvidenceLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace('www.', '');
    const allowed = [
      'drive.google.com', 'docs.google.com', 'photos.google.com',
      'onedrive.live.com', 'onedrive.com', 'dropbox.com',
      'imgur.com', 'i.imgur.com', 'youtube.com', 'youtu.be',
      'live.com', 'sharepoint.com', 'mediafire.com',
      'wetransfer.com', 'file.io', 'streamable.com',
      'v.redd.it', 'i.redd.it',
    ];
    return allowed.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

interface SpeechRecognitionAlternativeLike { transcript: string }
interface SpeechRecognitionResultLike { isFinal: boolean; 0: SpeechRecognitionAlternativeLike }
interface SpeechRecognitionEventLike { results: ArrayLike<SpeechRecognitionResultLike> }
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export default function ReportPage() {
  const router = useRouter();
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // True while the current input came from the microphone, so we know to
  // translate it before it goes anywhere near the workflow.
  const voiceTextRef = useRef(false);

  const [lang, setLang] = useState<Language>('en');
  const [step, setStep] = useState<Step>('greeting');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<IncidentCategory | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>([]);
  const [evidenceInput, setEvidenceInput] = useState('');
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [location, setLocation] = useState('');
  const [scenarioMatches, setScenarioMatches] = useState<{ scenarioId: string; scenarioName: string; confidence: number; reason: string }[]>([]);
  const [isCustomIssue, setIsCustomIssue] = useState(false);
  const [incidentId, setIncidentId] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  // Where the microphone is currently listening. It follows the citizen once
  // their speech has been identified, and otherwise tracks the app language.
  const [voiceOverride, setVoiceOverride] = useState<string | null>(null);
  const listeningLocale = voiceOverride ?? speechLocale(lang);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');
  const [showLangSwitch, setShowLangSwitch] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [safetyChecked, setSafetyChecked] = useState<boolean[]>([false, false, false]);
  const [showEvidenceUploader, setShowEvidenceUploader] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  // What other citizens typed under "Something else", with how many used it.
  const [customSuggestions, setCustomSuggestions] = useState<{ text: string; count: number }[]>([]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, showEvidenceForm]);

  const addBotMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'bot',
      text,
      timestamp: new Date(),
    }]);
  }, []);

  const addUserMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date(),
    }]);
  }, []);

  const initSession = useCallback(async () => {
    const session = await getOrCreateSession();
    setSessionId(session.id);
    addBotMessage(t('bot.greeting', getStoredLanguage()));
    setTimeout(() => setStep('category_select'), 500);
  }, [addBotMessage]);

  const didInitRef = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode's double mount in dev: session + greeting
    // must be created exactly once, otherwise the bot greets twice.
    if (!didInitRef.current) {
      didInitRef.current = true;
      const init = async () => {
        await Promise.resolve();
        setLang(getStoredLanguage());
        await initSession();
      };
      void init();
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [initSession]);

  // The language can change while this page is open — from the AI bot adopting
  // the citizen's language, or another tab. Follow it immediately.
  useEffect(() => {
    const sync = () => {
      const next = getStoredLanguage();
      setLang(next);
      setVoiceOverride(speechLocale(next));
    };
    window.addEventListener(LANGUAGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(LANGUAGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const moveToNextQuestion = () => {
    if (!selectedScenario) return;
    setShowEvidenceForm(false);
    setShowLocationPicker(false);
    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < selectedScenario.workflow.length) {
      setCurrentQuestionIdx(nextIdx);
      const nextQ = selectedScenario.workflow[nextIdx];
      setTimeout(() => {
        addBotMessage(nextQ.text[lang] || nextQ.text.en);
        if (nextQ.type === 'evidence') {
          setTimeout(() => setShowEvidenceForm(true), 300);
        }
        if (nextQ.type === 'location') {
          addBotMessage(t('bot.map_hint', lang));
          setTimeout(() => setShowLocationPicker(true), 300);
        }
      }, 300);
    } else {
      setTimeout(() => {
        addBotMessage(t('bot.review_before_submit', lang));
        setStep('review');
      }, 300);
    }
  };

  // Called when the user confirms a spot on the map (or skips it)
  const handleLocationPicked = (loc: PickedLocation | null) => {
    setShowLocationPicker(false);
    if (loc) {
      setPickedLocation(loc);
      setLocation(loc.address);
      if (selectedScenario) {
        const q = selectedScenario.workflow[currentQuestionIdx];
        setAnswers(prev => ({ ...prev, [q.id]: loc.address }));
        addUserMessage(loc.address);
      } else if (currentQuestionIdx === 0) {
        addUserMessage(loc.address);
      }
    } else {
      if (selectedScenario?.workflow[currentQuestionIdx]) addUserMessage(t('report.skip_short', lang).replace(' →', ''));
    }
    setTimeout(() => moveToNextQuestion(), 250);
  };

  const isYesAnswer = (answer: string) => {
    const lower = answer.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    return [
      'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay',
      'haan', 'ha', 'han', 'haan ji', 'ha ji', 'ji haan', 'haanji',
      'houdu', 'avunu', 'geniga',
        'ಹೌದು', 'हाँ', 'हां', 'हूँ', 'हूं', 'जी हाँ', 'అవును', 'ఔను',
    ].includes(lower);
  };

  // Starts a scenario's workflow at its first question
  const startScenario = (scenario: IncidentCategory, label?: string) => {
    setSelectedScenario(scenario);
    if (label) addUserMessage(label);
    const firstQ = scenario.workflow[0];
    if (firstQ) {
      addBotMessage(firstQ.text[lang] || firstQ.text.en);
      setStep('workflow');
      setCurrentQuestionIdx(0);
      if (firstQ.type === 'evidence') setTimeout(() => setShowEvidenceForm(true), 300);
      if (firstQ.type === 'location') {
        addBotMessage(t('bot.map_hint', lang));
        setTimeout(() => setShowLocationPicker(true), 300);
      }
    }
  };

  const loadCustomSuggestions = async (): Promise<{ text: string; count: number }[]> => {
    try {
      const res = await fetch('/api/custom-problems?limit=8');
      if (!res.ok) return customSuggestions;
      const d = (await res.json()) as { suggestions?: { text: string; count: number }[] };
      const list = Array.isArray(d.suggestions) ? d.suggestions : [];
      setCustomSuggestions(list);
      return list;
    } catch {
      return customSuggestions;
    }
  };

  const handleCategorySelect = (scenarioId: string) => {
    if (scenarioId === 'something_else') {
      addUserMessage(t('bot.something_else', lang));
      addBotMessage(t('bot.describe_detail', lang));
      setIsCustomIssue(true);
      setStep('free_text');
      // Show what others typed here so it is a tap instead of a retyping job.
      void loadCustomSuggestions();
      return;
    }
    const scenario = getScenarioById(scenarioId);
    if (scenario) {
      setIsCustomIssue(false);
      startScenario(scenario, getScenarioName(scenario, lang));
    } else {
      setIsCustomIssue(true);
      addBotMessage(t('bot.describe_detail', lang));
      setStep('free_text');
      void loadCustomSuggestions();
    }
  };

  // Voice arrives in whichever language the citizen actually spoke. Detect it,
  // switch the microphone over, and hand the workflow the app language.
  const maybeTranslateVoice = async (heard: string, announce = true): Promise<string> => {
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: heard, target: lang }),
      });
      if (!res.ok) return heard;
      const data = (await res.json()) as { detected?: unknown; translated?: unknown; changed?: boolean };
      // Always follow the citizen's actual language for the microphone.
      if (isLanguage(data.detected)) setVoiceOverride(speechLocale(data.detected));
      if (announce && data.changed && typeof data.translated === 'string' && data.translated.trim()) {
        const translated = data.translated.trim();
        addBotMessage(`${t('bot.voice_translated', lang)}\n\n${translated}`);
        return translated;
      }
      return heard;
    } catch {
      return heard;
    }
  };

  const handleFreeTextSubmit = async () => {
    if (!inputValue.trim()) return;
    const heard = inputValue.trim();
    setInputValue('');
    setOriginalText(heard);
    addUserMessage(heard);

    // Keep it in the database so the next person sees it as a suggestion.
    let reportCount = 1;
    try {
      const res = await fetch('/api/custom-problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: heard, language: lang }),
      });
      const saved = (await res.json()) as { count?: number };
      if (typeof saved.count === 'number' && saved.count > 0) reportCount = saved.count;
    } catch {}
    const freshSuggestions = await loadCustomSuggestions();

    let text = heard;
    if (voiceTextRef.current) {
      voiceTextRef.current = false;
      text = await maybeTranslateVoice(heard);
    }

    // If the citizen wrote in another language, answer in that language and
    // switch the rest of the conversation over too.
    const detected = detectReplyLanguage(text, lang);
    const replyLang = shouldAdoptLanguage(detected, lang, text) ? detected : lang;
    if (replyLang !== lang) {
      setLang(replyLang);
      setStoredLanguage(replyLang);
      setVoiceOverride(speechLocale(replyLang));
    }

    if (isEmergencyMessage(text)) addBotMessage(t('safety.emergency', replyLang));

    // "Something Else" means the citizen already looked at every category and
    // none fit — take their words as the incident instead of asking them to
    // pick the most relevant scenario again.
    if (isCustomIssue) {
      const custom = getScenarioById('custom_issue');
      if (custom) {
        const countLine = reportCount > 1
          ? t('bot.custom_saved_count', replyLang).replace('{count}', String(reportCount))
          : t('bot.custom_saved_first', replyLang);
        let reply = `${t('bot.custom_saved', replyLang)} ${countLine}`;
        const others = freshSuggestions
          .filter(s => s.text.trim().toLowerCase() !== heard.trim().toLowerCase())
          .slice(0, 3);
        if (others.length > 0) {
          reply += `\n\n${t('bot.also_reported_before', replyLang)}\n${others.map(s => `${s.text} ×${s.count}`).join('\n')}`;
        }
        addBotMessage(reply);
        startScenario(custom);
        return;
      }
    }

    const matches = classifyIncident(text, replyLang);
    setScenarioMatches(matches);
    if (matches.length > 0 && matches[0].confidence > 50) {
      let response = `${t('bot.scenario_match', replyLang)}:\n\n`;
      matches.forEach((m, i) => { response += `${i + 1}. ${m.scenarioName} — ${m.confidence}%\n   ${m.reason}\n\n`; });
      response += `\n${t('bot.disclaimer', replyLang)}\n\n${t('bot.select_scenario', replyLang)}`;
      addBotMessage(response);
      setStep('scenario_match');
      return;
    }

    // Keyword match was too weak — the trained matcher also understands
    // transliterated Hindi/Kannada and mixed-language phrasing, so give it a
    // shot before dropping the citizen back onto the raw category grid.
    const trained = matchTrainedScenario(text);
    const scenario = trained && trained.confidence >= 70
      ? getScenarioById(trained.scenario_id)
      : null;
    if (scenario) {
      startScenario(scenario, getScenarioName(scenario, replyLang));
      return;
    }

    addBotMessage(t('bot.select_category', replyLang));
    setStep('category_select');
  };

  const handleScenarioConfirm = (scenarioId: string) => {
    const scenario = getScenarioById(scenarioId);
    if (scenario) startScenario(scenario, getScenarioName(scenario, lang));
  };

  const handleWorkflowAnswer = async () => {
    if (!inputValue.trim() || !selectedScenario) return;
    const answer = inputValue.trim();
    const question = selectedScenario.workflow[currentQuestionIdx];
    setInputValue('');

    // Voice answers are kept exactly as spoken (place names and all), but the
    // call still identifies the language so the microphone follows along.
    if (voiceTextRef.current) {
      voiceTextRef.current = false;
      await maybeTranslateVoice(answer, false);
    }

    if (question.type === 'location') setLocation(answer);
    addUserMessage(answer);
    setAnswers(prev => ({ ...prev, [question.id]: answer }));

    // Boolean evidence trigger
    if (question.type === 'boolean' && isYesAnswer(answer)) {
      const evKeywords = ['photo', 'video', 'evidence', 'witness', 'screenshots', 'communication', 'documents', 'notices'];
      if (evKeywords.some(kw => question.id.toLowerCase().includes(kw))) {
        setTimeout(() => {
          addBotMessage(t('bot.evidence_links', lang));
          setShowEvidenceForm(true);
        }, 300);
        return;
      }
    }

    // Evidence type question
    if (question.type === 'evidence') {
      setTimeout(() => {
        addBotMessage(t('bot.evidence_links', lang));
        setShowEvidenceForm(true);
      }, 300);
      return;
    }

    moveToNextQuestion();
  };

  const handleSkipQuestion = () => {
    if (!selectedScenario) return;
    addUserMessage(t('report.skip_short', lang).replace(' →', ''));
    moveToNextQuestion();
  };

  const handleAddEvidenceLink = () => {
    if (!evidenceInput.trim()) return;
    const link = evidenceInput.trim();
    if (!link.startsWith('http')) {
      addBotMessage(t('bot.link_prompt', lang));
      return;
    }
    if (!isValidEvidenceLink(link)) {
      addBotMessage(t('bot.link_invalid', lang));
      return;
    }
    setEvidenceLinks(prev => [...prev, link]);
    setEvidenceInput('');
    addBotMessage(`${t('bot.link_added', lang)} (${evidenceLinks.length + 1})`);
  };

  const handleRemoveEvidence = (idx: number) => {
    setEvidenceLinks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDoneEvidence = () => {
    setShowEvidenceForm(false);
    moveToNextQuestion();
  };

  const handleSubmit = async () => {
    if (!selectedScenario || !sessionId) return;
    const incident = await createIncident({
      session_id: sessionId,
      category_id: selectedScenario.parent,
      subcategory: selectedScenario.id,
      original_text: originalText || answers.what_happened || '',
      structured_interpretation: '',
      ai_summary: Object.values(answers).join('. '),
      location,
      location_lat: pickedLocation?.lat,
      location_lng: pickedLocation?.lng,
      language: lang,
      answers,
      evidence_links: evidenceLinks,
      attachments,
      ai_scenario_match: selectedScenario.name,
      ai_confidence: scenarioMatches[0]?.confidence || 0,
      ai_reason: scenarioMatches[0]?.reason || '',
    });
    if (incident) {
      setIncidentId(incident.incident_id);
      addBotMessage(`${t('bot.report_created', lang)}\n\n${t('bot.track_id', lang)}: ${incident.incident_id}`);
      setStep('submitted');
    }
  };

  const handleVoiceInput = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
      setLiveTranscript('');
      return;
    }
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      addBotMessage(t('bot.voice_unsupported', lang));
      return;
    }
    const w = window as unknown as {
      webkitSpeechRecognition?: SpeechRecognitionCtor;
      SpeechRecognition?: SpeechRecognitionCtor;
    };
    const SR = w.webkitSpeechRecognition || w.SpeechRecognition;
    if (!SR) {
      addBotMessage(t('bot.voice_unsupported', lang));
      return;
    }
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = listeningLocale;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    setIsRecording(true);
    setLiveTranscript('');
    setInputValue('');
    voiceTextRef.current = false;
    recognition.start();
    let final = '';
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (final.trim()) voiceTextRef.current = true;
      setInputValue(final + interim);
      setLiveTranscript(interim);
    };
    recognition.onerror = (e: { error: string }) => {
      if (e.error === 'not-allowed') {
        setIsRecording(false);
        addBotMessage(t('bot.mic_denied', lang));
      } else if (e.error === 'no-speech') {
        // Auto-restart on no-speech (silence timeout)
        if (recognitionRef.current) {
          try { recognition.start(); } catch {}
        }
      } else if (e.error === 'network') {
        setIsRecording(false);
        recognitionRef.current = null;
        addBotMessage(t('bot.try_again', lang));
      } else if (e.error !== 'aborted') {
        setIsRecording(false);
        addBotMessage(t('bot.try_again', lang));
      }
    };
    recognition.onend = () => {
      // Auto-restart if still recording (browser auto-stops after silence)
      if (recognitionRef.current) {
        try { recognition.start(); } catch {}
      } else {
        setIsRecording(false);
        setLiveTranscript('');
      }
    };
  };

  const currentQuestion = selectedScenario?.workflow[currentQuestionIdx];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700" aria-label="Back to homepage"><ArrowLeft size={20} /></button>
            <button onClick={() => router.push('/')} title="Go to homepage" aria-label="Go to homepage" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-xs">NS</div>
              <span className="font-semibold text-gray-900">Namma Samasye</span>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => router.push('/')} title="Go to homepage" aria-label="Go to homepage" className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
              <Home size={16} />
              <span className="text-xs font-medium">{t('nav.home', lang)}</span>
            </button>
            <button onClick={() => setShowLangSwitch(!showLangSwitch)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Globe size={18} /></button>
          </div>
        </div>
        {showLangSwitch && (
          <div className="border-t border-gray-100 px-4 py-2 flex gap-2 bg-white">
            {(['kn', 'en', 'hi', 'te'] as Language[]).map(l => (
              <button key={l} onClick={() => { setLang(l); setStoredLanguage(l); setVoiceOverride(speechLocale(l)); setShowLangSwitch(false); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${lang === l ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {l === 'kn' ? 'ಕನ್ನಡ' : l === 'hi' ? 'हिन्दी' : l === 'te' ? 'తెలుగు' : 'English'}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Chat Area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
              msg.role === 'user' ? 'gradient-bg text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
            }`}>{msg.text}</div>
          </div>
        ))}

        {/* SELECT type options — show clickable buttons */}
        {step === 'workflow' && currentQuestion?.type === 'select' && currentQuestion.options && !showCustomInput && (
          <div className="grid grid-cols-2 gap-2">
            {currentQuestion.options.map(opt => (
              <button key={opt.value} onClick={() => {
                if (opt.value === 'other') {
                  setShowCustomInput(true);
                  return;
                }
                const answer = opt.label[lang] || opt.label.en;
                addUserMessage(answer);
                const q = selectedScenario!.workflow[currentQuestionIdx];
                setAnswers(prev => ({ ...prev, [q.id]: opt.value }));
                moveToNextQuestion();
              }}
                className="text-left p-3 rounded-xl bg-white border border-gray-200 hover:border-primary hover:shadow-md transition text-sm">
                {opt.label[lang] || opt.label.en}
              </button>
            ))}
          </div>
        )}

        {/* CUSTOM INPUT — when Other is selected */}
        {step === 'workflow' && currentQuestion?.type === 'select' && showCustomInput && (
          <div className="flex gap-2">
            <input
              type="text"
              value={customInputValue}
              onChange={e => setCustomInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customInputValue.trim()) {
                  addUserMessage(customInputValue.trim());
                  const q = selectedScenario!.workflow[currentQuestionIdx];
                  setAnswers(prev => ({ ...prev, [q.id]: customInputValue.trim() }));
                  setCustomInputValue('');
                  setShowCustomInput(false);
                  moveToNextQuestion();
                }
              }}
              placeholder={currentQuestion.id === 'department' ? t('input.department', lang) : t('input.type_answer', lang)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
              autoFocus
            />
            <button onClick={() => {
              if (customInputValue.trim()) {
                addUserMessage(customInputValue.trim());
                const q = selectedScenario!.workflow[currentQuestionIdx];
                setAnswers(prev => ({ ...prev, [q.id]: customInputValue.trim() }));
                setCustomInputValue('');
                setShowCustomInput(false);
                moveToNextQuestion();
              }
            }}
              disabled={!customInputValue.trim()}
              className="px-4 py-3 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40">
              <Send size={20} />
            </button>
            <button onClick={() => { setShowCustomInput(false); setCustomInputValue(''); }}
              className="px-3 py-3 rounded-xl bg-gray-100 text-gray-500 text-sm hover:bg-gray-200 transition">
              {t('btn.back', lang)}
            </button>
          </div>
        )}

        {/* BOOLEAN type — show Yes/No buttons */}
        {step === 'workflow' && currentQuestion?.type === 'boolean' && (
          <div className="flex gap-2">
            <button onClick={() => {
              const answer = t('btn.yes', lang);
              addUserMessage(answer);
              const q = selectedScenario!.workflow[currentQuestionIdx];
              setAnswers(prev => ({ ...prev, [q.id]: answer }));
              const evKeywords = ['photo', 'video', 'evidence', 'witness', 'screenshots', 'communication', 'documents', 'notices'];
              if (evKeywords.some(kw => q.id.toLowerCase().includes(kw))) {
                setTimeout(() => {
                  addBotMessage(t('bot.evidence_links_short', lang));
                  setShowEvidenceForm(true);
                }, 300);
                return;
              }
              moveToNextQuestion();
            }}
              className="flex-1 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 font-medium text-sm hover:bg-green-100 transition">
              {t('btn.yes', lang)}
            </button>
            <button onClick={() => {
              const answer = t('btn.no', lang);
              addUserMessage(answer);
              const q = selectedScenario!.workflow[currentQuestionIdx];
              setAnswers(prev => ({ ...prev, [q.id]: answer }));
              moveToNextQuestion();
            }}
              className="flex-1 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium text-sm hover:bg-red-100 transition">
              {t('btn.no', lang)}
            </button>
          </div>
        )}

        {/* Location picker — map with search, current location and pin drop */}
        {showLocationPicker && step === 'workflow' && (
          <div className="mt-2">
            <LocationPicker
              lang={lang}
              initial={pickedLocation}
              onPick={loc => handleLocationPicked(loc)}
              onCancel={() => handleLocationPicked(null)}
            />
          </div>
        )}

        {/* INLINE Evidence Form — appears right after evidence question */}
        {showEvidenceForm && step === 'workflow' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📎</span>
              <span className="font-bold text-amber-900 text-sm">{t('evidence.add', lang)}</span>
            </div>

            {/* Evidence type badges */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-amber-200 text-[10px] font-medium text-amber-800">📸 {t('evidence.photo', lang)}</span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-amber-200 text-[10px] font-medium text-amber-800">🎥 {t('evidence.video', lang)}</span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-amber-200 text-[10px] font-medium text-amber-800">📄 {t('evidence.document', lang)}</span>
            </div>

            {/* Upload from device / gallery */}
            <div className="bg-white rounded-xl p-3 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-800">{t('evidence.upload_device', lang)}</span>
                <FileUploader attachments={attachments} onChange={setAttachments} compact />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">{t('evidence.formats', lang)}</p>
            </div>

            {/* Link input */}
            <div className="flex gap-2">
              <input
                type="url"
                value={evidenceInput}
                onChange={e => setEvidenceInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddEvidenceLink()}
                placeholder={t('evidence.link_placeholder', lang)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-amber-200 text-sm focus:border-primary outline-none bg-white"
              />
              <button onClick={handleAddEvidenceLink}
                disabled={!evidenceInput.trim()}
                className="px-3 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-40">
                <Plus size={18} />
              </button>
            </div>

            {/* Added links */}
            {evidenceLinks.length > 0 && (
              <div className="space-y-1.5">
                {evidenceLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-green-200">
                    <Link2 size={12} className="text-green-600 flex-shrink-0" />
                    <span className="text-[11px] text-green-700 truncate flex-1">{link}</span>
                    <button onClick={() => handleRemoveEvidence(i)} className="text-green-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Supported platforms */}
            <div className="bg-white rounded-xl p-2.5 border border-amber-100">
              <p className="text-[10px] text-amber-800 font-bold mb-1.5">{t('evidence.supported', lang)}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {supportedPlatforms.map(p => (
                  <span key={p.name} className="text-[9px] text-gray-500">{p.icon} {p.name}</span>
                ))}
              </div>
              <p className="text-[9px] text-red-400 mt-1">{t('evidence.blocked_platforms', lang)}</p>
            </div>

            {/* Done button */}
            <button onClick={handleDoneEvidence}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition">
              {(evidenceLinks.length > 0 || attachments.length > 0)
                ? t('evidence.continue_with', lang)
                    .replace('{links}', String(evidenceLinks.length))
                    .replace('{files}', String(attachments.length))
                : t('evidence.skip_none', lang)}
            </button>
          </div>
        )}

        {/* Category Buttons */}
        {step === 'category_select' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            {categoryButtons.map(cb => (
              <button key={cb.id} onClick={() => handleCategorySelect(cb.id)}
                className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-200 hover:border-primary hover:shadow-md transition text-left text-sm">
                <span className="text-xl">{cb.icon}</span>
                <span className="text-gray-700 text-xs font-medium">{categoryLabel(cb, lang)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Scenario Match */}
        {step === 'scenario_match' && scenarioMatches.length > 0 && (
          <div className="space-y-2 mt-4">
            {scenarioMatches.map(m => (
              <button key={m.scenarioId} onClick={() => handleScenarioConfirm(m.scenarioId)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:border-primary hover:shadow-md transition">
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-sm">{m.scenarioName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t('match.confidence', lang).replace('{count}', String(m.confidence))}</div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            ))}
          </div>
        )}

        {/* Review */}
        {step === 'review' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-gray-900">{t('report.review', lang)}</h3>
            {selectedScenario && <div className="text-sm text-gray-600"><span className="font-medium">{t('report.category', lang)}:</span> {selectedScenario.name}</div>}
            {originalText && <div className="text-sm text-gray-600"><span className="font-medium">{t('report.description', lang)}:</span> {originalText}</div>}
            {location && <div className="text-sm text-gray-600 flex items-center gap-1"><MapPin size={14} /> {location}</div>}
            {Object.entries(answers).map(([k, v]) => {
              const q = selectedScenario?.workflow.find(w => w.id === k);
              const label = q ? (q.text[lang] || q.text.en).replace(/\?+$/, '') : k.replace(/_/g, ' ');
              return (
                <div key={k} className="text-sm text-gray-600"><span className="font-medium">{label}</span>: {v}</div>
              );
            })}
            {evidenceLinks.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{t('review.evidence_links', lang)} ({evidenceLinks.length}):</span>
                <div className="mt-1 space-y-1">
                  {evidenceLinks.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline truncate">{link}</a>
                  ))}
                </div>
              </div>
            )}

            {/* Photo / video attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{t('review.photos_videos', lang)} ({attachments.length})</span>
                <button onClick={() => setShowEvidenceUploader(!showEvidenceUploader)} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Paperclip size={12} /> {showEvidenceUploader ? t('btn.done', lang) : t('review.attach_file', lang)}
                </button>
              </div>
              {showEvidenceUploader ? (
                <FileUploader attachments={attachments} onChange={setAttachments} />
              ) : (
                <p className="text-[11px] text-gray-400">
                  {attachments.length === 0
                    ? t('review.no_files', lang)
                    : t('review.files_attached', lang).replace('{count}', String(attachments.length))}
                </p>
              )}
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">{t('evidence.warning', lang)}</div>
            <button
              onClick={() => {
                addBotMessage(t('bot.final_step', lang));
                setStep('safety_review');
              }}
              className="w-full gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} /> {t('review.continue_safety', lang)}
            </button>
          </div>
        )}

        {/* SAFETY FINAL REVIEW — required before the report is submitted */}
        {step === 'safety_review' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{lang === 'kn' ? 'ಸುರಕ್ಷಾ ಅಂತಿಮ ಪರಿಶೀಲನೆ' : lang === 'hi' ? 'सुरक्षा अंतिम समीक्षा' : lang === 'te' ? 'భద్రతా తుది సమీక్ష' : 'Safety Final Review'}</h3>
                <p className="text-[11px] text-gray-500">
                  {lang === 'kn' ? 'ವರದಿ ಸಲ್ಲಿಸುವ ಮೊದಲು ಕೆಳಗಿನ ಮೂರು ಪಾಯಿಂಟ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ' : lang === 'hi' ? 'रिपोर्ट भेजने से पहले तीनों बिंदुओं की जाँच करें' : lang === 'te' ? 'నివేదిక పంపే ముందు మూడు అంశాలు తనిఖీ చేయండి' : 'Check all three before your report is submitted'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                {
                  en: 'Photos and videos do not show my personal details (Aadhaar, bank card, phone number, address).',
                  kn: 'ಚಿತ್ರ/ವೀಡಿಯೊಗಳಲ್ಲಿ ನನ್ನ ವೈಯಕ್ತಿಕ ವಿವರಗಳಿಲ್ಲ (ಆಧಾರ್, ಬ್ಯಾಂಕ್, ಫೋನ್).',
                  hi: 'फोटो/वीडियो में मेरी निजी जानकारी नहीं है (आधार, बैंक, फ़ोन).',
                  te: 'ఫోటో/వీడియోలో నా వ్యక్తిగత వివరాలు లేవు (ఆధార్, బ్యాంక్, ఫోన్).',
                },
                {
                  en: 'This report is true to the best of my knowledge — I have not exaggerated or invented anything.',
                  kn: 'ಈ ವರದಿ ನನಗೆ ತಿಳಿದಂತೆ ಸತ್ಯ — ನಾನು ಏನನ್ನೂ ಅತಿಶಯೋಕ್ತಿ ಮಾಡಿಲ್ಲ.',
                  hi: 'यह रिपोर्ट मेरी जानकारी के अनुसार सच है — मैंने कुछ भी बढ़ा-चढ़ाकर या गलत नहीं लिखा।',
                  te: 'ఈ నివేదిక నాకు తెలిసినంత వరకు నిజం — ఏదీ అతిశయోక్తి లేదా అబద్ధం కాదు.',
                },
                {
                  en: 'I understand the evidence I attached will be reviewed by a human moderator.',
                  kn: 'ನಾನು ಸಂಲಗ್ಳಿಸಿದ ಸಾಕ್ಷ್ಯವನ್ನು ಮಾನವ ಪರಿಶೀಲಕರು ನೋಡುತ್ತಾರೆ ಎಂದು ತಿಳಿದಿದೆ.',
                  hi: 'मैं समझता/समझती हूँ कि मेरा सबूत एक इंसानी मॉडरेटर देखेगा।',
                  te: 'నేను జోడించిన ఆధారాన్ని మానవ సమీక్షకుడు చూస్తాడని అర్థం చేసుకున్నాను.',
                },
              ].map((item, i) => {
                const label = item[lang] || item.en;
                const checked = safetyChecked[i];
                return (
                  <button
                    key={i}
                    onClick={() => setSafetyChecked(prev => prev.map((v, idx) => idx === i ? !v : v))}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                      checked ? 'bg-emerald-50 border-emerald-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-5 h-5 mt-0.5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition ${
                      checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-300'
                    }`}>
                      {checked && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className="text-[13px] leading-snug text-gray-700">{label}</span>
                  </button>
                );
              })}
            </div>

            {isEmergencyMessage(originalText || answers.what_happened || '') && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                ⚠️ {t('safety.emergency', lang)}
              </div>
            )}

            <div className="text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
              {attachments.length > 0 && <div className="mb-1">{t('safety.attached_count', lang).replace('{count}', String(attachments.length))}</div>}
              {evidenceLinks.length > 0 && <div className="mb-1">{t('safety.links_count', lang).replace('{count}', String(evidenceLinks.length))}</div>}
              {Object.keys(answers).length > 0 && <div>{t('safety.answers_count', lang).replace('{count}', String(Object.keys(answers).length))}</div>}
              {!location && <div>{t('safety.no_location', lang)}</div>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('review')}
                className="px-4 py-3 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                {t('btn.back', lang)}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!safetyChecked.every(Boolean)}
                className="flex-1 gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShieldCheck size={17} />
                {safetyChecked.every(Boolean)
                  ? (lang === 'kn' ? 'ವರದಿ ಸಲ್ಲಿಸಿ' : lang === 'hi' ? 'रिपोर्ट भेजें' : lang === 'te' ? 'నివేదిక పంపండి' : 'Submit Report')
                  : (lang === 'kn' ? 'ಮೂರೂ ಪಾಯಿಂಟ್ ಪರಿಶೀಲಿಸಿ' : lang === 'hi' ? 'तीनों जाँचें' : lang === 'te' ? 'మూడు తనిఖీ చేయండి' : 'Confirm all 3 items')}
              </button>
            </div>
          </div>
        )}

        {/* Submitted */}
        {step === 'submitted' && (
          <div className="bg-white border border-green-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">{t('report.report_submitted', lang)}</h3>
            <div className="text-2xl font-mono font-bold text-primary mb-2">{incidentId}</div>
            <p className="text-sm text-gray-500 mb-4">{t('report.save_id', lang)}</p>
            <button onClick={() => router.push(`/track/${incidentId}`)} className="px-6 py-2 rounded-xl border border-primary text-primary font-medium hover:bg-primary hover:text-white transition text-sm">{t('report.track_incident', lang)}</button>
          </div>
        )}
      </div>

      {/* Input Area */}
      {step !== 'submitted' && step !== 'review' && step !== 'safety_review' && !showEvidenceForm && !showLocationPicker && (
        <div className="sticky bottom-0 glass border-t border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-3">
            {isRecording && (
              <div className="mb-2 p-3 rounded-xl bg-red-50 border-2 border-red-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-600 font-medium">{t('bot.listening', lang)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                      🎤 {voiceLabel(listeningLocale)}
                    </span>
                  </div>
                  <button onClick={handleVoiceInput}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition flex items-center gap-1.5">
                    <Square size={10} fill="currentColor" /> {t('btn.stop', lang)}
                  </button>
                </div>
                {liveTranscript && (
                  <div className="text-sm text-red-800 italic bg-red-100 rounded-lg px-3 py-2 border border-red-200">
                    {liveTranscript}
                  </div>
                )}
              </div>
            )}

            {step === 'workflow' && currentQuestion?.type === 'location' && (
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{t('report.location_optional', lang)}</span>
                <button onClick={handleSkipQuestion} className="text-[10px] text-primary hover:underline font-medium">{t('report.skip_short', lang)}</button>
              </div>
            )}

            {step === 'free_text' && customSuggestions.length > 0 && (
              <div className="mb-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                  {t('bot.people_also_reported', lang)}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {customSuggestions.map(s => (
                    <button
                      key={s.text}
                      onClick={() => { setInputValue(s.text); inputRef.current?.focus(); }}
                      className="max-w-full truncate text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-primary hover:text-primary transition"
                    >
                      {s.text}
                      <span className="ml-1.5 text-[10px] font-semibold text-gray-400">×{s.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button onClick={handleVoiceInput}
                className={`p-3 rounded-xl transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <input ref={inputRef} type="text" value={inputValue}
                onChange={e => { voiceTextRef.current = false; setInputValue(e.target.value); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (step === 'free_text') handleFreeTextSubmit();
                    else if (step === 'workflow') handleWorkflowAnswer();
                    else if (inputValue.trim()) handleFreeTextSubmit();
                  }
                }}
                placeholder={
                  step === 'free_text' ? t('bot.ask_what_happened', lang) :
                  step === 'workflow' && currentQuestion ? (currentQuestion.text[lang] || currentQuestion.text.en) :
                  t('input.type_message', lang)
                }
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
              />
              <button onClick={() => {
                  if (step === 'free_text') handleFreeTextSubmit();
                  else if (step === 'workflow') handleWorkflowAnswer();
                  else if (inputValue.trim()) handleFreeTextSubmit();
                }}
                disabled={!inputValue.trim()}
                className="p-3 rounded-xl gradient-bg text-white hover:opacity-90 transition disabled:opacity-40">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
