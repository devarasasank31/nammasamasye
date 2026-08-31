'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Language, IncidentCategory } from '@/types';
import { getStoredLanguage, setStoredLanguage, getOrCreateSession } from '@/services/session';
import { scenarios, getScenarioById } from '@/data/scenarios';
import { classifyIncident, isEmergencyMessage } from '@/ai/classify';
import { t } from '@/lib/translations';
import { createIncident } from '@/services/incident';
import { Send, Mic, ArrowLeft, Globe, ChevronRight, MapPin, Link2, Image, HelpCircle, X } from 'lucide-react';

type Step = 'greeting' | 'category_select' | 'free_text' | 'scenario_match' | 'workflow' | 'evidence_collect' | 'review' | 'submitted';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

const categoryButtons = [
  { id: 'traffic_accident', icon: '🚗', label: 'Traffic / Accident' },
  { id: 'civic_pothole', icon: '🕳️', label: 'Pothole / Road Damage' },
  { id: 'civic_garbage', icon: '🗑️', label: 'Garbage' },
  { id: 'traffic_parking', icon: '🅿️', label: 'Illegal Parking' },
  { id: 'civic_streetlight', icon: '💡', label: 'Streetlight' },
  { id: 'traffic_interaction', icon: '👮', label: 'Police / Traffic Interaction' },
  { id: 'unofficial_payment', icon: '💰', label: 'Unofficial Payment' },
  { id: 'safety_harassment', icon: '🛡️', label: 'Safety / Harassment' },
  { id: 'cybercrime', icon: '💻', label: 'Cybercrime' },
  { id: 'housing_tenant', icon: '🏠', label: 'Tenant / Landlord' },
  { id: 'env_noise', icon: '🔊', label: 'Noise Pollution' },
  { id: 'util_power', icon: '⚡', label: 'Power Outage' },
  { id: 'civic_footpath', icon: '🚶', label: 'Footpath Issue' },
  { id: 'civic_drainage', icon: '🚰', label: 'Drainage' },
  { id: 'access_language', icon: '🌐', label: 'Language Barrier' },
  { id: 'govt_service', icon: '📄', label: 'Government Service' },
  { id: 'something_else', icon: '❓', label: 'Something Else' },
];

const evidenceGuideSteps = [
  { step: 1, text: 'Open Google Drive (drive.google.com) or any cloud storage' },
  { step: 2, text: 'Upload your photo/video/screenshot' },
  { step: 3, text: 'Right-click the file → "Share" → "Get link"' },
  { step: 4, text: 'Set access to "Anyone with the link"' },
  { step: 5, text: 'Copy the link and paste it here' },
];

