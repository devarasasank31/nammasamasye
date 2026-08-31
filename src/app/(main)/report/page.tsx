'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Language, IncidentCategory } from '@/types';
import { getStoredLanguage, setStoredLanguage, getOrCreateSession } from '@/services/session';
import { scenarios, getScenarioById } from '@/data/scenarios';
import { classifyIncident, isEmergencyMessage } from '@/ai/classify';
import { t } from '@/lib/translations';
import { createIncident } from '@/services/incident';
import { Send, Mic, MicOff, ArrowLeft, Globe, ChevronRight, MapPin, HelpCircle, X, Square, Link2, Plus } from 'lucide-react';

type Step = 'greeting' | 'category_select' | 'free_text' | 'scenario_match' | 'workflow' | 'review' | 'submitted';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

const categoryButtons = [
  { id: 'traffic_accident', icon: '🚗', label: 'Traffic / Accident' },
  { id: 'traffic_pothole', icon: '🕳️', label: 'Pothole / Road Damage' },
  { id: 'civic_garbage', icon: '🗑️', label: 'Garbage' },
  { id: 'traffic_parking', icon: '🅿️', label: 'Illegal Parking' },
  { id: 'civic_streetlight', icon: '💡', label: 'Streetlight' },
  { id: 'civic_footpath', icon: '🚶', label: 'Footpath Issue' },
  { id: 'civic_drainage', icon: '🚰', label: 'Drainage / Water Logging' },
  { id: 'civic_parks', icon: '🌳', label: 'Parks & Gardens' },
  { id: 'civic_water_supply', icon: '💧', label: 'Water Supply' },
  { id: 'civic_stray_animals', icon: '🐕', label: 'Stray Animals' },
  { id: 'traffic_interaction', icon: '👮', label: 'Police / Traffic Interaction' },
  { id: 'unofficial_payment', icon: '💰', label: 'Unofficial Payment' },
  { id: 'safety_harassment', icon: '🛡️', label: 'Safety / Harassment' },
  { id: 'cybercrime', icon: '💻', label: 'Cybercrime' },
  { id: 'housing_tenant', icon: '🏠', label: 'Tenant / Landlord' },
  { id: 'env_noise', icon: '🔊', label: 'Noise Pollution' },
  { id: 'util_power', icon: '⚡', label: 'Power Outage' },
  { id: 'access_language', icon: '🌐', label: 'Language Barrier' },
  { id: 'govt_service', icon: '📄', label: 'Government Service' },
  { id: 'something_else', icon: '❓', label: 'Something Else' },
];

const supportedPlatforms = [
  { name: 'Google Drive', icon: '📁' },
  { name: 'YouTube', icon: '🎥' },
  { name: 'Imgur', icon: '📷' },
  { name: 'Dropbox', icon: '📦' },
  { name: 'OneDrive', icon: '☁️' },
  { name: 'MediaFire', icon: '📂' },
];

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

