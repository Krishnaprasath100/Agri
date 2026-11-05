'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  ChevronUp,
  ChevronDown,
  X,
  Delete,
  Sparkles,
  ArrowRight,
  Globe,
} from 'lucide-react';
import styles from './TamilKeyboard.module.css';

// 100+ Common Agricultural, Financial, and Conversational Words for instant 1-tap candidates
const DICTIONARY: Record<string, string[]> = {
  nel: ['நெல்', 'நேல்'],
  paddy: ['நெல்'],
  uram: ['உரம்', 'ஊரம்'],
  fertilizer: ['உரம்'],
  vithai: ['விதை', 'வீதை'],
  seed: ['விதை'],
  kooli: ['கூலி', 'கோலி'],
  wage: ['கூலி'],
  wages: ['கூலி'],
  aruvadai: ['அறுவடை'],
  harvest: ['அறுவடை'],
  poochi: ['பூச்சி மருந்து', 'பூச்சி'],
  marunthu: ['மருந்து'],
  pesticide: ['பூச்சி மருந்து'],
  thakkali: ['தக்காளி', 'தக்கலி'],
  tomato: ['தக்காளி'],
  vengayam: ['வெங்காயம்'],
  onion: ['வெங்காயம்'],
  karumbu: ['கரும்பு'],
  sugarcane: ['கரும்பு'],
  paruthi: ['பருத்தி'],
  cotton: ['பருத்தி'],
  vazhai: ['வாழை'],
  banana: ['வாழை'],
  kothumai: ['கோதுமை'],
  wheat: ['கோதுமை'],
  cholam: ['சோளம்'],
  maize: ['சோளம்'],
  groundnut: ['நிலக்கடலை'],
  kadala: ['கடலை'],
  thengai: ['தேங்காய்'],
  coconut: ['தேங்காய்'],
  milagai: ['மிளகாய்'],
  chilli: ['மிளகாய்'],
  manjal: ['மஞ்சள்'],
  turmeric: ['மஞ்சள்'],
  potato: ['உருளைக்கிழங்கு'],
  weeding: ['களை எடுத்தல்'],
  irrigation: ['நீர்ப்பாசனம்'],
  tractor: ['டிராக்டர்'],
  uzhavu: ['உழவு'],
  transport: ['போக்குவரத்து'],
  electricity: ['மின்சாரம்'],
  current: ['மின்சாரம்'],
  repair: ['பழுது பார்த்தல்'],
  motar: ['மோட்டார்'],
  pumpset: ['பம்புசெட்'],
  diesel: ['டீசல்'],
  petrol: ['பெட்ரோல்'],
  pipe: ['பைப்'],
  drip: ['சொட்டு நீர் பாசனம்'],
  varavu: ['வரவு'],
  income: ['வரவு'],
  selavu: ['செலவு'],
  expense: ['செலவு'],
  expenses: ['செலவு'],
  meethi: ['மீதி'],
  balance: ['மீதி'],
  laabam: ['லாபம்'],
  profit: ['லாபம்'],
  nattam: ['நஷ்டம்'],
  loss: ['நஷ்டம்'],
  panam: ['பணம்'],
  money: ['பணம்'],
  roobai: ['ரூபாய்'],
  rs: ['ரூ.'],
  kaasu: ['காசு', 'ரொக்கம்'],
  cash: ['ரொக்கம்'],
  vangi: ['வங்கி'],
  bank: ['வங்கி'],
  kadan: ['கடன்'],
  loan: ['கடன்'],
  vanakkam: ['வணக்கம்'],
  amma: ['அம்மா'],
  appa: ['அப்பா'],
  thambi: ['தம்பி'],
  anna: ['அண்ணா'],
  nandri: ['நன்றி'],
  seri: ['சரி'],
  sari: ['சரி'],
  naal: ['நாள்'],
  thethi: ['தேதி'],
  date: ['தேதி'],
  masam: ['மாதம்'],
  month: ['மாதம்'],
  varusham: ['வருடம்'],
  year: ['வருடம்'],
  thottam: ['தோட்டம்'],
  nilam: ['நிலம்'],
  vayal: ['வயல்'],
  acre: ['ஏக்கர்'],
  ekkar: ['ஏக்கர்'],
  cent: ['சென்ட்'],
  mootai: ['மூட்டை'],
  bag: ['பை', 'மூட்டை'],
  kilo: ['கிலோ'],
  kg: ['கிலோ'],
  ton: ['டன்'],
  lit: ['லிட்டர்'],
  mani: ['மணி'],
  kumar: ['குமார்'],
  raja: ['ராஜா'],
  ravi: ['ரவி'],
  sbi: ['எஸ்பிஐ'],
};

