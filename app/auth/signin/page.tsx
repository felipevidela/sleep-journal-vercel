'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Smartphone, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { initializeDarkMode, toggleDarkMode } from '@/lib/utils';

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize dark mode
    const darkMode = initializeDarkMode();
    setIsDark(darkMode);
  }, []);

  const handleThemeToggle = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    toggleDarkMode(newDarkMode);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email y contraseña son obligatorios');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful, redirect to main app
        router.push('/');
      } else {
        setError(data.error || 'Email o contraseña incorrectos');
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Smartphone className="h-4 w-4" />
            <span>Optimizado para móviles</span>
          </div>
        </div>

        {/* Sign in form */}
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-center text-gray-900 dark:text-white">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="Tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium">
                Crear cuenta
              </Link>
            </p>
          </div>

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
            <p className="text-xs text-gray-600 dark:text-gray-400">
              🔒 Tus datos están seguros y privados.<br/>
              Solo usamos tu información para personalizar tu experiencia.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-600 dark:text-gray-400">
          Hecho con ❤️ · Next.js · Vercel
        </div>
      </div>
    </div>
  );
}