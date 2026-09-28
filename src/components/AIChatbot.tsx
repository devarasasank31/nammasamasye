'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Send, Bot, ChevronRight, Sparkles } from 'lucide-react';
import { getScenarioById, getScenarioName } from '@/data/scenarios';
import { getStoredLanguage } from '@/services/session';
import { Language } from '@/types';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  aiResponse?: {
    scenario_id: string;
    confidence: number;
    reason: string;
    source?: string;
  };
}

const MAX_HISTORY = 12;

const WELCOME: Record<string, string> = {
  kn: 'ನಮಸ್ಕಾರ! 👋 ನಾನು Namma Samasye AI.\n\nಏನಾಯಿತು ಎಂದು ನಿಮ್ಮ ಮಾತುಗಳಲ್ಲಿ ಹೇಳಿ — ಕನ್ನಡದಲ್ಲೇ ಆಗಬಹುದು.',
  hi: 'नमस्ते! 👋 मैं Namma Samasye AI हूँ।\n\nअपने शब्दों में बताएँ कि क्या हुआ — हिंदी में भी चलेगा।',
  te: 'నమస్కారం! 👋 నేను Namma Samasye AI.\n\nఏమి జరిగిందో మీ మాటల్లో చెప్పండి — తెలుగులో కూడా.',
  en: "Hello! 👋 I'm Namma Samasye AI.\n\nTell me what happened in your own words.",
};

