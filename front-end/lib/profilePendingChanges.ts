export function hasPendingProfileChanges(hasChanges: boolean, isSaving: boolean): boolean {
  return hasChanges && !isSaving;
}

export function registerBeforeUnloadWarning(
  shouldWarn: boolean,
  target: Pick<Window, 'addEventListener' | 'removeEventListener'> = window,
): () => void {
  if (!shouldWarn) return () => undefined;

  const handler = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = '';
  };
  target.addEventListener('beforeunload', handler);
  return () => target.removeEventListener('beforeunload', handler);
}

export function canContinueProfileNavigation(
  shouldWarn: boolean,
  confirmDiscard: () => boolean,
): boolean {
  return !shouldWarn || confirmDiscard();
}

export function createSaveGate() {
  let active = false;
  return {
    async run(operation: () => Promise<void>): Promise<boolean> {
      if (active) return false;
      active = true;
      try {
        await operation();
        return true;
      } finally {
        active = false;
      }
    },
  };
}
