'use client';

import { X } from 'lucide-react';
import { SleepEntry } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entry: SleepEntry | null;
  isLoading?: boolean;
}

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  entry, 
  isLoading = false 
}: ConfirmDialogProps) {
  if (!isOpen || !entry) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('es-CL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="card-elevated w-full max-w-md p-6 relative animate-in fade-in-0 zoom-in-95 duration-300">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="pr-8">
            <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
              ¿Eliminar registro?
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <p className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">
                  {formatDate(entry.date)}
                </p>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Nota:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{entry.rating}/10</span>
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-500"
                      style={{ width: `${entry.rating * 10}%` }}
                    />
                  </div>
                </div>
                
                {entry.comments && (
                  <div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Comentarios:</span>
                    <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                      {entry.comments.length > 100 
                        ? entry.comments.substring(0, 100) + '...' 
                        : entry.comments}
                    </p>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="btn"
              >
                Cancelar
              </button>
              
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="btn bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Eliminando...
                  </div>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Utility CSS for animations (add to globals.css if needed)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}