export default function AIChatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      await Promise.resolve();
      setLang(getStoredLanguage());
    };
    void init();
  }, []);

  useEffect(() => {
    if (!isOpen || messages.length > 0) return;
    const init = async () => {
      await Promise.resolve();
      setMessages([{ id: 'welcome', role: 'bot', text: WELCOME[getStoredLanguage()] || WELCOME.en }]);
    };
    void init();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isAnalyzing) return;

    const userMsg: ChatMessage = { id: `${Date.now()}-u`, role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsAnalyzing(true);

    // Conversation history so follow-up detail is understood
    const history = [...messages, userMsg]
      .slice(-MAX_HISTORY)
      .map(m => ({ role: m.role, text: m.text }));

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: text, lang, history }),
      });
      const result = await res.json();
      setIsAnalyzing(false);

      if (result.type === 'chat' || (!result.type && result.reply)) {
        setMessages(prev => [...prev, { id: `${Date.now()}-b`, role: 'bot', text: result.reply }]);
        if (result.action === 'open_report') {
          localStorage.setItem('ns_language', lang);
          setTimeout(() => { router.push('/report'); setIsOpen(false); }, 700);
        } else if (result.action === 'open_track') {
          setTimeout(() => { router.push('/track'); setIsOpen(false); }, 700);
        }
        return;
      }

      const scenario = getScenarioById(result.scenario_id);
      const scenarioName = scenario ? getScenarioName(scenario, lang) : result.scenario_id;
      const reason = result.reason || '';
      const L = labels[lang] || labels.en;

      let botText: string;
      if (result.confidence >= 70) {
        botText = `${L.confirmed} **${scenarioName}** ${L.confirmedSuffix} (${result.confidence}%)\n\n${reason}`;
      } else if (result.confidence >= 40) {
        botText = `${L.maybe} **${scenarioName}** ${L.maybeSuffix} (${result.confidence}%)\n\n${reason}`;
      } else {
        botText = `${L.notsure}${reason ? `\n\n${reason}` : ''}`;
      }

      setMessages(prev => [...prev, {
        id: `${Date.now()}-b`,
        role: 'bot',
        text: botText,
        aiResponse: {
          scenario_id: result.scenario_id,
          confidence: result.confidence,
          reason: reason,
          source: result.source,
        },
      }]);
    } catch {
      setIsAnalyzing(false);
      setMessages(prev => [...prev, {
        id: `${Date.now()}-b`,
        role: 'bot',
        text: lang === 'kn' ? '❌ ಏದೋ ತಪ್ಪಾಗಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' :
              lang === 'hi' ? '❌ कुछ गड़बड़ हुई। दोबारा कोशिश करें।' :
              lang === 'te' ? '❌ ఏదో తప్పు జరిగింది. మళ్లీ ప్రయత్నించండి.' :
              '❌ Something went wrong. Please try again.',
      }]);
    }
  };

  const handleReportWithAI = (scenarioId: string) => {
    localStorage.setItem('ns_language', lang);
    router.push(`/report?scenario=${scenarioId}`);
    setIsOpen(false);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-bg text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
          aria-label="AI Assistant"
        >
          <Bot size={24} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="gradient-bg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Namma Samasye AI</h3>
                <p className="text-white/70 text-[10px]">
                  {lang === 'kn' ? 'ನಿಮ್ಮ ಸಮಸ್ಯೆ ಹೇಳಿ' : lang === 'hi' ? 'अपनी समस्या बताएँ' : lang === 'te' ? 'మీ సమస్య చెప్పండి' : 'Describe your problem'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  {msg.role === 'bot' && (
                    <div className="flex items-center gap-1 mb-1">
                      <Sparkles size={12} className="text-primary" />
                      <span className="text-[10px] text-gray-400 font-medium">AI Assistant</span>
                    </div>
                  )}
                  <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'gradient-bg text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                  }`}>
                    {msg.text}
                  </div>

                  {msg.aiResponse && msg.aiResponse.confidence >= 50 && (
                    <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-primary">
                          {lang === 'kn' ? 'ಸೂಚಿತ ವರ್ಗ' : lang === 'hi' ? 'सुझाई गई श्रेणी' : lang === 'te' ? 'సూచించిన వర్గం' : 'Suggested Category'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {msg.aiResponse.confidence}% match
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        {getScenarioById(msg.aiResponse.scenario_id)
                          ? getScenarioName(getScenarioById(msg.aiResponse.scenario_id)!, lang)
                          : msg.aiResponse.scenario_id}
                      </p>
                      <button
                        onClick={() => handleReportWithAI(msg.aiResponse!.scenario_id)}
                        className="w-full py-2 rounded-lg gradient-bg text-white text-xs font-medium hover:opacity-90 transition flex items-center justify-center gap-1"
                      >
                        {lang === 'kn' ? 'ವರದಿ ಮಾಡಿ' : lang === 'hi' ? 'रिपोर्ट करें' : lang === 'te' ? 'నివేదించండి' : 'Report This Issue'}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-gray-400">
                      {lang === 'kn' ? 'ಯೋಚಿಸಲಾಗುತ್ತಿದೆ...' : lang === 'hi' ? 'सोच रहा हूँ...' : lang === 'te' ? 'ఆలోచిస్తున్నాను...' : 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಸಮಸ್ಯೆ ವಿವರಿಸಿ...' : lang === 'hi' ? 'अपनी समस्या बताएँ...' : lang === 'te' ? 'మీ సమస్య వివరించండి...' : 'Describe your problem...'}
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                disabled={isAnalyzing}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isAnalyzing}
                className="p-2.5 rounded-xl gradient-bg text-white hover:opacity-90 transition disabled:opacity-40"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type LabelSet = {
  confirmed: string;
  confirmedSuffix: string;
  maybe: string;
  maybeSuffix: string;
  notsure: string;
};

const labels: Record<string, LabelSet> = {
  en: {
    confirmed: '✅ This is a',
    confirmedSuffix: 'issue.',
    maybe: '🤔 This might be a',
    maybeSuffix: 'issue.',
    notsure: '❓ I’m not sure yet — tell me a bit more about what happened.',
  },
  kn: {
    confirmed: '✅ ಇದು',
    confirmedSuffix: 'ಸಮಸ್ಯೆ.',
    maybe: '🤔 ಇದು',
    maybeSuffix: 'ಆಗಿರಬಹುದು.',
    notsure: '❓ ಇನ್ನೂ ಖಚಿತವಿಲ್ಲ — ಏನಾಯಿತು ಎಂದು ಸ್ವಲ್ಪ ವಿವರವಾಗಿ ಹೇಳಿ.',
  },
  hi: {
    confirmed: '✅ यह',
    confirmedSuffix: 'की समस्या है।',
    maybe: '🤔 यह',
    maybeSuffix: 'हो सकता है।',
    notsure: '❓ अभी पक्का नहीं है — थोड़ा और विस्तार से बताएँ।',
  },
  te: {
    confirmed: '✅ ఇది',
    confirmedSuffix: 'సమస్య.',
    maybe: '🤔 ఇది',
    maybeSuffix: 'కావచ్చు.',
    notsure: '❓ ఇంకా ఖచ్చితంగా తెలియదు — కొంచెం వివరంగా చెప్పండి.',
  },
};
