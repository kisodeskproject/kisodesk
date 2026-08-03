'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { updateMyPreferences } from '@/lib/authClient';
import {
  KEYBOARD_LAYOUT_STORAGE_KEY,
  KEYBOARD_PHYSICAL_FAMILY_STORAGE_KEY,
  KeyboardLayout,
  KeyboardLayoutId,
  KeyboardPhysicalFamily,
  fromBackendLayoutCode,
  getDefaultLayoutForLocale,
  getDefaultLayout,
  getEnabledLayoutById,
  getEnabledLayouts,
  getEnabledLayoutsForLocale,
  layoutSupportsLocale,
  KeyboardContentLanguage,
  resolveKeyboardLayout,
  toBackendLayoutCode,
} from '@/lib/keyboardLayouts';
import { normalizeKeyboardPhysicalFamily } from '@/lib/keyboardPhysical';
import type { Locale } from '@/lib/locales';

interface KeyboardLayoutContextType {
  selectedLayout: KeyboardLayout;
  layouts: KeyboardLayout[];
  isReady: boolean;
  hasLayoutPreference: boolean;
  isSaving: boolean;
  isDetectionOpen: boolean;
  setSelectedLayout: (layout: KeyboardLayout | KeyboardLayoutId) => Promise<void>;
  openDetection: () => void;
  closeDetection: () => void;
  getLayoutForLanguage: (language?: KeyboardContentLanguage | Locale | null) => KeyboardLayout;
  getLayoutsForLanguage: (language?: KeyboardContentLanguage | Locale | null) => KeyboardLayout[];
  physicalFamily?: KeyboardPhysicalFamily;
  hasPhysicalFamilyPreference?: boolean;
  setPhysicalFamily?: (family: KeyboardPhysicalFamily) => void;
}

export const KeyboardLayoutContext = createContext<KeyboardLayoutContextType | undefined>(
  undefined,
);

function readStoredLayoutId(): KeyboardLayoutId | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = localStorage.getItem(KEYBOARD_LAYOUT_STORAGE_KEY);
  return getEnabledLayouts().some((layout) => layout.id === stored)
    ? (stored as KeyboardLayoutId)
    : null;
}

function readStoredPhysicalFamily(): KeyboardPhysicalFamily | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(KEYBOARD_PHYSICAL_FAMILY_STORAGE_KEY);
  if (stored === 'ABNT') return 'ABNT2';
  return stored === 'ANSI' || stored === 'ISO' || stored === 'ABNT2' || stored === 'JIS' || stored === 'KS' || stored === 'BIG_ASS'
    ? normalizeKeyboardPhysicalFamily(stored)
    : null;
}

