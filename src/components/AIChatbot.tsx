'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, X, Send, Bot, User, ChevronRight, Sparkles } from 'lucide-react';
import { getScenarioById, getScenarioName } from '@/data/scenarios';
import { getStoredLanguage } from '@/services/session';
import { t } from '@/lib/translations';
import { Language } from '@/types';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  aiResponse?: {
    scenario_id: string;
    confidence: number;
    reason: string;
    source: string;
  };
}

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
    setLang(getStoredLanguage());
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'bot',
        text: lang === 'kn' ? 'ನಮಸ್ಕಾರ! ನಾನು Namma Samasye AI.\n\nನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಸರಳವಾಗಿ ವಿವರಿಸಿ — ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಿ.\n\nಉದಾಹರಣೆ: "ಪಾಣಿ ಬರ್ತಿಲ್ಲ", "ರಸ್ತೆಯಲ್ಲಿ ಗುಂಡಿ ಇದೆ", "ಕಚ್ಚಾ ನಾಯಿ ಕಚ್ಚಿದೆ"' :
              lang === 'hi' ? 'नमस्ते! मैं Namma Samasye AI हूँ।\n\nअपनी समस्या सरल शब्दों में बताएं — किसी भी भाषा में।\n\nउदाहरण: "पानी नहीं आ रहा", "सड़क में गड्ढा है", "कुत्ता काट रहा है", "बिजली चली गई"' :
              lang === 'te' ? 'నమస్కారం! నేను Namma Samasye AI.\n\nమీ సమస్యను సరళంగా వివరించండి — ఏ భాషలోనైనా.\n\nఉదాహరణ: "నీరు రావట్లేదు", "రోడ్డు దెబ్బతింది", "కుక్క కరిచింది"' :
              'Hello! I\'m Namma Samasye AI.\n\nDescribe your problem in simple words — in any language.\n\nExamples:\n• "paani nahi aa raha" (no water)\n• "road mein hole hai" (pothole)\n• "kutta kaat raha hai" (dog biting)\n• "light chali gayi" (power cut)\n• "kachra nahi uthaya" (garbage not collected)\n• "police paise maang raha" (police asking bribe)',
      }]);
    }
  }, [isOpen, lang]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isAnalyzing) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsAnalyzing(true);

    try {
      // Call server-side API (API key stays private)
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: input.trim(), lang }),
      });

      const result = await res.json();
      const scenario = getScenarioById(result.scenario_id);
      const scenarioName = scenario ? getScenarioName(scenario, lang) : result.scenario_id;

      let botText = '';
      if (result.confidence >= 70) {
        botText = lang === 'kn' ? `✅ ನಾನು ಭಾವಿಸುತ್ತೇನೆ ಇದು **${scenarioName}** ಸಮಸ್ಯೆ. (${result.confidence}% ವಿಶ್ವಾಸ)\n\n${result.reason}` :
                  lang === 'hi' ? `✅ मुझे लगता है यह **${scenarioName}** की समस्या है। (${result.confidence}% confidence)\n\n${result.reason}` :
                  lang === 'te' ? `✅ ఇది **${scenarioName}** సమస్య అని నాకు అనిపిస్తుంది. (${result.confidence}% confidence)\n\n${result.reason}` :
                  `✅ I think this is a **${scenarioName}** issue. (${result.confidence}% confidence)\n\n${result.reason}`;
      } else if (result.confidence >= 40) {
        botText = lang === 'kn' ? `🤔 ಇದು **${scenarioName}** ಆಗಿರಬಹುದು. (${result.confidence}% ವಿಶ್ವಾಸ)\n\n${result.reason}\n\nನೀವು ಹೆಚ್ಚು ವಿವರ ಹಂಚಿಕೊಳ್ಳಬಹುದೇ?` :
                  lang === 'hi' ? `🤔 यह **${scenarioName}** हो सकता है। (${result.confidence}% confidence)\n\n${result.reason}\n\nक्या आप और बता सकते हैं?` :
                  lang === 'te' ? `🤔 ఇది **${scenarioName}** కావచ్చు. (${result.confidence}% confidence)\n\n${result.reason}\n\nమరింత వివరాలు చెప్పగలరా?` :
                  `🤔 This might be a **${scenarioName}** issue. (${result.confidence}% confidence)\n\n${result.reason}\n\nCan you describe more?`;
      } else {
        botText = lang === 'kn' ? `❓ ನನಗೆ ಖಚಿತವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಹೆಚ್ಚು ವಿವರವಾಗಿ ವಿವರಿಸಿ.\n\nಉದಾಹರಣೆ: "ಪಾಣಿ ಬರ್ತಿಲ್ಲ", "ರಸ್ತೆಯಲ್ಲಿ ಗುಂಡಿ ಇದೆ", "ಕಚ್ಚಾ ನಾಯಿ ಕಚ್ಚಿದೆ"` :
                  lang === 'hi' ? `❓ मुझे पक्का नहीं है। कृपया और विस्तार से बताएं।\n\nउदाहरण: "पानी नहीं आ रहा", "सड़क में गड्ढा है", "बिजली चली गई"` :
                  lang === 'te' ? `❓ నాకు ఖచ్చితంగా తెలియదు. దయచేసి మరింత వివరంగా చెప్పండి.\n\nఉదాహరణ: "నీరు రావట్లేదు", "రోడ్డు దెబ్బతింది", "కుక్క కరిచింది"` :
                  `❓ I'm not sure. Please describe in more detail.\n\nExamples:\n• "paani nahi aa raha" (no water)\n• "road mein hole hai" (pothole)\n• "kutta kaat raha hai" (dog biting)\n• "light chali gayi" (power cut)`;
      }

      if (result.follow_up) {
        botText += `\n\n💬 ${result.follow_up}`;
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: botText,
        aiResponse: result,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: '❌ Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, errorMsg]);
    }

    setIsAnalyzing(false);
  };

  const handleReportWithAI = (scenarioId: string) => {
    localStorage.setItem('ns_language', lang);
    router.push(`/report?scenario=${scenarioId}`);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
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

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="gradient-bg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Namma Samasye AI</h3>
                <p className="text-white/70 text-[10px]">Describe your problem</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages */}
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

                  {/* AI Suggestion Card */}
                  {msg.aiResponse && msg.aiResponse.confidence >= 50 && (
                    <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-primary">Suggested Category</span>
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
                        Report This Issue <ChevronRight size={14} />
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
                    <span className="text-xs text-gray-400">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಸಮಸ್ಯೆ ವಿವರಿಸಿ...' : lang === 'hi' ? 'अपनी समस्या बताएं...' : lang === 'te' ? 'మీ సమస్య వివరించండి...' : 'Describe your problem...'}
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
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Powered by AI + 1000+ trained scenarios
            </p>
          </div>
        </div>
      )}
    </>
  );
}
