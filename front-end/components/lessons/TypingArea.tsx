// components/lessons/TypingArea.tsx
'use client';

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  KeyboardEvent,
  useMemo,
  ReactNode,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { useParams } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import KeyboardDetectionWizard from '@/components/lessons/KeyboardDetectionWizard';
import {
  getDeadKey,
  KeyboardLayout,
} from '@/lib/keyboardLayouts';
import { getCharacterForPhysicalKey } from '@/lib/keyMappings';
import { composeDeadKeyInput, PendingDeadKey } from '@/lib/deadKeyInput';
import { getPhysicalKeyIdForCode, type PhysicalKeyId } from '@/lib/keyboardPhysical';
import { useKeyboardLayout } from '@/hooks/useKeyboardLayout';
import {
  normalizeTypingText,
  splitGraphemes,
  TYPING_TELEMETRY_VERSION,
  type TypingTelemetry,
  type TypingTelemetryEvent,
} from '@/lib/typingTelemetry';
import { Hourglass, Keyboard as KeyboardIcon, MousePointer2, RefreshCw } from 'lucide-react';

interface TypingAreaProps {
  text: string;
  onComplete?: (stats: TypingStats) => void;
  onError?: (key: string, expected: string) => void;
  onExpectedKeyChange?: (key: string | null) => void;
  selectedLayout: KeyboardLayout;
  onLayoutChange: (layout: KeyboardLayout) => Promise<void> | void;
  showLiveWpm?: boolean;
  onNewText?: () => void;
  newTextLabel?: string;
}

export interface KeystrokeEvent {
  key: string;
  timestamp: number;
  correct: boolean;
  expected: string;
  position: number;
  techniqueCorrect?: boolean;
}

export interface PhysicalKeyEvent {
  key: string;
  code: string;
  timestamp: number;
  shiftKey: boolean;
}

export interface TypingStats {
  grossWpm: number;
  netWpm: number;
  score: number;
  accuracy: number;
  correctChars: number;
  totalChars: number;
  timeElapsed: number;
  keystrokes?: KeystrokeEvent[];
  physicalEvents?: PhysicalKeyEvent[];
  telemetry?: TypingTelemetry;
}

export interface TypingAreaRef {
  reset: () => void;
}

const FONT_OPTIONS = [
  { name: 'JetBrains Mono', variable: 'var(--font-jetbrains)' },
  { name: 'Fira Code', variable: 'var(--font-fira)' },
  { name: 'Source Code Pro', variable: 'var(--font-source)' },
  { name: 'IBM Plex Mono', variable: 'var(--font-ibm)' },
  { name: 'Courier Prime', variable: 'var(--font-courier)' },
];

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;
const INACTIVITY_PAUSE_DELAY = 6000;
const TYPING_AREA_LINE_HEIGHT_MULTIPLIER = 1.8;
const TYPING_AREA_VISIBLE_LINES = 3;
const TYPING_AREA_VERTICAL_PADDING_PX = 48;
const TYPING_AREA_BORDER_WIDTH_PX = 2;
const LEFT_HAND_LETTER_KEY_IDS = new Set<PhysicalKeyId>([
  'P16', 'P17', 'P18', 'P19', 'P20', 'P30', 'P31', 'P32', 'P33', 'P34',
  'P43', 'P44', 'P45', 'P46', 'P47', 'P48',
] as PhysicalKeyId[]);
const ACCENTED_VOWELS = new Set(Array.from('áéíóúÁÉÍÓÚ'));
const DIAERESIS_VOWELS = new Set(['ü', 'Ü']);

const normalizeCommittedText = normalizeTypingText;

function resolveTypedChar(
  physicalKeyId: PhysicalKeyId,
  layoutId: string,
  shiftKey: boolean,
): string | undefined | null {
  const layoutChar = getCharacterForPhysicalKey(physicalKeyId, layoutId, shiftKey);
  return layoutChar ? normalizeCommittedText(layoutChar) : undefined;
}

function getRenderedChar(char: string): string {
  if (char === ' ') return '\u00A0';
  return char;
}

function getCharacterClass({
  isCorrect,
  isWrong,
  isCurrent,
}: {
  isCorrect: boolean;
  isWrong: boolean;
  isCurrent: boolean;
}): string {
  if (isWrong) {
    return 'inline-flex min-w-[0.625em] items-center justify-center rounded bg-(--accent-red-bg) px-[0.05em] text-(--typing-area-incorrect-text)';
  }

  if (isCurrent) {
    return 'inline-flex min-w-[0.625em] items-center justify-center rounded bg-(--accent-yellow-bg) light:bg-(--typing-area-resume-notice-light-background) px-[0.05em] text-(--text-primary) light:text-(--typing-area-current-key-light-text)';
  }

  if (isCorrect) {
    return 'inline-flex min-w-[0.625em] items-center justify-center px-[0.05em] text-(--typing-area-correct-text)';
  }

  return 'inline-flex min-w-[0.625em] items-center justify-center px-[0.05em] text-(--text-secondary) dark:text-(--text-inverse) light:text-(--typing-area-text-light-color)';
}