const DEFAULT_SUGGESTIONS = [
  'நெல்',
  'உரம்',
  'விதை',
  'கூலி',
  'பூச்சி மருந்து',
  'அறுவடை',
  'வரவு',
  'செலவு',
  'ஏக்கர்',
  'ரூ.',
];

// Phonetic Rules
const VOWELS_MAP: Record<string, string> = {
  a: 'அ',
  aa: 'ஆ',
  A: 'ஆ',
  i: 'இ',
  ii: 'ஈ',
  ee: 'ஈ',
  I: 'ஈ',
  u: 'உ',
  uu: 'ஊ',
  oo: 'ஊ',
  U: 'ஊ',
  e: 'எ',
  E: 'ஏ',
  ae: 'ஏ',
  ai: 'ஐ',
  o: 'ஒ',
  O: 'ஓ',
  au: 'ஔ',
  ou: 'ஔ',
  q: 'ஃ',
};

const CONSONANTS_MAP: Record<string, string> = {
  k: 'க்',
  g: 'க்',
  ng: 'ங்',
  ch: 'ச்',
  s: 'ச்',
  j: 'ஜ்',
  nj: 'ஞ்',
  gn: 'ஞ்',
  t: 'ட்',
  d: 'ட்',
  N: 'ண்',
  th: 'த்',
  dh: 'த்',
  n: 'ந்',
  p: 'ப்',
  b: 'ப்',
  m: 'ம்',
  y: 'ய்',
  r: 'ர்',
  l: 'ல்',
  v: 'வ்',
  w: 'வ்',
  zh: 'ழ்',
  z: 'ழ்',
  L: 'ள்',
  R: 'ற்',
  sh: 'ஷ்',
  S: 'ஸ்',
  h: 'ஹ்',
  ksh: 'க்ஷ்',
};

const MATRAS_MAP: Record<string, string> = {
  a: '',
  aa: 'ா',
  A: 'ா',
  i: 'ி',
  ii: 'ீ',
  ee: 'ீ',
  I: 'ீ',
  u: 'ு',
  uu: 'ூ',
  oo: 'ூ',
  U: 'ூ',
  e: 'ெ',
  E: 'ே',
  ae: 'ே',
  ai: 'ை',
  o: 'ொ',
  O: 'ோ',
  au: 'ௌ',
  ou: 'ௌ',
};

function transliterateWord(input: string): string {
  let result = '';
  let i = 0;
  while (i < input.length) {
    const c3 = input.slice(i, i + 3).toLowerCase();
    const c2 = input.slice(i, i + 2).toLowerCase();
    const c1 = input[i];

    let conMatch: string | null = null;
    let conLen = 0;
    if (CONSONANTS_MAP[c3]) {
      conMatch = CONSONANTS_MAP[c3];
      conLen = 3;
    } else if (CONSONANTS_MAP[c2]) {
      conMatch = CONSONANTS_MAP[c2];
      conLen = 2;
    } else if (CONSONANTS_MAP[c1.toLowerCase()] || CONSONANTS_MAP[c1]) {
      conMatch = CONSONANTS_MAP[c1] || CONSONANTS_MAP[c1.toLowerCase()];
      conLen = 1;
    }

    if (conMatch) {
      i += conLen;
      const v2 = input.slice(i, i + 2).toLowerCase();
      const v1 = input[i];
      let matraMatch: string | null = null;
      let matraLen = 0;

      if (v2 in MATRAS_MAP) {
        matraMatch = MATRAS_MAP[v2];
        matraLen = 2;
      } else if (v1 && (v1 in MATRAS_MAP || v1.toLowerCase() in MATRAS_MAP)) {
        matraMatch = v1 in MATRAS_MAP ? MATRAS_MAP[v1] : MATRAS_MAP[v1.toLowerCase()];
        matraLen = 1;
      }

      const baseChar = conMatch.replace('்', '');
      if (matraMatch !== null) {
        result += baseChar + matraMatch;
        i += matraLen;
      } else {
        result += conMatch;
      }
    } else {
      const v2 = input.slice(i, i + 2).toLowerCase();
      const v1 = input[i];
      if (VOWELS_MAP[v2]) {
        result += VOWELS_MAP[v2];
        i += 2;
      } else if (VOWELS_MAP[v1] || VOWELS_MAP[v1?.toLowerCase()]) {
        result += VOWELS_MAP[v1] || VOWELS_MAP[v1?.toLowerCase()];
        i += 1;
      } else {
        result += input[i];
        i += 1;
      }
    }
  }
  return result;
}

// QWERTY rows for Google Phonetic
const QWERTY_ROW_1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const QWERTY_ROW_2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const QWERTY_ROW_3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

