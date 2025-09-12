'use client';

import { useState, useEffect } from 'react';
import { X, Moon, Star, AlertCircle } from 'lucide-react';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { date: string; rating: number; comments: string; start_time: string; end_time: string }) => Promise<void>;
  initialDate?: string;
}

const RATING_DESCRIPTIONS = {
  1: { text: 'Terrible', emoji: '😴', color: 'text-red-600' },
  2: { text: 'Muy malo', emoji: '😞', color: 'text-red-500' },
  3: { text: 'Malo', emoji: '😕', color: 'text-orange-500' },
  4: { text: 'Regular', emoji: '😐', color: 'text-orange-400' },
  5: { text: 'Aceptable', emoji: '🙂', color: 'text-yellow-500' },
  6: { text: 'Bueno', emoji: '😊', color: 'text-yellow-400' },
  7: { text: 'Muy bueno', emoji: '😌', color: 'text-green-400' },
  8: { text: 'Excelente', emoji: '😴', color: 'text-green-500' },
  9: { text: 'Perfecto', emoji: '😇', color: 'text-green-600' },
  10: { text: 'Increíble', emoji: '✨', color: 'text-purple-500' }
};

const QUICK_COMMENTS = [
  '😴 Dormí muy bien',
  '😌 Noche tranquila',
  '🌙 Sueño profundo',
  '☕ Necesité café',
  '😫 Me desperté cansado',
  '🌟 Me siento renovado',
  '🧘 Relajante',
  '💤 Muchos sueños'
];

export default function QuickEntryModal({ isOpen, onClose, onSubmit, initialDate }: QuickEntryModalProps) {
  const [formData, setFormData] = useState({
    date: initialDate || new Date().toISOString().split('T')[0] || '',
    rating: 0,
    comments: '',
    start_time: '',
    end_time: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDate) {
      setFormData(prev => ({ ...prev, date: initialDate }));
    }
  }, [initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate rating
    if (!formData.rating || formData.rating < 1 || formData.rating > 10) {
      setError('Por favor selecciona una nota entre 1 y 10');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        date: new Date().toISOString().split('T')[0] || '',
        rating: 0,
        comments: '',
        start_time: '',
        end_time: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addQuickComment = (comment: string) => {
    const currentComments = formData.comments;
    const newComments = currentComments 
      ? (currentComments.includes(comment) ? currentComments : `${currentComments}. ${comment}`)
      : comment;
    
    setFormData({ ...formData, comments: newComments });
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 3) return 'text-red-500';
    if (rating <= 5) return 'text-orange-500';
    if (rating <= 7) return 'text-yellow-500';
    if (rating <= 9) return 'text-green-500';
    return 'text-purple-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Registro Rápido
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              max={new Date().toISOString().split('T')[0] || ''}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Time tracking */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de dormir (24h)
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="23:30"
                autoComplete="off"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Formato militar: HH:MM</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de despertar (24h)
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="07:30"
                autoComplete="off"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Formato militar: HH:MM</span>
            </div>
          </div>

          {/* Sleep duration display */}
          {formData.start_time && formData.end_time && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Duración estimada:</strong> {(() => {
                  const start = new Date(`2000-01-01T${formData.start_time}`);
                  const end = new Date(`2000-01-${formData.start_time > formData.end_time ? '02' : '01'}T${formData.end_time}`);
                  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  return `${Math.floor(diff)}h ${Math.round((diff % 1) * 60)}m`;
                })()}
              </div>
            </div>
          )}

          {/* Rating with visual feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Calidad del sueño
            </label>
            
            {/* Current rating display */}
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">
                {RATING_DESCRIPTIONS[formData.rating as keyof typeof RATING_DESCRIPTIONS]?.emoji}
              </div>
              <div className={`text-lg font-medium ${getRatingColor(formData.rating)}`}>
                {formData.rating}/10 - {RATING_DESCRIPTIONS[formData.rating as keyof typeof RATING_DESCRIPTIONS]?.text}
              </div>
            </div>

            {/* Rating slider */}
            <div className="px-2">
              <input
                type="range"
                min="1"
                max="10"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, 
                    #ef4444 0%, #f97316 20%, #eab308 40%, 
                    #84cc16 60%, #22c55e 80%, #8b5cf6 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Quick rating buttons */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              {[1, 3, 5, 7, 10].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating })}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.rating === rating
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          {/* Quick comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comentarios rápidos
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {QUICK_COMMENTS.map((comment, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => addQuickComment(comment)}
                  className="p-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left"
                >
                  {comment}
                </button>
              ))}
            </div>
          </div>

          {/* Custom comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comentarios adicionales
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Describe cómo dormiste..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {formData.comments.length}/1000
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4" />
                  Guardar Registro
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}