export function KeyboardLayoutProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [selectedLayoutId, setSelectedLayoutId] = useState<KeyboardLayoutId | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasLayoutPreference, setHasLayoutPreference] = useState(false);
  const [physicalFamily, setPhysicalFamilyState] = useState<KeyboardPhysicalFamily>('ISO');
  const [hasPhysicalFamilyPreference, setHasPhysicalFamilyPreference] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetectionOpen, setIsDetectionOpen] = useState(false);

  useEffect(() => {
    const userLayoutId = fromBackendLayoutCode(user?.layout);
    const storedLayoutId = readStoredLayoutId();
    const browserLayoutId =
      typeof navigator === 'undefined'
        ? null
        : getDefaultLayoutForLocale(navigator.languages[0] ?? navigator.language).id;
    const nextLayoutId = userLayoutId ?? storedLayoutId ?? browserLayoutId ?? getDefaultLayout().id;
    const storedPhysicalFamily = readStoredPhysicalFamily();
    const migratedPhysicalFamily = getEnabledLayoutById(nextLayoutId).physicalType ?? 'ISO';

    setSelectedLayoutId(nextLayoutId);
    setHasLayoutPreference(Boolean(userLayoutId ?? storedLayoutId));
    setPhysicalFamilyState(storedPhysicalFamily ?? migratedPhysicalFamily);
    setHasPhysicalFamilyPreference(Boolean(storedPhysicalFamily));
    if (typeof window !== 'undefined' && (userLayoutId ?? storedLayoutId)) {
      localStorage.setItem(KEYBOARD_LAYOUT_STORAGE_KEY, nextLayoutId);
    }
    setIsReady(true);
  }, [user?.layout]);

  const setPhysicalFamily = useCallback((family: KeyboardPhysicalFamily) => {
    setPhysicalFamilyState(family);
    setHasPhysicalFamilyPreference(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEYBOARD_PHYSICAL_FAMILY_STORAGE_KEY, family);
    }
  }, []);

  const persistRemoteLayout = useCallback(
    async (layoutId: KeyboardLayoutId) => {
      if (!isAuthenticated) return;

      const nextLayoutCode = toBackendLayoutCode(layoutId);
      if (user?.layout === nextLayoutCode) return;

      setIsSaving(true);
      try {
        const updatedUser = await updateMyPreferences({ layout: nextLayoutCode });
        updateUser(updatedUser);
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, updateUser, user?.layout],
  );

  const setSelectedLayout = useCallback(
    async (layout: KeyboardLayout | KeyboardLayoutId) => {
      const layoutId = typeof layout === 'string' ? layout : layout.id;
      const nextLayout = getEnabledLayoutById(layoutId);
      const previousLayoutId = selectedLayoutId;
      const previousHasLayoutPreference = hasLayoutPreference;

      setSelectedLayoutId(nextLayout.id);
      setHasLayoutPreference(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEYBOARD_LAYOUT_STORAGE_KEY, nextLayout.id);
      }

      try {
        await persistRemoteLayout(nextLayout.id);
      } catch (error) {
        setSelectedLayoutId(previousLayoutId);
        setHasLayoutPreference(previousHasLayoutPreference);
        if (typeof window !== 'undefined') {
          if (previousLayoutId) {
            localStorage.setItem(KEYBOARD_LAYOUT_STORAGE_KEY, previousLayoutId);
          } else {
            localStorage.removeItem(KEYBOARD_LAYOUT_STORAGE_KEY);
          }
        }
        throw error;
      }
    },
    [hasLayoutPreference, persistRemoteLayout, selectedLayoutId],
  );

  const value = useMemo<KeyboardLayoutContextType>(
    () => ({
      selectedLayout: selectedLayoutId
        ? getEnabledLayoutById(selectedLayoutId)
        : getDefaultLayout(),
      layouts: getEnabledLayouts(),
      isReady,
      hasLayoutPreference,
      isSaving,
      isDetectionOpen,
      setSelectedLayout,
      openDetection: () => setIsDetectionOpen(true),
      closeDetection: () => setIsDetectionOpen(false),
      // El idioma define los caracteres; la familia física se conserva aparte.
      getLayoutForLanguage: (language) => {
        const selectedLayout = selectedLayoutId
          ? getEnabledLayoutById(selectedLayoutId)
          : null;
        if (selectedLayout && layoutSupportsLocale(selectedLayout, language)) {
          return selectedLayout;
        }
        return language ? getDefaultLayoutForLocale(language) : resolveKeyboardLayout({});
      },
      getLayoutsForLanguage: (language) =>
        getEnabledLayoutsForLocale(language, physicalFamily).map(({ layout }) => layout),
      physicalFamily,
      hasPhysicalFamilyPreference,
      setPhysicalFamily,
    }),
    [hasLayoutPreference, hasPhysicalFamilyPreference, isDetectionOpen, isReady, isSaving, physicalFamily, selectedLayoutId, setPhysicalFamily, setSelectedLayout],
  );

  return <KeyboardLayoutContext.Provider value={value}>{children}</KeyboardLayoutContext.Provider>;
}

export function useKeyboardLayout() {
  const context = useContext(KeyboardLayoutContext);
  if (!context) {
    throw new Error('useKeyboardLayout debe usarse dentro de un <KeyboardLayoutProvider>');
  }
  return context;
}