// Direct Tamil 99 Keys
const TAMIL99_ROW_1 = ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'];
const TAMIL99_ROW_2 = ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம'];
const TAMIL99_ROW_3 = ['ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன', 'ஜ', 'ஷ', 'ஸ'];
const TAMIL99_ROW_4 = ['்', 'ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ'];

export function TamilKeyboard() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'phonetic' | 'tamil99'>('phonetic');
  const [buffer, setBuffer] = useState('');
  const [candidates, setCandidates] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Only display keyboard on mobile phones (<= 767px). Desktop and Tab (> 767px) do not show this keyboard.
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(typeof window !== 'undefined' && window.innerWidth <= 767);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync document & inputs language attribute
  useEffect(() => {
    if (language === 'ta') {
      document.documentElement.lang = 'ta';
      const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      inputs.forEach((input) => {
        if (input.type !== 'number' && input.type !== 'date' && input.type !== 'password') {
          input.setAttribute('lang', 'ta');
        }
      });
      if (isMobileDevice) {
        setIsOpen(true);
      }
    } else {
      document.documentElement.lang = 'en';
      const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      inputs.forEach((input) => {
        input.setAttribute('lang', 'en');
      });
      setIsOpen(false);
      setBuffer('');
    }
  }, [language, isMobileDevice]);

  // Track active input focus (strictly on mobile app/phones)
  useEffect(() => {
    if (language !== 'ta' || !isMobileDevice) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        (target as HTMLInputElement).type !== 'number' &&
        (target as HTMLInputElement).type !== 'date' &&
        (target as HTMLInputElement).type !== 'password'
      ) {
        activeInputRef.current = target as HTMLInputElement | HTMLTextAreaElement;
        setIsOpen(true);
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [language]);

  // Recompute candidates whenever buffer changes
  useEffect(() => {
    if (!buffer.trim()) {
      setCandidates(DEFAULT_SUGGESTIONS);
      return;
    }

    const lower = buffer.toLowerCase().trim();
    const dictMatches = DICTIONARY[lower] || [];
    const generated = transliterateWord(lower);

    const merged = Array.from(new Set([...dictMatches, generated, buffer]));
    setCandidates(merged);
  }, [buffer]);

  // Insert text into active input
  const commitText = useCallback((text: string) => {
    let target = activeInputRef.current;
    if (!target || !document.body.contains(target)) {
      target = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input[type="text"]:not([disabled]), textarea:not([disabled])'
      );
      if (target) activeInputRef.current = target;
    }

    if (!target) return;

    target.focus();
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const before = target.value.slice(0, start);
    const after = target.value.slice(end);
    const newValue = before + text + after;

    const proto = target.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(target, newValue);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      target.value = newValue;
    }

    const newCursor = start + text.length;
    try {
      target.setSelectionRange(newCursor, newCursor);
    } catch {
      // ignore
    }

    setBuffer('');
  }, []);

  // Backspace handling
  const handleBackspace = useCallback(() => {
    if (buffer.length > 0) {
      setBuffer((prev) => prev.slice(0, -1));
      return;
    }

    const target = activeInputRef.current;
    if (!target) return;

    target.focus();
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;

    let newValue = '';
    let newCursor = start;

    if (start !== end) {
      newValue = target.value.slice(0, start) + target.value.slice(end);
      newCursor = start;
    } else if (start > 0) {
      newValue = target.value.slice(0, start - 1) + target.value.slice(start);
      newCursor = start - 1;
    } else {
      return;
    }

    const proto = target.tagName === 'INPUT' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(target, newValue);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      target.value = newValue;
    }

    try {
      target.setSelectionRange(newCursor, newCursor);
    } catch {
      // ignore
    }
  }, [buffer]);

  // Spacebar handling
  const handleSpace = useCallback(() => {
    if (buffer.trim() && candidates.length > 0) {
      commitText(candidates[0] + ' ');
    } else {
      commitText(' ');
    }
    setBuffer('');
  }, [buffer, candidates, commitText]);

  // Dispatch field navigation (Next / Prev)
  const navigateField = useCallback((direction: 'next' | 'prev') => {
    window.dispatchEvent(new CustomEvent('agri:navigate-field', { detail: { direction } }));
  }, []);

  if (language !== 'ta' || !isMobileDevice) {
    return null;
  }

  // If closed, return null — do not render floating badge near chat bot
  if (!isOpen) {
    return null;
  }

  return (
    <aside className={styles.keyboardOverlay} aria-label="Google தமிழ் விசைப்பலகை">
      {/* Google Header */}
      <div className={styles.googleHeader}>
        <div className={styles.googleBrand}>
          <span className={styles.googleLogo}>
            <span className={styles.googleG_blue}>G</span>
            <span className={styles.googleG_red}>o</span>
            <span className={styles.googleG_yellow}>o</span>
            <span className={styles.googleG_blue}>g</span>
            <span className={styles.googleG_green}>l</span>
            <span className={styles.googleG_red}>e</span>
          </span>
          <span className={styles.tamilTag}>தமிழ்</span>
        </div>

        <div className={styles.headerControls}>
          <button
            type="button"
            className={`${styles.modeToggleBtn} ${mode === 'phonetic' ? styles.modeToggleBtnActive : ''}`}
            onClick={() => setMode('phonetic')}
            title="Google Phonetic (abc ➔ தமிழ்)"
          >
            <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
            abc ➔ தமிழ்
          </button>

          <button
            type="button"
            className={`${styles.modeToggleBtn} ${mode === 'tamil99' ? styles.modeToggleBtnActive : ''}`}
            onClick={() => setMode('tamil99')}
            title="Tamil 99 Direct Layout"
          >
            தமிழ் 99
          </button>

          <button
            type="button"
            className={styles.navArrowBtn}
            onClick={() => navigateField('prev')}
            title="முந்தைய புலம் (Previous Field)"
            aria-label="Previous Field"
          >
            <ChevronUp size={16} />
          </button>

          <button
            type="button"
            className={styles.navArrowBtn}
            onClick={() => navigateField('next')}
            title="அடுத்த புலம் (Next Field)"
            aria-label="Next Field"
          >
            <ChevronDown size={16} />
          </button>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
            title="மூடு (Close Keyboard)"
            aria-label="Close Keyboard"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Candidate / Suggestion Strip */}
      <div className={styles.candidateStrip}>
        {candidates.map((word, idx) => (
          <button
            key={idx}
            type="button"
            className={`${styles.candidateChip} ${idx === 0 && buffer ? styles.candidateChipActive : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              commitText(word + ' ');
            }}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Keypad Body */}
      <div className={styles.keypadBody}>
        {mode === 'phonetic' ? (
          <>
            {/* Row 1 */}
            <div className={styles.keyRow}>
              {QWERTY_ROW_1.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={styles.key}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setBuffer((prev) => prev + ch);
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Row 2 */}
            <div className={styles.keyRow}>
              {QWERTY_ROW_2.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={styles.key}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setBuffer((prev) => prev + ch);
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Row 3 */}
            <div className={styles.keyRow}>
              {QWERTY_ROW_3.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={styles.key}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setBuffer((prev) => prev + ch);
                  }}
                >
                  {ch}
                </button>
              ))}
              <button
                type="button"
                className={`${styles.key} ${styles.keySpecial}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleBackspace();
                }}
                title="Backspace"
                aria-label="Backspace"
              >
                <Delete size={16} />
              </button>
            </div>

            {/* Row 4 */}
            <div className={styles.keyRow}>
              <button
                type="button"
                className={`${styles.key} ${styles.keySpecial}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setBuffer('');
                }}
                title="Clear"
              >
                அழி
              </button>

              <button
                type="button"
                className={`${styles.key} ${styles.keySpace}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSpace();
                }}
              >
                {buffer ? `இடைவெளி (${transliterateWord(buffer)})` : 'இடைவெளி (Space)'}
              </button>

              <button
                type="button"
                className={`${styles.key} ${styles.keyNext}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (buffer.trim() && candidates.length > 0) {
                    commitText(candidates[0]);
                  }
                  navigateField('next');
                }}
              >
                அடுத்தது <ArrowRight size={14} style={{ display: 'inline', marginLeft: 4 }} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Tamil 99 Vowels */}
            <div className={styles.keyRow}>
              {TAMIL99_ROW_1.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`${styles.key} ${styles.tamilCharKey}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitText(ch);
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Tamil 99 Consonants 1 */}
            <div className={styles.keyRow}>
              {TAMIL99_ROW_2.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`${styles.key} ${styles.tamilCharKey}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitText(ch);
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Tamil 99 Consonants 2 */}
            <div className={styles.keyRow}>
              {TAMIL99_ROW_3.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`${styles.key} ${styles.tamilCharKey}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitText(ch);
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Tamil 99 Matras */}
            <div className={styles.keyRow}>
              {TAMIL99_ROW_4.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`${styles.key} ${styles.matraKey}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitText(ch);
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className={styles.keyRow}>
              <button
                type="button"
                className={`${styles.key} ${styles.keySpecial}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleBackspace();
                }}
                title="Backspace"
              >
                <Delete size={16} />
              </button>

              <button
                type="button"
                className={`${styles.key} ${styles.keySpace}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitText(' ');
                }}
              >
                இடைவெளி (Space)
              </button>

              <button
                type="button"
                className={`${styles.key} ${styles.keyNext}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  navigateField('next');
                }}
              >
                அடுத்தது <ArrowRight size={14} style={{ display: 'inline', marginLeft: 4 }} />
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