export default function ReportPage() {
  const router = useRouter();
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [lang, setLang] = useState<Language>('en');
  const [step, setStep] = useState<Step>('greeting');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<IncidentCategory | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [scenarioMatches, setScenarioMatches] = useState<{ scenarioId: string; scenarioName: string; confidence: number; reason: string }[]>([]);
  const [incidentId, setIncidentId] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showLangSwitch, setShowLangSwitch] = useState(false);
  const [showEvidenceGuide, setShowEvidenceGuide] = useState(false);
  const [pendingEvidenceQuestion, setPendingEvidenceQuestion] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredLanguage();
    setLang(stored);
    initSession();
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

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
    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < selectedScenario.workflow.length) {
      setCurrentQuestionIdx(nextIdx);
      const nextQ = selectedScenario.workflow[nextIdx];
      setTimeout(() => {
        addBotMessage(nextQ.text[lang] || nextQ.text.en);
      }, 300);
    } else {
      setTimeout(() => {
        addBotMessage(t('bot.review_before_submit', lang));
        setStep('review');
      }, 300);
    }
  };

  const handleCategorySelect = (scenarioId: string) => {
    if (scenarioId === 'something_else') {
      addUserMessage(t('bot.ask_what_happened', lang));
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
      }
    }
  };

  const handleFreeTextSubmit = async () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    setOriginalText(text);
    addUserMessage(text);

    if (isEmergencyMessage(text)) {
      addBotMessage(t('safety.emergency', lang));
    }

    const matches = classifyIncident(text, lang);
    setScenarioMatches(matches);

    if (matches.length > 0 && matches[0].confidence > 50) {
      let response = `${t('bot.scenario_match', lang)}:\n\n`;
      matches.forEach((m, i) => {
        response += `${i + 1}. ${m.scenarioName} — ${m.confidence}%\n   ${m.reason}\n\n`;
      });
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
      }
    }
  };

  const handleWorkflowAnswer = () => {
    if (!inputValue.trim() || !selectedScenario) return;

    const answer = inputValue.trim();
    const question = selectedScenario.workflow[currentQuestionIdx];
    setInputValue('');

    if (question.type === 'location') {
      setLocation(answer);
    }

    addUserMessage(answer);
    setAnswers(prev => ({ ...prev, [question.id]: answer }));

    // If this is a boolean evidence question and user said "yes", collect evidence
    if (question.type === 'boolean' && (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'ಹೌದು' || answer.toLowerCase() === 'हाँ' || answer.toLowerCase() === 'అవును')) {
      const hasEvidenceQ = selectedScenario.workflow.find(q => q.type === 'evidence');
      if (hasEvidenceQ) {
        setPendingEvidenceQuestion(hasEvidenceQ.id);
        setTimeout(() => {
          addBotMessage("Great! Please paste a link to your evidence (photo, video, or document).\n\nTap the guide button below for help on how to share a link.");
          setStep('evidence_collect');
        }, 300);
        return;
      }
    }

    // If the question itself is evidence type
    if (question.type === 'evidence') {
      if (answer.startsWith('http')) {
        setEvidenceLinks(prev => [...prev, answer]);
        setTimeout(() => addBotMessage('Evidence link added!'), 300);
      }
      moveToNextQuestion();
      return;
    }

    moveToNextQuestion();
  };

  const handleEvidenceLinkSubmit = () => {
    if (!inputValue.trim()) return;
    const link = inputValue.trim();
    setInputValue('');

    if (link.startsWith('http')) {
      setEvidenceLinks(prev => [...prev, link]);
      addUserMessage(link);
      addBotMessage('Evidence link added! You can add more links or continue.');

      // Check if there are more evidence questions
      if (selectedScenario) {
        const nextEvidenceQ = selectedScenario.workflow.find(
          (q, idx) => q.type === 'evidence' && idx > currentQuestionIdx
        );
        if (nextEvidenceQ) {
          setCurrentQuestionIdx(selectedScenario.workflow.indexOf(nextEvidenceQ));
          setTimeout(() => addBotMessage(nextEvidenceQ.text[lang] || nextEvidenceQ.text.en), 300);
          return;
        }
      }
      // No more evidence questions, move to review
      setTimeout(() => {
        addBotMessage(t('bot.review_before_submit', lang));
        setStep('review');
      }, 300);
    } else {
      addUserMessage(link);
      addBotMessage('Please paste a valid link starting with http:// or https://');
    }
  };

  const handleSkipEvidence = () => {
    addUserMessage("Skip evidence");
    if (selectedScenario) {
      const nextEvidenceQ = selectedScenario.workflow.find(
        (q, idx) => q.type === 'evidence' && idx > currentQuestionIdx
      );
      if (nextEvidenceQ) {
        setCurrentQuestionIdx(selectedScenario.workflow.indexOf(nextEvidenceQ));
        setTimeout(() => addBotMessage(nextEvidenceQ.text[lang] || nextEvidenceQ.text.en), 300);
        return;
      }
    }
    setTimeout(() => {
      addBotMessage(t('bot.review_before_submit', lang));
      setStep('review');
    }, 300);
  };

  const handleNoEvidence = () => {
    addUserMessage(t('bot.no_evidence', lang));
    if (selectedScenario) {
      const nextEvidenceQ = selectedScenario.workflow.find(
        (q, idx) => q.type === 'evidence' && idx > currentQuestionIdx
      );
      if (nextEvidenceQ) {
        setCurrentQuestionIdx(selectedScenario.workflow.indexOf(nextEvidenceQ));
        setTimeout(() => addBotMessage(nextEvidenceQ.text[lang] || nextEvidenceQ.text.en), 300);
        return;
      }
    }
    setTimeout(() => {
      addBotMessage(t('bot.review_before_submit', lang));
      setStep('review');
    }, 300);
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
      addBotMessage(`${t('bot.report_created', lang)}\n\n${t('bot.track_id', lang)}: ${incident.incident_id}\n\nYou can track this incident from the home page.`);
      setStep('submitted');
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      addBotMessage('Voice input is not supported in this browser. Please type your message.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsRecording(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      addBotMessage(t('bot.try_again', lang));
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
  };

  const currentQuestion = selectedScenario?.workflow[currentQuestionIdx];
  const isEvidenceStep = currentQuestion?.type === 'evidence' || step === 'evidence_collect';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft size={20} />
            </button>
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-xs">NS</div>
            <span className="font-semibold text-gray-900">Namma Samasye</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLangSwitch(!showLangSwitch)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Globe size={18} />
            </button>
          </div>
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
              msg.role === 'user'
                ? 'gradient-bg text-white rounded-br-md'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Category Buttons */}
        {step === 'category_select' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            {categoryButtons.map(cb => (
              <button
                key={cb.id}
                onClick={() => handleCategorySelect(cb.id)}
                className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-200 hover:border-primary hover:shadow-md transition text-left text-sm"
              >
                <span className="text-xl">{cb.icon}</span>
                <span className="text-gray-700 text-xs font-medium">{cb.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Scenario Match Buttons */}
        {step === 'scenario_match' && scenarioMatches.length > 0 && (
          <div className="space-y-2 mt-4">
            {scenarioMatches.map(m => (
              <button
                key={m.scenarioId}
                onClick={() => handleScenarioConfirm(m.scenarioId)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:border-primary hover:shadow-md transition"
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-sm">{m.scenarioName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{m.confidence}% confidence</div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            ))}
          </div>
        )}

        {/* Evidence Collection Buttons */}
        {step === 'evidence_collect' && (
          <div className="space-y-3 mt-4">
            {/* Quick action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowEvidenceGuide(!showEvidenceGuide)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-100 transition"
              >
                <HelpCircle size={14} /> How to share evidence?
              </button>
              <button
                onClick={handleNoEvidence}
                className="px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-200 transition"
              >
                I don&apos;t have evidence
              </button>
            </div>

            {/* Evidence Guide */}
            {showEvidenceGuide && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-900 text-sm">How to Share Evidence</h4>
                  <button onClick={() => setShowEvidenceGuide(false)} className="text-blue-400 hover:text-blue-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {evidenceGuideSteps.map(s => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {s.step}
                      </div>
                      <span className="text-xs text-blue-800">{s.text}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-3 border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium">Supported links:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['Google Drive', 'OneDrive', 'Dropbox', 'Imgur', 'YouTube', 'Any public URL'].map(s => (
                      <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{s}</span>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-blue-600">
                  Make sure link sharing is set to &quot;Anyone with the link&quot;
                </p>
              </div>
            )}

            {/* Already added evidence */}
            {evidenceLinks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Added evidence ({evidenceLinks.length}):</p>
                {evidenceLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <Link2 size={14} className="text-green-600" />
                    <span className="text-xs text-green-700 truncate flex-1">{link}</span>
                    <button onClick={() => setEvidenceLinks(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-green-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Review Screen */}
        {step === 'review' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-gray-900">Review Your Report</h3>
            {selectedScenario && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Category:</span> {selectedScenario.name}
              </div>
            )}
            {originalText && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Description:</span> {originalText}
              </div>
            )}
            {location && (
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin size={14} /> {location}
              </div>
            )}
            {Object.entries(answers).map(([k, v]) => (
              <div key={k} className="text-sm text-gray-600">
                <span className="font-medium capitalize">{k.replace(/_/g, ' ')}:</span> {v}
              </div>
            ))}
            {evidenceLinks.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Evidence ({evidenceLinks.length} link(s)):</span>
                <div className="mt-1 space-y-1">
                  {evidenceLinks.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                      className="block text-xs text-primary hover:underline truncate">{link}</a>
                  ))}
                </div>
              </div>
            )}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              {t('evidence.warning', lang)}
            </div>
            <button onClick={handleSubmit} className="w-full gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90 transition">
              Submit Report
            </button>
          </div>
        )}

        {/* Submitted Screen */}
        {step === 'submitted' && (
          <div className="bg-white border border-green-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Report Submitted</h3>
            <div className="text-2xl font-mono font-bold text-primary mb-2">{incidentId}</div>
            <p className="text-sm text-gray-500 mb-4">Save this ID to track your report</p>
            <button onClick={() => router.push(`/track/${incidentId}`)} className="px-6 py-2 rounded-xl border border-primary text-primary font-medium hover:bg-primary hover:text-white transition text-sm">
              Track This Incident
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      {step !== 'submitted' && step !== 'review' && (
        <div className="sticky bottom-0 glass border-t border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleVoiceInput}
                disabled={isRecording}
                className={`p-3 rounded-xl transition ${isRecording ? 'bg-red-100 text-red-600 pulse-glow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <Mic size={20} />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (step === 'free_text') handleFreeTextSubmit();
                    else if (step === 'evidence_collect') handleEvidenceLinkSubmit();
                    else if (step === 'workflow') handleWorkflowAnswer();
                    else if (step === 'category_select' || step === 'scenario_match') {
                      if (inputValue.trim()) handleFreeTextSubmit();
                    }
                  }
                }}
                placeholder={
                  step === 'free_text' ? t('bot.ask_what_happened', lang) :
                  step === 'evidence_collect' ? 'Paste Google Drive link here...' :
                  step === 'workflow' && currentQuestion ? (currentQuestion.text[lang] || currentQuestion.text.en) :
                  'Type a message...'
                }
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-sm"
              />
              <button
                onClick={() => {
                  if (step === 'free_text') handleFreeTextSubmit();
                  else if (step === 'evidence_collect') handleEvidenceLinkSubmit();
                  else if (step === 'workflow') handleWorkflowAnswer();
                  else if (inputValue.trim()) handleFreeTextSubmit();
                }}
                disabled={!inputValue.trim()}
                className="p-3 rounded-xl gradient-bg text-white hover:opacity-90 transition disabled:opacity-40"
              >
                <Send size={20} />
              </button>
            </div>
            {step === 'evidence_collect' && (
              <button onClick={handleSkipEvidence}
                className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 py-1">
                Skip for now →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
