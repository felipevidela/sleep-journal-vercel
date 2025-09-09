'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Smartphone, Moon, Sun } from 'lucide-react';
import { initializeDarkMode, toggleDarkMode } from '@/lib/utils';

interface Provider {
  id: string;
  name: string;
  signinUrl: string;
}

export default function SignIn() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize dark mode
    const darkMode = initializeDarkMode();
    setIsDark(darkMode);

    // Load OAuth providers
    getProviders().then(setProviders);
  }, []);

  const handleThemeToggle = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    toggleDarkMode(newDarkMode);
  };

  const handleSignIn = async (providerId: string) => {
    setLoading(true);
    try {
      await signIn(providerId, { callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'apple':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
          </svg>
        );
      case 'azure-ad':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#f25022" d="M1 1h10v10H1z"/>
            <path fill="#00a4ef" d="M13 1h10v10H13z"/>
            <path fill="#7fba00" d="M1 13h10v10H1z"/>
            <path fill="#ffb900" d="M13 13h10v10H13z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        );
    }
  };

  const getProviderColor = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'bg-white dark:bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-200 text-gray-700 dark:text-gray-800 border border-gray-300 shadow-md hover:shadow-lg';
      case 'apple':
        return 'bg-black hover:bg-gray-900 text-white border border-gray-700 shadow-md hover:shadow-lg';
      case 'azure-ad':
        return 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-md hover:shadow-lg';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 shadow-md hover:shadow-lg';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Theme toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">💤</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sleep Journal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Registra y analiza tu calidad de sueño
          </p>
          
          {/* Mobile optimized note */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Smartphone className="h-4 w-4" />
            <span>Optimizado para móviles</span>
          </div>
        </div>

        {/* Sign in options */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-center mb-6 text-gray-900 dark:text-white">
            Inicia sesión con
          </h2>

          {providers ? (
            <div className="space-y-3">
              {Object.values(providers).map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleSignIn(provider.id)}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${getProviderColor(provider.id)}`}
                >
                  <span className="flex-shrink-0">{getProviderIcon(provider.id)}</span>
                  <span className="text-base">
                    {loading ? 'Conectando...' : `Continuar con ${provider.id === 'azure-ad' ? 'Microsoft' : provider.name}`}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Features preview */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              ✨ Características principales:
            </h3>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Registro diario de calidad de sueño
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Gráficos de tendencias y estadísticas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Exportar datos a CSV
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Modo oscuro automático
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Optimizado para móviles
              </li>
            </ul>
          </div>

          {/* Privacy note */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              🔒 Tus datos están seguros y privados.<br/>
              Solo usamos tu información para personalizar tu experiencia.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          Hecho con ❤️ · Next.js · Vercel
        </div>
      </div>
    </div>
  );
}