const TypingArea = forwardRef<TypingAreaRef, TypingAreaProps>(function TypingArea(
  {
    text,
    onComplete,
    onError,
    onExpectedKeyChange,
    selectedLayout,
    onLayoutChange,
    showLiveWpm = true,
    onNewText,
    newTextLabel,
  },
  ref,
) {
  const params = useParams();
  const lang = toSupportedLocale(params?.lang);
  const t = useTranslations(lang);
  const {
    hasPhysicalFamilyPreference,
    isDetectionOpen,
    isReady: isKeyboardLayoutReady,
    openDetection,
    closeDetection,
    getLayoutsForLanguage,
    setPhysicalFamily,
  } = useKeyboardLayout();
  const [input, setInput] = useState('');
  const normalizedText = useMemo(() => normalizeTypingText(text), [text]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [backspaceEnabled, setBackspaceEnabled] = useState(true);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState<number | null>(null);
  const [totalPausedDuration, setTotalPausedDuration] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [isKeyboardDropdownOpen, setIsKeyboardDropdownOpen] = useState(false);
  const keyboardDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState(() => {
    if (typeof window !== 'undefined')
      return localStorage.getItem('typing-font') || FONT_OPTIONS[0].variable;
    return FONT_OPTIONS[0].variable;
  });
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('typing-font-size');
      return saved ? parseInt(saved, 10) : 22;
    }
    return 22;
  });
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollTextRef = useRef<string | null>(null);
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const correctCharsRef = useRef(0);
  const pendingDeadKeyRef = useRef<PendingDeadKey | null>(null);
  const onCompleteRef = useRef(onComplete);
  const keystrokesRef = useRef<KeystrokeEvent[]>([]);
  const physicalEventsRef = useRef<PhysicalKeyEvent[]>([]);
  const telemetryEventsRef = useRef<TypingTelemetryEvent[]>([]);
  const typingStartTimeRef = useRef<number | null>(null);
  const pressedShiftKeyIdsRef = useRef(new Set<PhysicalKeyId>());
  const inputValueRef = useRef('');

  const [stats, setStats] = useState<TypingStats>({
    grossWpm: 0,
    netWpm: 0,
    score: 0,
    accuracy: 100,
    correctChars: 0,
    totalChars: 0,
    timeElapsed: 0,
  });
  const prevTextRef = useRef(text);

  useEffect(() => {
    inputValueRef.current = input;
  }, [input]);

  useEffect(() => {
    pendingDeadKeyRef.current = null;
  }, [selectedLayout.id]);

  useEffect(() => {
    if (prevTextRef.current !== text) {
      prevTextRef.current = text;
      setInput('');
      setStartTime(null);
      typingStartTimeRef.current = null;
      setIsCompleted(false);
      setTotalPausedDuration(0);
      setIsAutoPaused(false);
      setPausedTime(null);
      keystrokesRef.current = [];
      physicalEventsRef.current = [];
      telemetryEventsRef.current = [];
      pressedShiftKeyIdsRef.current.clear();
      pendingDeadKeyRef.current = null;
      correctCharsRef.current = 0;
      setStats({
        grossWpm: 0,
        netWpm: 0,
        score: 0,
        accuracy: 100,
        correctChars: 0,
        totalChars: 0,
        timeElapsed: 0,
      });
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      inputValueRef.current = '';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [text]);

  useImperativeHandle(ref, () => ({
    reset() {
      setInput('');
      setStartTime(null);
      typingStartTimeRef.current = null;
      setIsCompleted(false);
      setTotalPausedDuration(0);
      setIsAutoPaused(false);
      setPausedTime(null);
      keystrokesRef.current = [];
      physicalEventsRef.current = [];
      telemetryEventsRef.current = [];
      pressedShiftKeyIdsRef.current.clear();
      pendingDeadKeyRef.current = null;
      correctCharsRef.current = 0;
      setStats({
        grossWpm: 0,
        netWpm: 0,
        score: 0,
        accuracy: 100,
        correctChars: 0,
        totalChars: 0,
        timeElapsed: 0,
      });
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      inputValueRef.current = '';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
  }));

  useLayoutEffect(() => {
    const container = inputRef.current;
    if (!container) return;

    const currentEl = container.querySelector<HTMLElement>('[data-current-char="true"]');
    const targetEl = currentEl ?? (container.lastElementChild as HTMLElement | null);
    if (!targetEl) return;

    const lineHeightPx = fontSize * TYPING_AREA_LINE_HEIGHT_MULTIPLIER;
    const relativeTop =
      targetEl.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop;
    const lineIndex = Math.round(relativeTop / lineHeightPx);
    const targetScrollTop = Math.max(0, (lineIndex - 1) * lineHeightPx);

    const isNewText = scrollTextRef.current !== text;
    scrollTextRef.current = text;

    if (isNewText) {
      container.scrollTop = targetScrollTop;
    } else {
      container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    }
  }, [input, text, fontSize]);

  useEffect(() => {
    if (inputRef.current && !isCompleted) inputRef.current.focus();
  }, [isCompleted]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    onExpectedKeyChange?.(isCompleted ? null : (text[input.length] ?? null));
  }, [input.length, isCompleted, onExpectedKeyChange, text]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (keyboardDropdownRef.current && !keyboardDropdownRef.current.contains(e.target as Node))
        setIsKeyboardDropdownOpen(false);
    };
    if (isKeyboardDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isKeyboardDropdownOpen]);

  useEffect(() => {
    localStorage.setItem('typing-font', selectedFont);
  }, [selectedFont]);
  useEffect(() => {
    localStorage.setItem('typing-font-size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsFontDropdownOpen(false);
    };
    if (isFontDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFontDropdownOpen]);

  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
  }, []);
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      if (isAutoPaused || isCompleted) return;
      const now = Date.now();
      const effectiveElapsed = (now - startTime - totalPausedDuration) / 1000;
      const elapsed = Math.max(0, effectiveElapsed);
      const correctChars = correctCharsRef.current;
      const totalChars = splitGraphemes(input).length;
      const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
      const grossWpm = calculateGrossWPM(totalChars, elapsed);
      const accuracyRatio = accuracy / 100;
      const netWpm = Math.round(grossWpm * accuracyRatio ** 3);
      const score = Math.round(netWpm * 100);
      const newStats: TypingStats = {
        grossWpm,
        netWpm,
        score,
        accuracy,
        correctChars,
        totalChars,
        timeElapsed: Math.floor(elapsed),
        keystrokes: keystrokesRef.current,
        physicalEvents: physicalEventsRef.current,
        telemetry: {
          version: TYPING_TELEMETRY_VERSION,
          text: normalizedText,
          startedAt: startTime,
          pausedMs: totalPausedDuration,
          events: telemetryEventsRef.current,
        },
      };
      setStats(newStats);
      if (input.length >= text.length && !isCompleted) {
        setIsCompleted(true);
        const finalInput = splitGraphemes(normalizeCommittedText(input));
        const expectedInput = splitGraphemes(normalizedText);
        const finalCorrectChars = finalInput.reduce(
          (total, character, index) => total + Number(character === expectedInput[index]),
          0,
        );
        const finalTotalChars = finalInput.length;
        const finalAccuracy =
          finalTotalChars > 0 ? Math.round((finalCorrectChars / finalTotalChars) * 100) : 100;
        const finalGrossWpm = calculateGrossWPM(finalTotalChars, elapsed);
        const finalNetWpm = Math.round(finalGrossWpm * (finalAccuracy / 100) ** 3);
        const finalStats: TypingStats = {
          ...newStats,
          grossWpm: finalGrossWpm,
          netWpm: finalNetWpm,
          score: Math.round(finalNetWpm * 100),
          accuracy: finalAccuracy,
          correctChars: finalCorrectChars,
          totalChars: finalTotalChars,
          keystrokes: keystrokesRef.current,
          physicalEvents: physicalEventsRef.current,
          telemetry: {
            version: TYPING_TELEMETRY_VERSION,
            text: normalizedText,
            startedAt: startTime,
            pausedMs: totalPausedDuration,
            events: telemetryEventsRef.current,
          },
        };
        setStats(finalStats);
        onCompleteRef.current?.(finalStats);
        clearInterval(interval);
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
          inactivityTimeoutRef.current = null;
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, input, normalizedText, isCompleted, isAutoPaused, totalPausedDuration, text.length]);

  const pauseTimer = () => {
    if (!startTime || isCompleted || input.length === 0) return;
    if (isAutoPaused && pausedTime) {
      const elapsed = Date.now() - pausedTime;
      setTotalPausedDuration((prev) => prev + elapsed);
    }
    if (!isAutoPaused) {
      setIsAutoPaused(true);
      setPausedTime(Date.now());
    }
  };

  const resumeTimer = () => {
    if (isAutoPaused && pausedTime) {
      const pauseDuration = Date.now() - pausedTime;
      setTotalPausedDuration((prev) => prev + pauseDuration);
      setIsAutoPaused(false);
      setPausedTime(null);
    }
  };

  const resetInactivityTimer = () => {
    lastActivityTimeRef.current = Date.now();
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    if (startTime && !isCompleted && input.length > 0 && !isAutoPaused) {
      inactivityTimeoutRef.current = setTimeout(() => {
        pauseTimer();
      }, INACTIVITY_PAUSE_DELAY);
    }
    if (isAutoPaused) resumeTimer();
  };

  const pauseForBlur = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
    pauseTimer();
  };

  const calculateGrossWPM = (totalChars: number, elapsedSeconds: number): number => {
    if (elapsedSeconds <= 0) return 0;
    const minutes = elapsedSeconds / 60;
    const words = totalChars / 5;
    return Math.round(words / minutes);
  };
  const handleFontSizeChange = (delta: number) => {
    setFontSize((prev) => Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, prev + delta)));
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    resetInactivityTimer();
    const currentInput = inputValueRef.current;
    const eventTimestamp = Date.now();
    if (typingStartTimeRef.current === null) {
      typingStartTimeRef.current = eventTimestamp;
      setStartTime(eventTimestamp);
    }
    const physicalKeyId = getPhysicalKeyIdForCode(e.code);
    physicalEventsRef.current.push({
      key: e.key,
      code: e.code,
      timestamp: eventTimestamp,
      shiftKey: e.shiftKey,
    });
    const recordEvent = (event: Omit<TypingTelemetryEvent, 'sequence' | 'timestamp' | 'code' | 'key'>) => {
      telemetryEventsRef.current.push({
        sequence: telemetryEventsRef.current.length,
        timestamp: eventTimestamp,
        code: e.code,
        key: e.key,
        shiftKey: e.shiftKey,
        ...event,
      });
    };
    // Conserva el evento físico aunque no produzca un carácter lógico.
    recordEvent({
      kind: physicalKeyId === 'P42' || physicalKeyId === 'P55' ? 'modifier' : 'control',
      position: splitGraphemes(currentInput).length,
    });

    if (physicalKeyId === 'P42' || physicalKeyId === 'P55') {
      pressedShiftKeyIdsRef.current.add(physicalKeyId);
    }

    if (currentInput.length >= text.length) {
      if (e.key !== 'Backspace') {
        e.preventDefault();
        return;
      }
    }

    if (e.metaKey || (e.ctrlKey && !e.altKey)) {
      return;
    }

    if (physicalKeyId && getDeadKey(selectedLayout, physicalKeyId, e.shiftKey)) {
      e.preventDefault();
      pendingDeadKeyRef.current = { physicalKeyId, shiftKey: e.shiftKey };
      recordEvent({ kind: 'dead-key', position: splitGraphemes(currentInput).length, composing: true });
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      pendingDeadKeyRef.current = null;
      const tabChars = '  ';
      const expectedAt = text.slice(currentInput.length, currentInput.length + tabChars.length);
      let matchCount = 0;
      for (let i = 0; i < tabChars.length; i++) {
        if (tabChars[i] === expectedAt[i]) matchCount++;
      }
      correctCharsRef.current += matchCount;
      const isCorrect = expectedAt === tabChars;
      keystrokesRef.current.push({
        key: tabChars,
        timestamp: Date.now(),
        correct: isCorrect,
        expected: expectedAt.slice(0, tabChars.length).replace(/\t/g, '  '),
        position: currentInput.length,
      });
      const nextInput = currentInput + tabChars;
      inputValueRef.current = nextInput;
      setInput(nextInput);
      if (!isCorrect) onError?.(tabChars, expectedAt);
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (pendingDeadKeyRef.current) {
        recordEvent({ kind: 'backspace', position: splitGraphemes(currentInput).length, composing: true });
        pendingDeadKeyRef.current = null;
        return;
      }
      if (!backspaceEnabled) return;
      recordEvent({ kind: 'backspace', position: splitGraphemes(currentInput).length });
      if (currentInput.length > 0) {
        const lastChar = currentInput[currentInput.length - 1];
        const expectedChar = text[currentInput.length - 1];
        if (normalizeCommittedText(lastChar) === normalizeCommittedText(expectedChar)) {
          correctCharsRef.current -= 1;
        }

      }
      const nextInput = currentInput.slice(0, -1);
      keystrokesRef.current = keystrokesRef.current.filter(
        (keystroke) => keystroke.position < nextInput.length,
      );
      inputValueRef.current = nextInput;
      setInput(nextInput);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      pendingDeadKeyRef.current = null;
      const expectedChar = text[currentInput.length];
      const isCorrect = normalizeCommittedText(expectedChar) === '\n';
      if (isCorrect) correctCharsRef.current += 1;
      keystrokesRef.current.push({
        key: '\n',
        timestamp: Date.now(),
        correct: isCorrect,
        expected: expectedChar,
        position: currentInput.length,
      });
      if (isCorrect) {
        const nextInput = currentInput + '\n';
        inputValueRef.current = nextInput;
        setInput(nextInput);
      } else onError?.('Enter', expectedChar);
      return;
    }
    if (!physicalKeyId) return;
    const resolvedChar = resolveTypedChar(physicalKeyId, selectedLayout.id, e.shiftKey);
    if (resolvedChar === null || resolvedChar === undefined) return;
    e.preventDefault();
    const pendingDeadKey = pendingDeadKeyRef.current;
    pendingDeadKeyRef.current = null;
    const char = pendingDeadKey
      ? composeDeadKeyInput(pendingDeadKey, resolvedChar, selectedLayout)
      : resolvedChar;
    const expectedChar = text[currentInput.length];
    const isCorrect = normalizeCommittedText(char) === normalizeCommittedText(expectedChar);
    const requiredShiftKeyId = LEFT_HAND_LETTER_KEY_IDS.has(physicalKeyId)
      ? ('P55' as PhysicalKeyId)
      : ('P42' as PhysicalKeyId);
    const techniqueCorrect =
      ACCENTED_VOWELS.has(char) || DIAERESIS_VOWELS.has(char)
        ? pendingDeadKey !== null &&
          getDeadKey(selectedLayout, pendingDeadKey.physicalKeyId, pendingDeadKey.shiftKey)
            ?.combiningMark === (DIAERESIS_VOWELS.has(char) ? '\u0308' : '\u0301')
        : expectedChar?.toLocaleUpperCase('es') === expectedChar &&
            expectedChar?.toLocaleLowerCase('es') !== expectedChar
          ? pressedShiftKeyIdsRef.current.has(requiredShiftKeyId)
          : true;
    if (isCorrect) correctCharsRef.current += 1;
    keystrokesRef.current.push({
      key: char,
      timestamp: Date.now(),
      correct: isCorrect,
      expected: expectedChar,
      position: currentInput.length,
      techniqueCorrect,
    });
    recordEvent({
      kind: 'input',
      position: splitGraphemes(currentInput).length,
      expected: expectedChar,
      typed: char,
      correct: isCorrect,
      composing: pendingDeadKey !== null,
    });
    if (!isCorrect) onError?.(char, expectedChar);
    const nextInput = currentInput + char;
    inputValueRef.current = nextInput;
    setInput(nextInput);
  };

  const renderedText = useMemo(() => {
    const nodes: ReactNode[] = [];
    let currentWordChars: ReactNode[] = [];
    let currentWordStart = 0;
    let pendingSpace = false;

    const flushWord = (endIndex: number) => {
      if (currentWordChars.length === 0) return;

      nodes.push(
        <span
          key={`word-${currentWordStart}-${endIndex}`}
          className="inline-flex flex-nowrap align-baseline"
        >
          {currentWordChars}
        </span>,
      );

      currentWordChars = [];
      pendingSpace = false;
    };

    for (let index = 0; index < text.length; index++) {
      const char = text[index];
      const isTyped = index < input.length;
      const isCorrect = isTyped && input[index] === char;
      const isWrong = isTyped && input[index] !== char;
      const isCurrent = index === input.length;
      const displayedChar = isWrong ? input[index] : char;
      const className = getCharacterClass({ isCorrect, isWrong, isCurrent });

      if (char === '\n') {
        flushWord(index);
        nodes.push(<br key={`br-${index}`} />);
        continue;
      }

      if (char === ' ') {
        if (currentWordChars.length === 0) {
          currentWordStart = index;
        }

        currentWordChars.push(
          <span
            key={`space-${index}`}
            className={className}
            data-current-char={isCurrent ? 'true' : undefined}
          >
            {getRenderedChar(displayedChar)}
          </span>,
        );
        pendingSpace = true;
        continue;
      }

      if (currentWordChars.length === 0) {
        currentWordStart = index;
      } else if (pendingSpace) {
        flushWord(index - 1);
        currentWordStart = index;
      }
      pendingSpace = false;

      currentWordChars.push(
        <span
          key={`char-${index}`}
          className={className}
          data-current-char={isCurrent ? 'true' : undefined}
        >
          {getRenderedChar(displayedChar)}
        </span>,
      );
    }

    flushWord(text.length);
    return nodes;
  }, [text, input]);

  const panelBg = 'bg-(--bg-secondary)';
  const panelBorder = 'border border-(--border-card)';
  const dropdownBg = 'bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none';
  const dropdownBorder = 'border border-(--border-card)';
  const dropdownItem = 'text-(--text-secondary) hover:bg-(--bg-secondary)';
  const dropdownItemActive = 'bg-(--accent-blue-bg) text-(--accent-blue)';

  return (
    <div className="space-y-2">
      {isKeyboardLayoutReady && !hasPhysicalFamilyPreference && !isCompleted && (
        <div
          role="status"
          className="text-(--accent-yellow) light:text-(--typing-area-resume-notice-light-text) text-sm flex flex-wrap items-center gap-2 bg-(--accent-yellow-bg) light:bg-(--typing-area-resume-notice-light-background) border border-(--accent-yellow-border) light:border-(--typing-area-resume-notice-light-background) rounded-lg px-3 py-2"
        >
          <KeyboardIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t('components.lessons.typingArea.general.keyboardPreferenceMissing')}</span>
          <button
            type="button"
            onClick={openDetection}
            className="ml-auto rounded-md bg-(--keyboard-modifier-key-background) px-2.5 py-1 text-xs font-semibold text-(--text-inverse) transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--keyboard-modifier-key-background) light:bg-[#475569] light:hover:bg-[#3f4f65] light:focus-visible:outline-[#475569]"
          >
            {t('components.lessons.typingArea.general.identifyKeyboardShape')}
          </button>
        </div>
      )}
      <div className={`${panelBg} rounded-lg py-2 px-3 ${panelBorder}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-0 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <span className="inline-flex min-w-[4ch] justify-end font-bold tabular-nums text-(--accent-green) light:text-(--typing-area-accuracy-stat-light-color) text-base sm:text-lg">
                {stats.accuracy}%
              </span>
              <span className="text-white light:text-(--typing-area-text-light-color)">
                {t('components.lessons.typingArea.general.accuracy')}
              </span>
            </div>
            <span className="mx-2 text-(--text-tertiary)">|</span>
            <div className="flex items-center gap-1">
              <span className="inline-flex min-w-[5ch] justify-end font-bold tabular-nums text-(--accent-purple) light:text-(--typing-area-score-stat-light-color) text-base sm:text-lg">
                {stats.score}
              </span>
              <span className="text-white light:text-(--typing-area-text-light-color)">
                {t('components.lessons.typingArea.general.score')}
              </span>
            </div>
            {showLiveWpm && (
              <>
                <span className="mx-2 text-(--text-tertiary)">|</span>
                <div className="flex items-center gap-1">
                  <span className="inline-flex min-w-[3ch] justify-end font-bold tabular-nums text-(--accent-blue) light:text-(--typing-area-wpm-stat-light-color) text-base sm:text-lg">
                    {stats.grossWpm}
                  </span>
                  <span className="text-white light:text-(--typing-area-text-light-color)">
                    {t('components.lessons.typingArea.general.wpm')}
                  </span>
                </div>
              </>
            )}
            <span className="mx-2 hidden text-(--text-tertiary) xs:inline">|</span>
            <div className="hidden xs:flex items-center gap-1">
              <span className="inline-flex min-w-[3ch] justify-end font-bold tabular-nums text-(--text-primary) light:text-(--typing-area-characters-stat-light-color) text-base sm:text-lg">
                {stats.correctChars}
              </span>
              <span className="text-(--text-secondary) light:text-(--typing-area-text-light-color)">
                {t('components.lessons.typingArea.general.characters')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                role="switch"
                aria-label={t('components.lessons.typingArea.general.backspace')}
                aria-checked={backspaceEnabled}
                onClick={() => setBackspaceEnabled(!backspaceEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${backspaceEnabled ? 'bg-(--accent-blue) light:bg-(--lesson-card-time-stat-value-light-color)' : 'bg-(--text-tertiary)'}`}
                title={
                  backspaceEnabled
                    ? t('components.lessons.typingArea.general.backspaceEnabled')
                    : t('components.lessons.typingArea.general.backspaceDisabled')
                }
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-(--text-inverse) transition-transform ${backspaceEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                aria-label={t('components.lessons.typingArea.general.fontAndSize')}
                aria-expanded={isFontDropdownOpen}
                aria-controls="typing-font-settings"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-white hover:text-white hover:bg-(--bg-secondary) transition-colors border border-transparent dark:bg-(--typing-area-toolbar-button-dark-background) dark:border-(--typing-area-toolbar-button-dark-border) light:text-(--typing-area-text-light-color) light:bg-(--typing-area-toolbar-button-light-background) light:border-(--typing-area-toolbar-button-light-border) light:hover:bg-(--bg-card-hover) light:hover:text-(--typing-area-text-light-color)"
                title={t('components.lessons.typingArea.general.fontAndSize')}
              >
                <span className="text-sm font-medium">Aa</span>
                <svg
                  aria-hidden="true"
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isFontDropdownOpen && (
                <div
                  id="typing-font-settings"
                  className={`absolute right-0 mt-2 w-80 ${dropdownBg} rounded-lg ${dropdownBorder} shadow-xl p-3 z-50`}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-(--text-tertiary) mb-2 uppercase tracking-wider">
                        {t('components.lessons.typingArea.general.font')}
                      </h4>
                      <div className="space-y-1">
                        {FONT_OPTIONS.map((font) => (
                          <button
                            type="button"
                            key={font.name}
                            onClick={() => {
                              setSelectedFont(font.variable);
                              setIsFontDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedFont === font.variable ? dropdownItemActive : dropdownItem}`}
                            style={{ fontFamily: font.variable }}
                          >
                            {font.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-(--text-tertiary) mb-2 uppercase tracking-wider">
                        {t('components.lessons.typingArea.general.size')}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`${t('components.lessons.typingArea.general.size')} −`}
                          onClick={() => handleFontSizeChange(-2)}
                          className="w-8 h-8 flex items-center justify-center rounded bg-(--bg-secondary) hover:bg-(--bg-card-hover) text-(--text-primary) text-lg"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          aria-label={t('components.lessons.typingArea.general.size')}
                          min={MIN_FONT_SIZE}
                          max={MAX_FONT_SIZE}
                          value={fontSize}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val))
                              setFontSize(Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, val)));
                          }}
                          className="w-16 px-2 py-1 bg-(--bg-secondary) border border-(--border-card) rounded text-(--text-primary) text-center text-sm"
                        />
                        <button
                          type="button"
                          aria-label={`${t('components.lessons.typingArea.general.size')} +`}
                          onClick={() => handleFontSizeChange(2)}
                          className="w-8 h-8 flex items-center justify-center rounded bg-(--bg-secondary) hover:bg-(--bg-card-hover) text-(--text-primary) text-lg"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-(--text-tertiary) mt-2">
                        {MIN_FONT_SIZE}-{MAX_FONT_SIZE}{' '}
                        {t('components.lessons.typingArea.general.pixels')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative" ref={keyboardDropdownRef}>
              <button
                type="button"
                onClick={() => setIsKeyboardDropdownOpen(!isKeyboardDropdownOpen)}
                aria-label={t('components.lessons.typingArea.general.keyboardConfigTitle')}
                aria-expanded={isKeyboardDropdownOpen}
                aria-controls="typing-keyboard-settings"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-white hover:text-white hover:bg-(--bg-secondary) transition-colors border border-transparent dark:bg-(--typing-area-toolbar-button-dark-background) dark:border-(--typing-area-toolbar-button-dark-border) light:text-(--typing-area-text-light-color) light:bg-(--typing-area-toolbar-button-light-background) light:border-(--typing-area-toolbar-button-light-border) light:hover:bg-(--bg-card-hover) light:hover:text-(--typing-area-text-light-color)"
                title={t('components.lessons.typingArea.general.keyboardConfigTitle')}
              >
                <span className="text-lg">⌨️</span>
                <svg
                  aria-hidden="true"
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 26 26"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isKeyboardDropdownOpen && (
                <div
                  id="typing-keyboard-settings"
                  className={`absolute right-0 mt-2 w-80 ${dropdownBg} rounded-lg ${dropdownBorder} shadow-xl p-3 z-50`}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-(--text-tertiary) mb-2 uppercase tracking-wider">
                        {t('components.lessons.typingArea.general.logicalDistributionHeading')}{' '}
                        <span className="normal-case font-normal tracking-normal">
                          ({t('components.lessons.typingArea.general.logicalDistributionHint')})
                        </span>
                      </h4>
                      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                        {getLayoutsForLanguage(lang).map((layout) => (
                          <button
                            type="button"
                            key={layout.id}
                            onClick={() => {
                              onLayoutChange(layout);
                              setIsKeyboardDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedLayout.id === layout.id ? dropdownItemActive : dropdownItem}`}
                          >
                            <div className="font-medium">
                              {layout.name}
                            </div>
                            {layout.description && (
                              <div className="text-xs text-(--text-tertiary) truncate">
                                {layout.description}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-xs font-semibold text-(--text-tertiary) mb-2 uppercase tracking-wider">
                        {t('components.lessons.typingArea.general.keyboardShapeHeading')}
                      </h4>
                      <p className="text-xs text-(--text-tertiary) mb-3">
                        {t('components.lessons.typingArea.general.detectionHelp')}
                      </p>
                      <button
                        type="button"
                        className="mt-auto w-full rounded-md bg-(--keyboard-modifier-key-background) px-3 py-2 text-center text-sm text-(--text-inverse) transition-colors hover:brightness-110 light:bg-[#475569] light:hover:bg-[#3f4f65]"
                        onClick={() => {
                          setIsKeyboardDropdownOpen(false);
                          openDetection();
                        }}
                      >
                        {t('components.lessons.typingArea.general.detectKeyboard')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {onNewText && (
              <button
                type="button"
                onClick={onNewText}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-white hover:text-white hover:bg-(--bg-secondary) transition-colors border border-transparent dark:bg-(--typing-area-toolbar-button-dark-background) dark:border-(--typing-area-toolbar-button-dark-border) light:text-(--typing-area-text-light-color) light:bg-(--typing-area-toolbar-button-light-background) light:border-(--typing-area-toolbar-button-light-border) light:hover:bg-(--bg-card-hover) light:hover:text-(--typing-area-text-light-color)"
                title={newTextLabel}
                aria-label={newTextLabel}
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">{newTextLabel}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDetectionOpen}
        onClose={closeDetection}
        title={t('components.lessons.keyboardDetectionWizard.general.modalTitle')}
        closeLabel={t('components.lessons.keyboardDetectionWizard.general.close')}
        hideFooter
        panelClassName="max-w-4xl"
      >
        <KeyboardDetectionWizard
          lang={lang}
          embedded
          onSelectPhysicalFamily={setPhysicalFamily ?? (() => undefined)}
          onComplete={closeDetection}
        />
      </Modal>

      <div
        ref={inputRef}
        role="textbox"
        aria-readonly="true"
        tabIndex={isCompleted ? -1 : 0}
        onKeyDown={handleKeyDown}
        onKeyUp={(e) => {
          const physicalKeyId = getPhysicalKeyIdForCode(e.code);
          if (physicalKeyId === 'P42' || physicalKeyId === 'P55') {
            pressedShiftKeyIdsRef.current.delete(physicalKeyId);
          }
        }}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={() => {
          if (isAutoPaused) {
            resumeTimer();
            resetInactivityTimer();
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          pendingDeadKeyRef.current = null;
          setIsFocused(false);
          pauseForBlur();
        }}
        className={`select-text w-full p-6 bg-(--bg-secondary) border rounded-xl overflow-hidden leading-[1.8] whitespace-pre-wrap break-normal [overflow-wrap:normal] text-(--text-primary) shadow-inner outline-none transition-all ${isFocused && !isCompleted ? 'border-(--accent-blue) ring-2 ring-(--accent-blue-border)' : 'border-(--border-card)'} ${isCompleted ? 'cursor-not-allowed opacity-80' : ''}`}
        style={{
          fontFamily: selectedFont,
          fontSize: `${fontSize}px`,
          caretColor: 'transparent',
          height: `${fontSize * TYPING_AREA_LINE_HEIGHT_MULTIPLIER * TYPING_AREA_VISIBLE_LINES + TYPING_AREA_VERTICAL_PADDING_PX + TYPING_AREA_BORDER_WIDTH_PX}px`,
        }}
        aria-label={t('components.lessons.typingArea.general.textToType')}
      >
        {renderedText}
      </div>

      {(isAutoPaused || !isFocused) && !isCompleted && (
        <div className="text-(--accent-yellow) light:text-(--typing-area-resume-notice-light-text) text-sm flex items-center gap-2 bg-(--accent-yellow-bg) light:bg-(--typing-area-resume-notice-light-background) border border-(--accent-yellow-border) light:border-(--typing-area-resume-notice-light-background) rounded-lg px-3 py-2">
          {!isFocused ? (
            <MousePointer2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <Hourglass className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>
            {!isFocused
              ? t('components.lessons.typingArea.general.clickToResume')
              : t('components.lessons.typingArea.general.inactivityPaused')}
          </span>
        </div>
      )}

      {isCompleted && (
        <div className="bg-(--accent-green-bg) border border-(--accent-green-border) text-(--accent-green) px-3 py-2 rounded-lg text-sm">
          {t('components.lessons.typingArea.general.congratulations')
            .replace('{wpm}', stats.grossWpm.toString())
            .replace('{accuracy}', stats.accuracy.toString())}
        </div>
      )}
    </div>
  );
});

export default TypingArea;
