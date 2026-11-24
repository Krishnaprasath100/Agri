'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Send,
  ChevronRight,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import styles from './GeminiAiChat.module.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: 'gemini' | 'knowledge-engine';
  language?: 'ta' | 'en';
  timestamp: Date;
}

const SUGGESTED_QUESTIONS_EN = [
  {
    icon: '🌾',
    title: 'What can AgriTrack do?',
    subtitle: 'Overview & farm ledger capabilities',
    prompt: 'What can AgriTrack do and what are its key features?',
  },
  {
    icon: '🔘',
    title: 'Explain all buttons step by step',
    subtitle: 'Step-by-step button guide for every screen',
    prompt: 'Explain the functions of all buttons in AgriTrack step by step.',
  },
  {
    icon: '💸',
    title: 'How do I record an Expense?',
    subtitle: 'Step-by-step button guide',
    prompt: 'How do I record an expense in AgriTrack step by step?',
  },
  {
    icon: '💰',
    title: 'How to record Crop Sale / Mandi Income?',
    subtitle: 'Sales, unit prices & accounts',
    prompt: 'How do I record crop sale or mandi income in AgriTrack?',
  },
  {
    icon: '🌱',
    title: 'How to start a Crop Cycle?',
    subtitle: 'Setup, field plots & harvest tracking',
    prompt: 'How do I add a new crop cycle or planting?',
  },
  {
    icon: '📊',
    title: 'How is Net Profit calculated?',
    subtitle: 'P&L calculations & profit margins',
    prompt: 'How does AgriTrack calculate net profit and profit margin?',
  },
];

const SUGGESTED_QUESTIONS_TA = [
  {
    icon: '🌾',
    title: 'AgriTrack என்ன செய்யும்?',
    subtitle: 'முழு பண்ணை கணக்கு மேலாண்மை',
    prompt: 'AgriTrack செயலியின் பயன்கள் மற்றும் முக்கிய அம்சங்களை விளக்குங்கள்.',
  },
  {
    icon: '🔘',
    title: 'அனைத்து பட்டன்களின் செயல்முறை விளக்கம்',
    subtitle: 'ஒவ்வொரு பட்டனின் படிநிலை வழிகாட்டி',
    prompt: 'AgriTrack செயலியில் உள்ள அனைத்து பட்டன்களின் செயல்பாடுகளை விளக்குங்கள்.',
  },
  {
    icon: '💸',
    title: 'விவசாய செலவை பதிவு செய்வது எப்படி?',
    subtitle: 'படிநிலை பட்டன் வழிகாட்டி',
    prompt: 'AgriTrack-ல் ஒரு செலவை எப்படி பதிவு செய்ய வேண்டும் என்று விளக்குங்கள்.',
  },
  {
    icon: '💰',
    title: 'மண்டி / பயிர் விற்பனை வருமானத்தை பதிவது எப்படி?',
    subtitle: 'அளவு, விலை மற்றும் வங்கி கணக்கு',
    prompt: 'மண்டி பயிர் விற்பனை வருமானத்தை எப்படி பதிவு செய்வது?',
  },
  {
    icon: '🌱',
    title: 'புதிய பயிர் சுழற்சி தொடங்குவது எப்படி?',
    subtitle: 'விதைப்பு, நிலம் மற்றும் அறுவடை விவரங்கள்',
    prompt: 'புதிய பயிர் சுழற்சியை (Crop Cycle) எவ்வாறு தொடங்குவது?',
  },
  {
    icon: '📊',
    title: 'நிகர லாபம் எவ்வாறு கணக்கிடப்படுகிறது?',
    subtitle: 'வரவு செலவு மற்றும் லாப விகிதம் %',
    prompt: 'AgriTrack-ல் நிகர லாபம் மற்றும் லாப விகிதம் எவ்வாறு கணக்கிடப்படுகிறது?',
  },
];

