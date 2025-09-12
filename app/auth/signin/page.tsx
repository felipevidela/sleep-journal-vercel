'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Smartphone, Moon, Sun, Mail, Lock } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        {/* Theme toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleThemeToggle}
            className="btn p-3"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="card-accent mx-auto w-20 h-20 mb-6">
            <div className="rounded-full w-full h-full flex items-center justify-center">
              <span className="text-3xl">💤</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Sleep Journal
          </h1>
          <p className="text-sm sm:text-base opacity-75 mb-4">
            Registra y analiza tu calidad de sueño
          </p>
          
          {/* Mobile optimized note */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-opacity-20 bg-gray-500 text-xs">
            <Smartphone className="h-3 w-3" />
            <span>Optimizado para móviles</span>
          </div>
        </div>

        {/* Sign in form */}
        <div className="card p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-semibold text-center mb-2">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10 pr-4"
                  placeholder="Ingresa tu email"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-16"
                  placeholder="Ingresa tu contraseña"
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center pt-6 border-t border-opacity-20">
            <p className="text-sm opacity-75">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="text-accent font-medium hover:underline">
                Crear cuenta
              </Link>
            </p>
          </div>

          {/* Features preview */}
          <div className="mt-8 pt-6 border-t border-opacity-20">
            <h3 className="text-sm font-medium mb-4">
              ✨ Características principales:
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                'Registro diario de calidad de sueño',
                'Gráficos de tendencias y estadísticas', 
                'Exportar datos a CSV',
                'Modo oscuro automático',
                'Optimizado para móviles'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-black hover:bg-opacity-5 dark:hover:bg-white dark:hover:bg-opacity-5 transition-colors">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs opacity-80">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <div className="mt-6 pt-4 border-t border-opacity-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-5">
              <span className="text-xs">🔒</span>
              <p className="text-xs opacity-75">
                Datos seguros y privados
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs opacity-50">
            Hecho con ❤️ · Next.js · Vercel
          </p>
        </div>
      </div>
    </div>
  );
}