import { describe, expect, it, jest } from '@jest/globals';
import {
  canContinueProfileNavigation,
  createSaveGate,
  hasPendingProfileChanges,
  registerBeforeUnloadWarning,
} from './profilePendingChanges';

describe('profile pending changes', () => {
  it('registra beforeunload solo con cambios pendientes y lo retira al limpiar', () => {
    const target = { addEventListener: jest.fn(), removeEventListener: jest.fn() };
    const noWarning = registerBeforeUnloadWarning(hasPendingProfileChanges(false, false), target);
    expect(target.addEventListener).not.toHaveBeenCalled();
    noWarning();

    const cleanup = registerBeforeUnloadWarning(hasPendingProfileChanges(true, false), target);
    expect(target.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    cleanup();
    expect(target.removeEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    registerBeforeUnloadWarning(hasPendingProfileChanges(true, true), target);
    expect(target.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('permite o bloquea navegación según confirmación', () => {
    const confirm = jest.fn(() => false);
    expect(canContinueProfileNavigation(false, confirm)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
    expect(canContinueProfileNavigation(true, confirm)).toBe(false);
    confirm.mockReturnValue(true);
    expect(canContinueProfileNavigation(true, confirm)).toBe(true);
  });

  it('ignora doble guardado y libera el bloqueo tras éxito o error', async () => {
    const gate = createSaveGate();
    let release!: () => void;
    const first = gate.run(() => new Promise<void>((resolve) => { release = resolve; }));
    expect(await gate.run(async () => undefined)).toBe(false);
    release();
    expect(await first).toBe(true);
    expect(await gate.run(async () => undefined)).toBe(true);
    await expect(gate.run(async () => { throw new Error('save failed'); })).rejects.toThrow('save failed');
    expect(await gate.run(async () => undefined)).toBe(true);
  });
});