// Custom 4-pointed Gemini Sparkle SVG
const GeminiSparkleIcon = ({
  className,
  style,
  size = 24,
}: {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ width: size, height: size, ...style }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C12.5 7 15 9.5 20 10C15 10.5 12.5 13 12 18C11.5 13 9 10.5 4 10C9 9.5 11.5 7 12 2Z" />
    <path d="M19 14C19.3 16 20.2 17 22 17.3C20.2 17.6 19.3 18.6 19 20.5C18.7 18.6 17.8 17.6 16 17.3C17.8 17 18.7 16 19 14Z" />
  </svg>
);

export const GeminiAiChat: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Speech Recognition (Voice Note / Mic)
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'ta-IN' | 'en-IN'>('ta-IN');
  const recognitionRef = useRef<any>(null);

  // Text to Speech (Voice Output)
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    if (language === 'ta') {
      setSpeechLang('ta-IN');
    } else {
      setSpeechLang('en-IN');
    }
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Clean text for speech synthesis
  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/[`*#]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/•/g, '')
      .replace(/👉/g, '')
      .replace(/₹/g, 'ரூபாய் ')
      .trim();
  };

  // Speak message aloud
  const speakMessage = useCallback((id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech Synthesis is not supported on this device/browser.');
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const clean = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(clean);

    // Detect language
    const isTamil = /[\u0B80-\u0BFF]/.test(text);
    if (isTamil) {
      utterance.lang = 'ta-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    // Try finding an exact voice match
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const match = voices.find((v) =>
        isTamil ? v.lang.startsWith('ta') : v.lang.startsWith('en')
      );
      if (match) utterance.voice = match;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  }, [speakingId]);

  // Stop speaking
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  };



  // Voice Input (Speech Recognition)
  const toggleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        speechLang === 'ta-IN'
          ? 'உங்கள் உலாவியில் (Browser) குரல் பதிவு வசதி ஆதரிக்கப்படவில்லை. Chrome அல்லது Edge உலாவியைப் பயன்படுத்தவும்.'
          : 'Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    // Stop speaking any previous message
    stopSpeaking();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          language: speechLang.startsWith('ta') || language === 'ta' ? 'ta' : 'en',
        }),
      });

      const data = await res.json();

      if (data && data.reply) {
        const assistantId = (Date.now() + 1).toString();
        const assistantMsg: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: data.reply,
          source: data.source || 'gemini',
          language: data.language || (speechLang.startsWith('ta') ? 'ta' : 'en'),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Auto speak if enabled
        if (autoSpeak) {
          setTimeout(() => speakMessage(assistantId, data.reply), 300);
        }
      } else {
        const fallbackText =
          speechLang === 'ta-IN'
            ? 'மன்னிக்கவும், தகவலைப் பெறுவதில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் கேட்கவும்.'
            : (data.error || 'I encountered an unexpected issue. Please ask again!');

        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fallbackText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          speechLang === 'ta-IN'
            ? 'சேவையகத்தை இணைக்க முடியவில்லை. இணைய இணைப்பை சரிபார்க்கவும்.'
            : 'Could not connect to the AgriTrack AI server. Please check your network and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to format text with code badges and bold
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div>
        {lines.map((line, lineIdx) => {
          if (!line.trim()) {
            return <div key={lineIdx} style={{ height: '7px' }} />;
          }

          const parts = line.split(/(`[^`]+`)/g);

          return (
            <p key={lineIdx} style={{ margin: '0 0 6px 0' }}>
              {parts.map((part, partIdx) => {
                if (part.startsWith('`') && part.endsWith('`')) {
                  const tagText = part.slice(1, -1);
                  return (
                    <span key={partIdx} className={styles.buttonBadge}>
                      {tagText}
                    </span>
                  );
                }

                const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <React.Fragment key={partIdx}>
                    {boldParts.map((bPart, bIdx) => {
                      if (bPart.startsWith('**') && bPart.endsWith('**')) {
                        return <strong key={bIdx}>{bPart.slice(2, -2)}</strong>;
                      }
                      return <span key={bIdx}>{bPart}</span>;
                    })}
                  </React.Fragment>
                );
              })}
            </p>
          );
        })}
      </div>
    );
  };

  // CRITICAL REQUIREMENT: Do NOT display on landing page, login page, or public auth pages.
  // Only display AFTER login when inside the application!
  if (!mounted) return null;
  const isPublicAuthPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password';

  if (!user || isPublicAuthPage) {
    return null;
  }

  const isTamilMode = speechLang === 'ta-IN' || language === 'ta';
  const suggestedQuestions = isTamilMode ? SUGGESTED_QUESTIONS_TA : SUGGESTED_QUESTIONS_EN;

  return (
    <>
      {/* Floating Trigger Buttons in Right Down Corner */}
      {!isOpen && (
        <>
          {/* Mobile-only Floating Language Button directly upper to AI Chat Bot */}
          <button
            type="button"
            className={styles.floatingLanguageBtn}
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            aria-label={language === 'en' ? 'Switch to Tamil language' : 'Switch to English language'}
            title={language === 'en' ? 'தமிழில் மாற்றவும்' : 'Switch to English'}
          >
            <Languages size={15} className={styles.floatingLanguageIcon} />
            <span className={styles.floatingLanguageText}>
              {language === 'en' ? 'தமிழ்' : 'English'}
            </span>
          </button>

          <button
            className={styles.floatingTrigger}
            onClick={() => setIsOpen(true)}
            aria-label="Ask AgriTrack AI"
            title="Ask AgriTrack AI"
          >
            <GeminiSparkleIcon className={styles.triggerSparkleIcon} />
            <span className={styles.triggerText}>Ask AI</span>
          </button>
        </>
      )}

      {/* Expandable Chat Modal Window in Right Down Corner */}
      {isOpen && (
        <div
          className={`${styles.chatModal} ${isExpanded ? styles.expanded : ''}`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.headerLogoBadge}>
                <GeminiSparkleIcon style={{ width: 20, height: 20 }} />
              </div>
              <div className={styles.headerTitles}>
                <h3 className={styles.headerTitle}>
                  {isTamilMode ? 'AgriTrack AI உதவியாளர்' : 'Ask AgriTrack'}
                </h3>
                <span className={styles.headerSubtitle}>
                  <span className={styles.subtitleDot} />
                  Powered by Gemini AI
                </span>
              </div>
            </div>

            <div className={styles.headerActions}>
              {/* Auto Speak Toggle */}
              <button
                className={styles.actionButton}
                onClick={() => {
                  setAutoSpeak(!autoSpeak);
                  if (autoSpeak) stopSpeaking();
                }}
                title={autoSpeak ? 'Auto-Voice Enabled' : 'Auto-Voice Disabled'}
                aria-label="Toggle Auto Voice"
                style={{ color: autoSpeak ? '#2563eb' : '#64748b' }}
              >
                {autoSpeak ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              <button
                className={styles.actionButton}
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Minimize' : 'Maximize'}
                aria-label={isExpanded ? 'Minimize' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              <button
                className={styles.actionButton}
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                title="Close AI Assistant"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Welcome Alert / Info Notice */}
          <div className={styles.welcomeBanner}>
            <Sparkles size={16} style={{ color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
            <div className={styles.welcomeText}>
              {isTamilMode ? (
                <>
                  AgriTrack செயலியின் பட்டன்கள், வரவு-செலவு பதிவு அல்லது பயிர் சுழற்சி பற்றிய சந்தேகங்களை <strong>தமிழிலோ அல்லது வாய்ஸ் நோட்டிலோ</strong> கேட்கலாம்!
                </>
              ) : (
                <>
                  Ask any question about AgriTrack features, crop cycles, or the <strong>functions of every button</strong> in English or Tamil!
                </>
              )}
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className={styles.modalContent}>
            {/* Suggested Questions */}
            {messages.length === 0 && (
              <div className={styles.suggestedSection}>
                <div className={styles.suggestedHeader}>
                  {isTamilMode ? 'பரிந்துரைக்கப்பட்ட கேள்விகள்' : 'Suggested Questions'}
                </div>
                {suggestedQuestions.map((item, idx) => (
                  <button
                    key={idx}
                    className={styles.suggestedCard}
                    onClick={() => handleSendMessage(item.prompt)}
                  >
                    <div className={styles.suggestedCardLeft}>
                      <span className={styles.suggestedIconBadge}>{item.icon}</span>
                      <div className={styles.suggestedTitles}>
                        <span className={styles.suggestedTitle}>{item.title}</span>
                        <span className={styles.suggestedSubtitle}>{item.subtitle}</span>
                      </div>
                    </div>
                    <ChevronRight size={17} className={styles.suggestedChevron} />
                  </button>
                ))}
              </div>
            )}

            {/* Message Thread */}
            {messages.length > 0 && (
              <div className={styles.messageThread}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      msg.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant
                    }
                  >
                    {msg.role === 'assistant' && (
                      <div className={styles.assistantAvatar}>
                        <GeminiSparkleIcon style={{ width: 16, height: 16 }} />
                      </div>
                    )}
                    <div
                      className={
                        msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                      }
                    >
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <>
                          {renderFormattedContent(msg.content)}
                          <div className={styles.messageActions}>
                            <div className={styles.sourceBadge}>
                              <Sparkles size={11} style={{ color: '#2563eb' }} />
                              <span>
                                {msg.source === 'gemini'
                                  ? 'Gemini 3.8 Flash'
                                  : 'AgriTrack Farm Knowledge Engine'}
                              </span>
                            </div>

                            {/* Voice Speak Button for Response */}
                            <button
                              className={`${styles.speakButton} ${speakingId === msg.id ? styles.isSpeaking : ''}`}
                              onClick={() => speakMessage(msg.id, msg.content)}
                              title={
                                speakingId === msg.id
                                  ? 'நிறுத்து (Stop Speech)'
                                  : 'குரலில் கேள் (Listen Aloud)'
                              }
                            >
                              {speakingId === msg.id ? (
                                <>
                                  <div className={styles.soundWave}>
                                    <span className={styles.waveBar} />
                                    <span className={styles.waveBar} />
                                    <span className={styles.waveBar} />
                                  </div>
                                  <span>{isTamilMode ? 'நிறுத்து' : 'Stop'}</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 size={13} />
                                  <span>{isTamilMode ? 'பேசு' : 'Speak'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading state */}
                {isLoading && (
                  <div className={styles.messageRowAssistant}>
                    <div className={styles.assistantAvatar}>
                      <GeminiSparkleIcon style={{ width: 16, height: 16 }} />
                    </div>
                    <div className={styles.loadingBubble}>
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                    </div>
                  </div>
                )}

                {/* Quick Chips for Follow-up Questions */}
                {!isLoading && (
                  <div className={styles.topicChipsContainer}>
                    <button
                      className={styles.topicChip}
                      onClick={() =>
                        handleSendMessage(
                          isTamilMode
                            ? 'AgriTrack பட்டன்களின் செயல்பாடுகளை தெளிவாக விளக்குங்கள்.'
                            : 'Explain the functions of all buttons in AgriTrack.'
                        )
                      }
                    >
                      🔘 {isTamilMode ? 'பட்டன் விளக்கம்' : 'Button Guide'}
                    </button>
                    <button
                      className={styles.topicChip}
                      onClick={() =>
                        handleSendMessage(
                          isTamilMode
                            ? 'விவசாய செலவை எப்படி பதிவு செய்ய வேண்டும்?'
                            : 'How do I record a new farm expense?'
                        )
                      }
                    >
                      💸 {isTamilMode ? 'செலவு பதிவு' : 'Record Expense'}
                    </button>
                    <button
                      className={styles.topicChip}
                      onClick={() =>
                        handleSendMessage(
                          isTamilMode
                            ? 'மண்டி பயிர் விற்பனை வருமானத்தை எப்படி பதிவு செய்வது?'
                            : 'How do I record crop mandi sales income?'
                        )
                      }
                    >
                      💰 {isTamilMode ? 'வருமானம்' : 'Record Income'}
                    </button>
                    <button
                      className={styles.topicChip}
                      onClick={() =>
                        handleSendMessage(
                          isTamilMode
                            ? 'பயிர் சுழற்சி (Crop Cycle) எவ்வாறு சேர்ப்பது?'
                            : 'How do I add and manage a crop cycle?'
                        )
                      }
                    >
                      🌱 {isTamilMode ? 'பயிர் சுழற்சி' : 'Crop Cycles'}
                    </button>
                    <button
                      className={styles.topicChip}
                      onClick={() => {
                        stopSpeaking();
                        setMessages([]);
                      }}
                      title="Clear chat and show suggestions"
                    >
                      <RotateCcw size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {isTamilMode ? 'மீட்டமை' : 'Reset'}
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Active Voice Listening Banner */}
          {isListening && (
            <div className={styles.listeningBanner}>
              <span>
                🎙️ {speechLang === 'ta-IN' ? 'கேட்கிறது... தமிழில் பேசுங்கள்...' : 'Listening... Speak your question now...'}
              </span>
              <button
                onClick={toggleVoiceInput}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#991b1b',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✕ {isTamilMode ? 'முடி' : 'Done'}
              </button>
            </div>
          )}

          {/* Voice Language Selector Bar */}
          <div className={styles.languageBar}>
            <span className={styles.micHint}>
              🎙️ {isTamilMode ? 'குரல் மொழி தேர்வு:' : 'Voice Note Language:'}
            </span>
            <div className={styles.voiceLangToggle}>
              <button
                className={`${styles.langOption} ${speechLang === 'ta-IN' ? styles.active : ''}`}
                onClick={() => setSpeechLang('ta-IN')}
                title="Speak in Tamil"
              >
                🇮🇳 தமிழ்
              </button>
              <button
                className={`${styles.langOption} ${speechLang === 'en-IN' ? styles.active : ''}`}
                onClick={() => setSpeechLang('en-IN')}
                title="Speak in English"
              >
                🌐 English
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className={styles.modalInputArea}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.chatInput}
                placeholder={
                  speechLang === 'ta-IN'
                    ? 'AgriTrack பட்டன்கள் அல்லது கணக்கு பற்றி கேட்கவும்...'
                    : 'Ask about AgriTrack features, buttons, or doubts...'
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />

              {/* Voice Note Microphone Button */}
              <button
                className={`${styles.micButton} ${isListening ? styles.isListening : ''}`}
                onClick={toggleVoiceInput}
                title={
                  isListening
                    ? 'பதிவை நிறுத்து (Stop Voice Input)'
                    : speechLang === 'ta-IN'
                    ? 'தமிழில் பேச மைக் பட்டனை அழுத்தவும் (Voice Note in Tamil)'
                    : 'Click to speak your question (Voice Note)'
                }
                aria-label="Voice Note Input"
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Send Button */}
              <button
                className={styles.sendButton}
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                aria-label="Send message"
                title="Send"
              >
                <Send size={15} style={{ marginLeft: 1 }} />
              </button>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className={styles.modalFooter}>
            {isTamilMode
              ? 'AgriTrack AI உதவியாளர் • தமிழ் & ஆங்கில குரல் வழிகாட்டி'
              : 'AgriTrack Assistant • Voice & Button Step-by-Step Guide'}
          </div>
        </div>
      )}
    </>
  );
};
