// hooks/useTypingInput.ts
import { useState, useRef, KeyboardEvent } from 'react';
import { getCharacterForPhysicalKey } from '@/lib/keyMappings';
import { KeyboardLayout } from '@/lib/keyboardLayouts';
import { getPhysicalKeyIdForCode, type PhysicalKeyId } from '@/lib/keyboardPhysical';
import { KeystrokeEvent } from '@/components/lessons/TypingArea';

interface UseTypingInputProps {
  text: string;
  selectedLayout: KeyboardLayout;
  onError?: (key: string, expected: string) => void;
}

function normalizeCommittedText(value: string): string {
  return value.normalize('NFC');
}

function resolveTypedChar(
  physicalKeyId: PhysicalKeyId,
  layoutId: string,
  shiftKey: boolean,
): string | undefined | null {
  const character = getCharacterForPhysicalKey(physicalKeyId, layoutId, shiftKey);
  return character ? normalizeCommittedText(character) : undefined;
}

export function useTypingInput({ text, selectedLayout, onError }: UseTypingInputProps) {
  const [input, setInput] = useState('');
  const keystrokesRef = useRef<KeystrokeEvent[]>([]);
  const [backspaceEnabled, setBackspaceEnabled] = useState(true);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const nativeEvent = e.nativeEvent as globalThis.KeyboardEvent;
    if (nativeEvent.isComposing || e.key === 'Process') {
      return;
    }

    if (e.metaKey || (e.ctrlKey && !e.altKey)) {
      return;
    }
    const physicalKeyId = getPhysicalKeyIdForCode(e.code);

    // Tab
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabChars = '  ';
      const expectedAt = text.slice(input.length, input.length + tabChars.length);
      const isCorrect = expectedAt === tabChars;
      keystrokesRef.current.push({
        key: tabChars,
        timestamp: Date.now(),
        correct: isCorrect,
        expected: expectedAt.slice(0, tabChars.length).replace(/\t/g, '  '),
        position: input.length,
      });
      setInput((prev) => prev + tabChars);
      if (!isCorrect) onError?.(tabChars, expectedAt);
      return;
    }

    // Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (!backspaceEnabled) return;
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    // Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      const expectedChar = text[input.length];
      const isCorrect = expectedChar === '\n';
      keystrokesRef.current.push({
        key: '\n',
        timestamp: Date.now(),
        correct: isCorrect,
        expected: expectedChar,
        position: input.length,
      });
      if (isCorrect) {
        setInput((prev) => prev + '\n');
      } else {
        onError?.('Enter', expectedChar);
      }
      return;
    }

    // Caracteres normales
    if (!physicalKeyId) return;
    const char = resolveTypedChar(physicalKeyId, selectedLayout.id, e.shiftKey);
    if (char === null) return;
    if (char === undefined) return;
    e.preventDefault();

    const expectedChar = text[input.length];
    const isCorrect = normalizeCommittedText(char) === normalizeCommittedText(expectedChar);

    keystrokesRef.current.push({
      key: char,
      timestamp: Date.now(),
      correct: isCorrect,
      expected: expectedChar,
      position: input.length,
    });

    if (isCorrect) {
      setInput((prev) => prev + char);
    } else {
      onError?.(char, expectedChar);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  const resetInput = () => {
    setInput('');
    keystrokesRef.current = [];
  };

  return {
    input,
    setInput,
    keystrokesRef,
    backspaceEnabled,
    setBackspaceEnabled,
    handleKeyDown,
    handlePaste,
    resetInput,
  };
}