export default function ReportPage() {
  const router = useRouter();
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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
  const [incidentId, setIncidentId] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [showLangSwitch, setShowLangSwitch] = useState(false);

  useEffect(() => {
    const stored = getStoredLanguage();
    setLang(stored);
    initSession();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, showEvidenceForm]);

  const initSession = async () => {
    const session = await getOrCreateSession();
    setSessionId(session.id);
    addBotMessage(t('bot.greeting', lang));
    setTimeout(() => setStep('category_select'), 500);
  };

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

  const moveToNextQuestion = () => {
    if (!selectedScenario) return;
    setShowEvidenceForm(false);
    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < selectedScenario.workflow.length) {
      setCurrentQuestionIdx(nextIdx);
      const nextQ = selectedScenario.workflow[nextIdx];
      setTimeout(() => {
        addBotMessage(nextQ.text[lang] || nextQ.text.en);
        // Show evidence form if next question is evidence type
        if (nextQ.type === 'evidence') {
          setTimeout(() => setShowEvidenceForm(true), 300);
        }
      }, 300);
    } else {
      setTimeout(() => {
        addBotMessage(t('bot.review_before_submit', lang));
        setStep('review');
      }, 300);
    }
  };

  const isYesAnswer = (answer: string) => {
    const lower = answer.toLowerCase().trim();
    return lower === 'yes' || lower === 'ಹೌದು' || lower === 'हाँ' || lower === 'हूँ' || lower === 'అవును';
  };

  const handleCategorySelect = (scenarioId: string) => {
    if (scenarioId === 'something_else') {
      addUserMessage("Something Else");
      addBotMessage("Please describe your issue in detail.");
      setStep('free_text');
      return;
    }
    const scenario = getScenarioById(scenarioId);
    if (scenario) {
      setSelectedScenario(scenario);
      addUserMessage(scenario.name);
      const firstQ = scenario.workflow[0];
      if (firstQ) {
        addBotMessage(firstQ.text[lang] || firstQ.text.en);
        setStep('workflow');
        setCurrentQuestionIdx(0);
        if (firstQ.type === 'evidence') {
          setTimeout(() => setShowEvidenceForm(true), 300);
        }
      }
    } else {
      addBotMessage("Please describe your issue in detail.");
      setStep('free_text');
    }
  };

  const handleFreeTextSubmit = async () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    setOriginalText(text);
    addUserMessage(text);
    if (isEmergencyMessage(text)) addBotMessage(t('safety.emergency', lang));
    const matches = classifyIncident(text, lang);
    setScenarioMatches(matches);
    if (matches.length > 0 && matches[0].confidence > 50) {
      let response = `${t('bot.scenario_match', lang)}:\n\n`;
      matches.forEach((m, i) => { response += `${i + 1}. ${m.scenarioName} — ${m.confidence}%\n   ${m.reason}\n\n`; });
      response += `\n${t('bot.disclaimer', lang)}\n\nPlease select the most relevant scenario.`;
      addBotMessage(response);
      setStep('scenario_match');
    } else {
      addBotMessage("Please select the most relevant category below.");
      setStep('category_select');
    }
  };

  const handleScenarioConfirm = (scenarioId: string) => {
    const scenario = getScenarioById(scenarioId);
    if (scenario) {
      setSelectedScenario(scenario);
      addUserMessage(scenario.name);
      const firstQ = scenario.workflow[0];
      if (firstQ) {
        addBotMessage(firstQ.text[lang] || firstQ.text.en);
        setStep('workflow');
        setCurrentQuestionIdx(0);
        if (firstQ.type === 'evidence') {
          setTimeout(() => setShowEvidenceForm(true), 300);
        }
      }
    }
  };

  const handleWorkflowAnswer = () => {
    if (!inputValue.trim() || !selectedScenario) return;
    const answer = inputValue.trim();
    const question = selectedScenario.workflow[currentQuestionIdx];
    setInputValue('');
    if (question.type === 'location') setLocation(answer);
    addUserMessage(answer);
    setAnswers(prev => ({ ...prev, [question.id]: answer }));

    // Boolean evidence trigger
    if (question.type === 'boolean' && isYesAnswer(answer)) {
      const evKeywords = ['photo', 'video', 'evidence', 'witness', 'screenshots', 'communication', 'documents', 'notices'];
      if (evKeywords.some(kw => question.id.toLowerCase().includes(kw))) {
        setTimeout(() => {
          addBotMessage("📎 Paste your evidence links below. You can add multiple links.");
          setShowEvidenceForm(true);
        }, 300);
        return;
      }
    }

    // Evidence type question
    if (question.type === 'evidence') {
      setTimeout(() => {
        addBotMessage("📎 Paste your evidence links below. You can add multiple links.");
        setShowEvidenceForm(true);
      }, 300);
      return;
    }

    moveToNextQuestion();
  };

  const handleSkipQuestion = () => {
    if (!selectedScenario) return;
    addUserMessage("Skip");
    moveToNextQuestion();
  };

  const handleAddEvidenceLink = () => {
    if (!evidenceInput.trim()) return;
    const link = evidenceInput.trim();
    if (!link.startsWith('http')) {
      addBotMessage('❌ Please paste a link starting with http:// or https://');
      return;
    }
    if (!isValidEvidenceLink(link)) {
      addBotMessage('❌ Invalid link. Use: Google Drive, YouTube, Imgur, Dropbox, OneDrive, or MediaFire.');
      return;
    }
    setEvidenceLinks(prev => [...prev, link]);
    setEvidenceInput('');
    addBotMessage(`✅ Link added (${evidenceLinks.length + 1} total)`);
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
      language: lang,
      answers,
      evidence_links: evidenceLinks,
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
      addBotMessage('Voice input not supported. Please type.');
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = true;
    setIsRecording(true);
    setLiveTranscript('');
    setInputValue('');
    recognition.start();
    let final = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setInputValue(final + interim);
      setLiveTranscript(interim);
    };
    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setIsRecording(false);
        addBotMessage('Microphone access denied.');
      } else if (e.error === 'no-speech') {
        // Auto-restart on no-speech (silence timeout)
        if (recognitionRef.current) {
          try { recognition.start(); } catch {}
        }
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
            <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></button>
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-xs">NS</div>
            <span className="font-semibold text-gray-900">Namma Samasye</span>
          </div>
          <button onClick={() => setShowLangSwitch(!showLangSwitch)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Globe size={18} /></button>
        </div>
        {showLangSwitch && (
          <div className="border-t border-gray-100 px-4 py-2 flex gap-2 bg-white">
            {(['kn', 'en', 'hi', 'te'] as Language[]).map(l => (
              <button key={l} onClick={() => { setLang(l); setStoredLanguage(l); setShowLangSwitch(false); }}
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

        {/* INLINE Evidence Form — appears right after evidence question */}
        {showEvidenceForm && step === 'workflow' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📎</span>
              <span className="font-bold text-amber-900 text-sm">{t('evidence.add', lang)}</span>
            </div>

            {/* Evidence type badges */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-amber-200 text-[10px] font-medium text-amber-800">📸 Photo</span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-amber-200 text-[10px] font-medium text-amber-800">🎥 Video</span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-amber-200 text-[10px] font-medium text-amber-800">📄 Document</span>
            </div>

            {/* Link input */}
            <div className="flex gap-2">
              <input
                type="url"
                value={evidenceInput}
                onChange={e => setEvidenceInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddEvidenceLink()}
                placeholder="Paste Google Drive / Imgur / YouTube link..."
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
              <p className="text-[10px] text-amber-800 font-bold mb-1.5">📌 Supported:</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {supportedPlatforms.map(p => (
                  <span key={p.name} className="text-[9px] text-gray-500">{p.icon} {p.name}</span>
                ))}
              </div>
              <p className="text-[9px] text-red-400 mt-1">❌ LinkedIn, Facebook, Twitter, Instagram not supported</p>
            </div>

            {/* Done button */}
            <button onClick={handleDoneEvidence}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition">
              {evidenceLinks.length > 0 ? `Continue with ${evidenceLinks.length} link(s)` : 'Skip — No evidence'}
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
                <span className="text-gray-700 text-xs font-medium">{cb.label}</span>
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
                  <div className="text-xs text-gray-500 mt-0.5">{m.confidence}% confidence</div>
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
            {Object.entries(answers).map(([k, v]) => (
              <div key={k} className="text-sm text-gray-600"><span className="font-medium capitalize">{k.replace(/_/g, ' ')}:</span> {v}</div>
            ))}
            {evidenceLinks.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Evidence ({evidenceLinks.length}):</span>
                <div className="mt-1 space-y-1">
                  {evidenceLinks.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline truncate">{link}</a>
                  ))}
                </div>
              </div>
            )}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">{t('evidence.warning', lang)}</div>
            <button onClick={handleSubmit} className="w-full gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90 transition">{t('report.submit', lang)}</button>
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
      {step !== 'submitted' && step !== 'review' && !showEvidenceForm && (
        <div className="sticky bottom-0 glass border-t border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-3">
            {isRecording && (
              <div className="mb-2 p-3 rounded-xl bg-red-50 border-2 border-red-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-600 font-medium">Listening... Speak now</span>
                  </div>
                  <button onClick={handleVoiceInput}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition flex items-center gap-1.5">
                    <Square size={10} fill="currentColor" /> Stop
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
                <span className="text-[10px] text-gray-400">📍 Location is optional — geo-tagged photos show location</span>
                <button onClick={handleSkipQuestion} className="text-[10px] text-primary hover:underline font-medium">Skip →</button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button onClick={handleVoiceInput}
                className={`p-3 rounded-xl transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <input ref={inputRef} type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
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
                  'Type a message...'
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
