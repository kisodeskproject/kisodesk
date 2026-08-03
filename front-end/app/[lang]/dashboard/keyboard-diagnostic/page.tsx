'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import KeyboardView from '@/components/lessons/Keyboard';
import DashboardBackground from '@/components/layout/DashboardBackground';
import { useKeyboardLayout } from '@/hooks/useKeyboardLayout';
import { getKeyboardDiagnosticSteps, type KeyboardDiagnosticLayer } from '@/lib/keyboardDiagnostic';
import { getPhysicalKeyIdForCode, type PhysicalKeyId } from '@/lib/keyboardPhysical';
import { toSupportedLocale } from '@/lib/i18n';

const LAYER_LABEL: Record<KeyboardDiagnosticLayer, string> = {
  base: 'Base',
  shift: 'Shift',
  altgr: 'AltGr',
  'shift-altgr': 'Shift + AltGr',
  dead: 'Tecla muerta',
};

const MODIFIER_KEYS = new Set<PhysicalKeyId>(['P42', 'P55', 'P61'] as PhysicalKeyId[]);

function hasAltGr(event: KeyboardEvent): boolean {
  return event.getModifierState('AltGraph') || (event.ctrlKey && event.altKey);
}

export default function KeyboardDiagnosticPage() {
  const params = useParams();
  const lang = toSupportedLocale(params.lang);
  const { getLayoutForLanguage, isReady, physicalFamily } = useKeyboardLayout();
  const layout = getLayoutForLanguage(lang);
  const family = physicalFamily ?? layout.physicalType ?? 'ISO';
  const steps = useMemo(() => getKeyboardDiagnosticSteps(layout, family), [family, layout]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [incorrectKeys, setIncorrectKeys] = useState<PhysicalKeyId[]>([]);

  const step = steps[index] ?? null;

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(steps.length - 1, 0)));
    setResult('idle');
    setIncorrectKeys([]);
  }, [steps]);

  const move = useCallback(
    (offset: number) => {
      setIndex((current) => Math.max(0, Math.min(steps.length - 1, current + offset)));
      setResult('idle');
      setIncorrectKeys([]);
    },
    [steps.length],
  );

  useEffect(() => {
    if (!step) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const physicalKeyId = getPhysicalKeyIdForCode(event.code, family);
      if (!physicalKeyId || MODIFIER_KEYS.has(physicalKeyId)) return;

      const modifiersMatch =
        event.shiftKey === step.requiresShift && hasAltGr(event) === step.requiresAltGr;
      const isCorrect = physicalKeyId === step.physicalKeyId && modifiersMatch;

      if (!isCorrect) {
        setResult('incorrect');
        setIncorrectKeys([physicalKeyId]);
        window.setTimeout(() => setIncorrectKeys([]), 150);
        return;
      }

      setResult('correct');
      window.setTimeout(() => move(1), 150);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [family, move, step]);

  if (!isReady || !step) {
    return (
      <DashboardBackground>
        <main className="mx-auto max-w-6xl p-6 text-(--text-primary)">Cargando diagnóstico…</main>
      </DashboardBackground>
    );
  }

  return (
    <DashboardBackground>
      <main className="mx-auto max-w-6xl space-y-5 p-6">
        <section className="rounded-xl border border-(--border-card) bg-(--bg-card) p-5">
          <p className="text-sm text-(--text-secondary)">Diagnóstico temporal de teclado</p>
          <h1 className="mt-1 text-2xl font-bold text-(--text-primary)">
            Posición {index + 1} de {steps.length}
          </h1>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
            <p><span className="text-(--text-secondary)">PhysicalKeyId: </span><strong>{step.physicalKeyId}</strong></p>
            <p><span className="text-(--text-secondary)">Carácter: </span><strong>{step.character === ' ' ? 'Espacio' : step.character}</strong></p>
            <p><span className="text-(--text-secondary)">Capa: </span><strong>{LAYER_LABEL[step.layer]}</strong></p>
            <p className="break-all"><span className="text-(--text-secondary)">SVG de postura: </span><strong>{step.handSvg}</strong></p>
          </div>
          <p className={`mt-4 text-sm font-medium ${result === 'correct' ? 'text-green-400' : result === 'incorrect' ? 'text-red-400' : 'text-(--text-secondary)'}`}>
            {result === 'correct'
              ? 'Correcta'
              : result === 'incorrect'
                ? 'Posición o modificador incorrecto'
                : `Pulsa ${step.eventCode}${step.requiresShift ? ' con Shift' : ''}${step.requiresAltGr ? ' con AltGr' : ''}`}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={index === 0}
              className="rounded-md border border-(--border-card) px-3 py-2 text-sm disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={index === steps.length - 1}
              className="rounded-md border border-(--border-card) px-3 py-2 text-sm disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </section>

        <KeyboardView
          layoutId={layout.id}
          activeKeys={step.guideKeys}
          guideKeys={step.guideKeys}
          incorrectFlashKeys={incorrectKeys}
        />
      </main>
    </DashboardBackground>
  );
}
