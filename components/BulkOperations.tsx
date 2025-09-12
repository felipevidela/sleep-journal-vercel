'use client';

import { useState } from 'react';
import { 
  Trash2, Download, Calendar, Filter, 
  CheckSquare, Square, AlertTriangle, X
} from 'lucide-react';
import type { SleepEntry } from '@/lib/types';

interface BulkOperationsProps {
  entries: SleepEntry[];
  selectedEntries: string[];
  onSelectionChange: (entryIds: string[]) => void;
  onBulkDelete: (entryIds: string[]) => Promise<void>;
  onBulkExport: (entryIds: string[]) => void;
  onClose: () => void;
}

export default function BulkOperations({
  entries,
  selectedEntries,
  onSelectionChange,
  onBulkDelete,
  onBulkExport,
  onClose
}: BulkOperationsProps) {
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });
  const [ratingFilter, setRatingFilter] = useState({
    min: 1,
    max: 10
  });

  const allSelected = selectedEntries.length === entries.length && entries.length > 0;
  const someSelected = selectedEntries.length > 0 && selectedEntries.length < entries.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(entries.map(entry => entry.id));
    }
  };

  const handleDateFilterApply = () => {
    const filtered = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
      const toDate = dateFilter.to ? new Date(dateFilter.to) : null;

      if (fromDate && entryDate < fromDate) return false;
      if (toDate && entryDate > toDate) return false;
      return true;
    });

    onSelectionChange(filtered.map(entry => entry.id));
  };

  const handleRatingFilterApply = () => {
    const filtered = entries.filter(entry => 
      entry.rating >= ratingFilter.min && entry.rating <= ratingFilter.max
    );

    onSelectionChange(filtered.map(entry => entry.id));
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await onBulkDelete(selectedEntries);
      setIsConfirmDeleteOpen(false);
      onSelectionChange([]);
    } catch (error) {
      console.error('Error deleting entries:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Operaciones Masivas
          </h3>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full">
            {selectedEntries.length} seleccionados
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : someSelected ? (
              <div className="h-4 w-4 border border-gray-400 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <div className="h-2 w-2 bg-blue-500 rounded-sm" />
              </div>
            ) : (
              <Square className="h-4 w-4" />
            )}
            {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </button>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {entries.length} registros en total
          </div>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtrar por fecha
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Desde"
              />
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Hasta"
              />
            </div>
            <button
              onClick={handleDateFilterApply}
              disabled={!dateFilter.from && !dateFilter.to}
              className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Calendar className="h-4 w-4 inline mr-1" />
              Aplicar filtro de fecha
            </button>
          </div>

          {/* Rating Range Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtrar por calificación
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400">Mínimo</label>
                <select
                  value={ratingFilter.min}
                  onChange={(e) => setRatingFilter({ ...ratingFilter, min: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(rating => (
                    <option key={rating} value={rating}>{rating}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400">Máximo</label>
                <select
                  value={ratingFilter.max}
                  onChange={(e) => setRatingFilter({ ...ratingFilter, max: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(rating => (
                    <option key={rating} value={rating}>{rating}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleRatingFilterApply}
              className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Filter className="h-4 w-4 inline mr-1" />
              Aplicar filtro de calificación
            </button>
          </div>
        </div>

        {/* Actions */}
        {selectedEntries.length > 0 && (
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onBulkExport(selectedEntries)}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar Seleccionados
            </button>
            
            <button
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar Seleccionados
            </button>
          </div>
        )}

        {/* Selected Entries Preview */}
        {selectedEntries.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Registros seleccionados:
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedEntries.slice(0, 10).map(entryId => {
                const entry = entries.find(e => e.id === entryId);
                if (!entry) return null;
                
                return (
                  <div key={entryId} className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded px-2 py-1">
                    <span>{formatDate(entry.date)}</span>
                    <span className="font-medium">{entry.rating}/10</span>
                  </div>
                );
              })}
              {selectedEntries.length > 10 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                  ... y {selectedEntries.length - 10} más
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirmar Eliminación
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ¿Estás seguro de que quieres eliminar {selectedEntries.length} registro(s)? 
              Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Eliminar {selectedEntries.length}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}