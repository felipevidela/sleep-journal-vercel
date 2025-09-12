'use client';

import { useState, useEffect } from 'react';
import { usePWA } from '@/lib/pwa';

export default function PWAPrompt() {
  const { canInstall, isOnline, installApp } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    // Show install prompt if app can be installed
    if (canInstall) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000); // Show after 5 seconds
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [canInstall]);

  useEffect(() => {
    // Show offline notice when going offline
    if (!isOnline) {
      setShowOfflineNotice(true);
      const timer = setTimeout(() => {
        setShowOfflineNotice(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOnline]);

  useEffect(() => {
    // Listen for PWA update events
    const handleUpdateAvailable = () => {
      setShowUpdatePrompt(true);
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    
    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setShowInstallPrompt(false);
    }
  };

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Instalar Sleep Journal
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Instala la app para acceso rápido y funcionalidad offline
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Instalar
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Después
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:w-96 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 z-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Actualización disponible
              </h3>
              <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                Nueva versión de la app disponible
              </p>
              <button
                onClick={handleUpdate}
                className="mt-2 px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
              >
                Actualizar ahora
              </button>
            </div>
            <button
              onClick={() => setShowUpdatePrompt(false)}
              className="flex-shrink-0 text-green-400 hover:text-green-600 dark:hover:text-green-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Offline Notice */}
      {showOfflineNotice && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:w-96 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 z-50">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Modo offline - Los datos se sincronizarán cuando vuelvas a estar online
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Online Status Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded-full text-sm font-medium z-40">
          Sin conexión
        </div>
      )}
    </>
  );
}