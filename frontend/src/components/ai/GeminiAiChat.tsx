'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Send,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import styles from './GeminiAiChat.module.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: 'gemini' | 'knowledge-engine';
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  {
    icon: '🌾',
    title: 'What can AgriTrack do?',
    subtitle: 'Overview & farm ledger capabilities',
    prompt: 'What can AgriTrack do and what are its key features?',
  },
  {
    icon: '🔘',
    title: 'Explain the functions of all buttons',
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
    {/* Large primary star */}
    <path d="M12 2C12.5 7 15 9.5 20 10C15 10.5 12.5 13 12 18C11.5 13 9 10.5 4 10C9 9.5 11.5 7 12 2Z" />
    {/* Small companion star top right */}
    <path d="M19 14C19.3 16 20.2 17 22 17.3C20.2 17.6 19.3 18.6 19 20.5C18.7 18.6 17.8 17.6 16 17.3C17.8 17 18.7 16 19 14Z" />
  </svg>
);

export const GeminiAiChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

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
      // Build history for context
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();

      if (data && data.reply) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          source: data.source || 'gemini',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            data.error ||
            'I encountered an unexpected issue. Please ask again or select one of the suggested buttons!',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Could not connect to the AgriTrack AI server. Please check your network and try again.',
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

  // Helper to render text with code badges and bold
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div>
        {lines.map((line, lineIdx) => {
          if (!line.trim()) {
            return <div key={lineIdx} style={{ height: '8px' }} />;
          }

          // Split line by backticks for button tags like `+ New Entry`
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

                // Split by bold **text**
                const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <React.Fragment key={partIdx}>
                    {boldParts.map((bPart, bIdx) => {
                      if (bPart.startsWith('**') && bPart.endsWith('**')) {
                        return (
                          <strong key={bIdx}>{bPart.slice(2, -2)}</strong>
                        );
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

  return (
    <>
      {/* Floating Trigger Button in Right Down Corner */}
      {!isOpen && (
        <button
          className={styles.floatingTrigger}
          onClick={() => setIsOpen(true)}
          aria-label="Ask AgriTrack AI"
          title="Ask AgriTrack Gemini AI"
        >
          <GeminiSparkleIcon className={styles.triggerSparkleIcon} />
          <span className={styles.triggerText}>Ask AI</span>
        </button>
      )}

      {/* Expandable Chat Modal Window */}
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
                <GeminiSparkleIcon style={{ width: 22, height: 22 }} />
              </div>
              <div className={styles.headerTitles}>
                <h3 className={styles.headerTitle}>Ask AgriTrack</h3>
                <span className={styles.headerSubtitle}>
                  <span className={styles.subtitleDot} />
                  Powered by Gemini AI
                </span>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                className={styles.actionButton}
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Minimize' : 'Maximize'}
                aria-label={isExpanded ? 'Minimize' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                className={styles.actionButton}
                onClick={() => setIsOpen(false)}
                title="Close AI Assistant"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Welcome Alert / Info Notice */}
          <div className={styles.welcomeBanner}>
            <Sparkles size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
            <div className={styles.welcomeText}>
              Ask any question about AgriTrack, how to record entries, crop cycles, or the <strong>functions of each button</strong>.
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className={styles.modalContent}>
            {/* Show Suggested Questions if conversation is new or user wants suggestions */}
            {messages.length === 0 && (
              <div className={styles.suggestedSection}>
                <div className={styles.suggestedHeader}>Suggested Questions</div>
                {SUGGESTED_QUESTIONS.map((item, idx) => (
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
                    <ChevronRight size={18} className={styles.suggestedChevron} />
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
                      msg.role === 'user'
                        ? styles.messageRowUser
                        : styles.messageRowAssistant
                    }
                  >
                    {msg.role === 'assistant' && (
                      <div className={styles.assistantAvatar}>
                        <GeminiSparkleIcon style={{ width: 16, height: 16 }} />
                      </div>
                    )}
                    <div
                      className={
                        msg.role === 'user'
                          ? styles.userBubble
                          : styles.assistantBubble
                      }
                    >
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <>
                          {renderFormattedContent(msg.content)}
                          <div className={styles.sourceBadge}>
                            <Sparkles size={11} style={{ color: '#16a34a' }} />
                            <span>
                              {msg.source === 'gemini'
                                ? 'Gemini 3.8 Flash'
                                : 'AgriTrack Farm Knowledge Engine'}
                            </span>
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
                        handleSendMessage('Explain the functions of all buttons in AgriTrack.')
                      }
                    >
                      🔘 Button Guide
                    </button>
                    <button
                      className={styles.topicChip}
                      onClick={() =>
                        handleSendMessage('How do I record a new farm expense?')
                      }
                    >
                      💸 Record Expense
                    </button>
                    <button
                      className={styles.topicChip}
                      onClick={() =>
                        handleSendMessage('How do I record crop mandi sales income?')
                      }
                    >
                      💰 Record Income
                    </button>
                    <button
                      className={styles.topicChip}
                      onClick={() =>
                        handleSendMessage('How do I add and manage a crop cycle?')
                      }
                    >
                      🌱 Crop Cycles
                    </button>
                    <button
                      className={styles.topicChip}
                      onClick={() => setMessages([])}
                      title="Clear chat and show suggestions"
                    >
                      <RotateCcw size={11} style={{ display: 'inline', marginRight: 4 }} />
                      Reset
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className={styles.modalInputArea}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.chatInput}
                placeholder="Ask about AgriTrack features or buttons..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
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
            AI responses may not always be accurate • <strong>AgriTrack Assistant</strong>
          </div>
        </div>
      )}
    </>
  );
};

