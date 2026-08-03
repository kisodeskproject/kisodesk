// contexts/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getCurrentUser,
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
} from '@/lib/authClient';
import type { User } from '@/lib/authClient';
import type { Locale } from '@/lib/locales';
import { syncGuestPracticeResults } from '@/lib/guestProgressStore';

// ============================================================
// TIPOS
// ============================================================
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (
    lang?: Locale,
    consent?: { termsAccepted: boolean; privacyAccepted: boolean },
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User | null | ((current: User | null) => User | null)) => void;
}

// ============================================================
// CONTEXTO
// ============================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // HOOKS DE NAVEGACIÓN
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  // ESTADOS DE AUTENTICACIÓN
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedRef = useRef(false);

  // ============================================================
  // FUNCIONES DE AUTENTICACIÓN
  // ============================================================

  // VERIFICAR ESTADO DE AUTENTICACIÓN
  const checkAuth = useCallback(async () => {
    // Evitar múltiples verificaciones
    if (hasCheckedRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentUser = await getCurrentUser();
      try {
        await syncGuestPracticeResults();
      } catch {
        // El almacenamiento local no debe impedir restaurar una sesión válida.
      }
      setUser(currentUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
      setUser(null);
    } finally {
      setLoading(false);
      hasCheckedRef.current = true;
    }
  }, []);

  // INICIAR SESIÓN CON EMAIL Y CONTRASEÑA
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await apiLogin(email, password);

        // Resetear el flag para permitir nueva verificación
        hasCheckedRef.current = false;

        // Obtener el usuario directamente
        const currentUser = await getCurrentUser();
        try {
          await syncGuestPracticeResults();
        } catch {
          // El inicio de sesión no depende de que localStorage esté disponible.
        }
        setUser(currentUser);

        router.push(`/${lang}/dashboard`);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de inicio de sesión');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [router, lang],
  );

  // INICIAR SESIÓN CON GOOGLE
  const loginWithGoogle = useCallback(
    async (
      lang: Locale = 'es-latam',
      consent?: { termsAccepted: boolean; privacyAccepted: boolean },
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await apiLoginWithGoogle(lang, consent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google');
        setLoading(false);
      }
    },
    [],
  );

  // CERRAR SESIÓN
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await apiLogout();
      setUser(null);
      hasCheckedRef.current = false;
      router.push(`/${lang}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  }, [router, lang]);

  // EFECTO PARA VERIFICAR AUTENTICACIÓN AL INICIO
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const updateUser = useCallback(
    (nextUser: User | null | ((current: User | null) => User | null)) => {
      setUser((current) => (typeof nextUser === 'function' ? nextUser(current) : nextUser));
    },
    [],
  );

  // VALOR DEL CONTEXTO
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      login,
      loginWithGoogle,
      logout,
      checkAuth,
      updateUser,
    }),
    [user, loading, error, login, loginWithGoogle, logout, checkAuth, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================
// HOOK PERSONALIZADO
// ============================================================
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }

  return context;
}
