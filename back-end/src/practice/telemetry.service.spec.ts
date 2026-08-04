import { TelemetryService } from './telemetry.service';

describe('TelemetryService', () => {
  const service = new TelemetryService();

  it('conserva el error corregido como telemetría, sin penalizar las métricas finales', () => {
    const result = service.derive({
      version: 1,
      text: 'casa',
      startedAt: 1000,
      pausedMs: 0,
      events: [
        { sequence: 0, kind: 'input', timestamp: 1000, code: 'KeyC', key: 'c', position: 0, expected: 'c', typed: 'c', correct: true },
        { sequence: 1, kind: 'input', timestamp: 1200, code: 'KeyA', key: 'x', position: 1, expected: 'a', typed: 'x', correct: false },
        { sequence: 2, kind: 'backspace', timestamp: 1250, code: 'Backspace', key: 'Backspace', position: 2 },
        { sequence: 3, kind: 'input', timestamp: 1400, code: 'KeyA', key: 'a', position: 1, expected: 'a', typed: 'a', correct: true },
      ],
    });
    expect(result.totalIncorrectAttempts).toBe(1);
    expect(result.correctedErrors).toBe(1);
    expect(result.uncorrectedErrors).toBe(0);
    expect(result.backspaces).toBe(1);
    expect(result.keyErrors.size).toBe(0);
    expect(result.bigramErrors.size).toBe(0);
    expect(result.keyStats.get('a')).toEqual({ presses: 1, errors: 0 });
    expect(result.bigramStats.get('c\u0000a')).toMatchObject({ presses: 1, errors: 0 });
    expect(result.finalAccuracy).toBe(100);
    expect(result.accuracy).toBe(100);
    expect(result.effectiveWpm).toBeCloseTo((2 / 5) / (0.4 / 60));
  });

  it('excluye pausas y latencias extremas sin truncarlas', () => {
    const result = service.derive({ version: 1, text: 'abc', startedAt: 0, pausedMs: 5000, events: [
      { sequence: 0, kind: 'input', timestamp: 0, code: 'KeyA', key: 'a', position: 0, expected: 'a', typed: 'a', correct: true },
      { sequence: 1, kind: 'input', timestamp: 100, code: 'KeyB', key: 'b', position: 1, expected: 'b', typed: 'b', correct: true },
      { sequence: 2, kind: 'input', timestamp: 5100, code: 'KeyC', key: 'c', position: 2, expected: 'c', typed: 'c', correct: true },
    ]});
    expect(result.activeDurationMs).toBe(100);
    expect(result.medianLatencyMs).toBe(100);
    expect(result.bigramStats.get('b\u0000c')?.latencySamples).toBe(0);
  });

  it('clasifica reemplazos, Backspace consecutivos y Backspace vacío', () => {
    const result = service.derive({ version: 1, text: 'ab', startedAt: 0, pausedMs: 0, events: [
      { sequence: 0, kind: 'backspace', timestamp: 0, code: 'Backspace', key: 'Backspace', position: 0 },
      { sequence: 1, kind: 'input', timestamp: 100, code: 'KeyA', key: 'x', position: 0, expected: 'a', typed: 'x', correct: false },
      { sequence: 2, kind: 'backspace', timestamp: 200, code: 'Backspace', key: 'Backspace', position: 1 },
      { sequence: 3, kind: 'input', timestamp: 300, code: 'KeyA', key: 'y', position: 0, expected: 'a', typed: 'y', correct: false },
      { sequence: 4, kind: 'backspace', timestamp: 400, code: 'Backspace', key: 'Backspace', position: 1 },
      { sequence: 5, kind: 'input', timestamp: 500, code: 'KeyA', key: 'a', position: 0, expected: 'a', typed: 'a', correct: true },
      { sequence: 6, kind: 'backspace', timestamp: 600, code: 'Backspace', key: 'Backspace', position: 1 },
      { sequence: 7, kind: 'backspace', timestamp: 700, code: 'Backspace', key: 'Backspace', position: 0 },
      { sequence: 8, kind: 'input', timestamp: 800, code: 'KeyB', key: 'z', position: 0, expected: 'b', typed: 'z', correct: false },
    ]});
    expect(result.correctedErrors).toBe(2);
    expect(result.uncorrectedErrors).toBe(1);
    expect(result.backspaces).toBe(5);
    expect(result.segments[0].unrelatedBackspaces).toBe(2);
  });

  it('mantiene error sin corregir cuando no hay acierto posterior', () => {
    const result = service.derive({ version: 1, text: 'a', startedAt: 0, pausedMs: 0, events: [
      { sequence: 0, kind: 'input', timestamp: 0, code: 'KeyA', key: 'x', position: 0, expected: 'a', typed: 'x', correct: false },
    ]});
    expect(result.correctedErrors).toBe(0);
    expect(result.uncorrectedErrors).toBe(1);
  });
});
