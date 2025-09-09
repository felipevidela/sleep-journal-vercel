'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { 
  Moon, Sun, Download, Filter, Search,
  Trash2, X, ChevronDown, ChevronUp, AlertCircle, LogOut, User
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import SleepChart from '@/components/SleepChart';
import {
  SleepEntry,
  isDateInFuture,
  getMaxDate,
  exportToCSV,
  filterEntriesByMonth,
  filterEntriesByRating,
  searchEntriesByComment,
  QUICK_NOTES,
  initializeDarkMode,
  toggleDarkMode
} from '@/lib/utils';
import { upsertEntry, deleteEntry, getData } from './actions';

interface PageData {
  entries: SleepEntry[];
  avg7: number | null;
  avg30: number | null;
}

interface FilterState {
  month: string;
  year: string;
  minRating: number;
  maxRating: number;
  search: string;
}

function formatDatePretty(isoDate: string) {
  try {
    let dateToFormat = isoDate;
    if (isoDate.includes('T')) {
      dateToFormat = isoDate.split('T')[0];
    }
    const d = new Date(dateToFormat + "T00:00:00");
    if (isNaN(d.getTime())) {
      return dateToFormat;
    }
    return d.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch {
    return isoDate;
  }
}

export default function Page() {
  const { data: session, status } = useSession();
  
  // State management
  const [data, setData] = useState<PageData>({ entries: [], avg7: null, avg30: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; entry: SleepEntry | null }>({ isOpen: false, entry: null });
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    rating: 7,
    comments: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    month: '',
    year: '',
    minRating: 1,
    maxRating: 10,
    search: ''
  });

  // Quick notes state
  const [showQuickNotes, setShowQuickNotes] = useState(false);

  // Initialize dark mode and load data
  useEffect(() => {
    // Initialize dark mode
    const darkMode = initializeDarkMode();
    setIsDark(darkMode);
    
    // Load data
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getData();
      if (result) {
        setData(result);
      } else {
        setData({ entries: [], avg7: null, avg30: null });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
      setData({ entries: [], avg7: null, avg30: null });
    } finally {
      setLoading(false);
    }
  };

  // Theme toggle
  const handleThemeToggle = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    toggleDarkMode(newDarkMode);
  };

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate date
    if (isDateInFuture(formData.date)) {
      setFormError('No puedes registrar fechas futuras');
      return;
    }

    const form = new FormData();
    form.append('date', formData.date);
    form.append('rating', formData.rating.toString());
    form.append('comments', formData.comments);

    try {
      startTransition(async () => {
        await upsertEntry(form);
        await loadData();
        setFormData({ ...formData, comments: '' }); // Clear comments but keep date and rating
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = (entry: SleepEntry) => {
    setConfirmDialog({ isOpen: true, entry });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.entry) return;

    const form = new FormData();
    form.append('id', confirmDialog.entry.id);

    try {
      await deleteEntry(form);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setConfirmDialog({ isOpen: false, entry: null });
    }
  };

  // Quick notes
  const addQuickNote = (note: string) => {
    const currentComments = formData.comments;
    const newComments = currentComments 
      ? (currentComments.includes(note) ? currentComments : `${currentComments}. ${note}`)
      : note;
    
    setFormData({ ...formData, comments: newComments });
    setShowQuickNotes(false);
  };

  // Export functionality
  const handleExport = () => {
    const filteredEntries = getFilteredEntries();
    exportToCSV(filteredEntries);
  };

  // Filter functionality
  const getFilteredEntries = (): SleepEntry[] => {
    if (!data?.entries) return [];
    let filtered = [...data.entries];

    // Month/Year filter
    if (filters.month && filters.year) {
      filtered = filterEntriesByMonth(filtered, parseInt(filters.year), parseInt(filters.month));
    }

    // Rating filter
    filtered = filterEntriesByRating(filtered, filters.minRating, filters.maxRating);

    // Search filter
    filtered = searchEntriesByComment(filtered, filters.search);

    return filtered;
  };

  const filteredEntries = getFilteredEntries();

  // Show loading while checking authentication
  if (status === 'loading' || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (status === 'unauthenticated') {
    window.location.href = '/auth/signin';
    return null;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 min-h-screen">
      {/* User header - Mobile optimized */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="Profile"
              className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {session?.user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => signOut()}
          className="btn text-sm px-3 py-2"
          title="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile optimized header */}
      <header className="mb-6">
        <div className="card-accent">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
                💤 Sleep Journal
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Registra cómo dormiste: fecha, nota (1–10) y comentarios
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              {/* Export button */}
              <button
                onClick={handleExport}
                className="btn"
                title="Exportar a CSV"
              >
                <Download className="h-4 w-4" />
              </button>
              
              {/* Theme toggle */}
              <button
                onClick={handleThemeToggle}
                className="btn"
                title={isDark ? 'Modo claro' : 'Modo oscuro'}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Stats - Mobile optimized */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Últimos 7 días</div>
              <div className="text-lg sm:text-2xl font-semibold">{data.avg7 ? data.avg7.toFixed(1) : "—"}</div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Últimos 30 días</div>
              <div className="text-lg sm:text-2xl font-semibold">{data.avg30 ? data.avg30.toFixed(1) : "—"}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Chart - Collapsible on mobile */}
      {showChart && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-semibold">Tendencias</h2>
            <button
              onClick={() => setShowChart(false)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded"
            >
              Ocultar <ChevronUp className="h-3 w-3 inline ml-1" />
            </button>
          </div>
          <SleepChart entries={data?.entries || []} />
        </section>
      )}

      {!showChart && (
        <div className="mb-6">
          <button
            onClick={() => setShowChart(true)}
            className="btn w-full"
          >
            📈 Mostrar Gráfico <ChevronDown className="h-4 w-4 ml-2" />
          </button>
        </div>
      )}

      {/* Form - Mobile optimized */}
      <section className="mb-6">
        <div className="card p-4">
          <h2 className="text-base sm:text-lg font-semibold mb-4">✏️ Agregar registro</h2>
          
          {/* Form error */}
          {formError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mobile-first form layout */}
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <label className="block">
                <span className="text-sm text-gray-700 dark:text-gray-300">Fecha</span>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  max={getMaxDate()}
                  className="input-field mt-1"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-700 dark:text-gray-300">Nota (1–10)</span>
                <input
                  type="number"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={10}
                  className="input-field mt-1"
                  required
                />
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Comentarios</label>
                <button
                  type="button"
                  onClick={() => setShowQuickNotes(!showQuickNotes)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded"
                >
                  {showQuickNotes ? 'Ocultar' : '⚡ Rápidas'}
                </button>
              </div>
              
              {showQuickNotes && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_NOTES.map((note, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addQuickNote(note)}
                        className="text-xs px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={3}
                placeholder="Ej: Me desperté 1 vez, sin alarma, descansado..."
                className="input-field resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || isDateInFuture(formData.date)}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </div>
              ) : (
                '💾 Guardar'
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Filters - Mobile optimized */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-semibold">📋 Historial ({filteredEntries.length})</h2>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn text-sm"
          >
            <Filter className="h-3 w-3 mr-1" />
            Filtros
            {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </button>
        </div>

        {showFilters && (
          <div className="card p-4 mb-4">
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en comentarios..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="input-field pl-9"
                />
              </div>

              {/* Month/Year - Mobile stacked */}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="">Todos</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleDateString('es-CL', { month: 'long' })}
                    </option>
                  ))}
                </select>
                
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="">Año</option>
                  {Array.from({ length: 3 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Rating range */}
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-shrink-0">Nota:</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: parseInt(e.target.value) || 1 })}
                  className="input-field flex-1 text-center text-sm"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={filters.maxRating}
                  onChange={(e) => setFilters({ ...filters, maxRating: parseInt(e.target.value) || 10 })}
                  className="input-field flex-1 text-center text-sm"
                />
              </div>

              {/* Clear filters */}
              <button
                onClick={() => setFilters({ month: '', year: '', minRating: 1, maxRating: 10, search: '' })}
                className="btn w-full text-sm"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Entries - Mobile optimized */}
      <section className="space-y-3 pb-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {filteredEntries.length === 0 && !error && (
          <div className="card p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">
              {filters.search || filters.month || filters.minRating > 1 || filters.maxRating < 10
                ? 'No se encontraron registros con los filtros aplicados'
                : 'Aún no hay registros. ¡Comienza arriba!'}
            </p>
            {(filters.search || filters.month || filters.minRating > 1 || filters.maxRating < 10) && (
              <button
                onClick={() => setFilters({ month: '', year: '', minRating: 1, maxRating: 10, search: '' })}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        <ul className="space-y-3">
          {filteredEntries.map((entry) => (
            <li key={entry.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium mb-1 truncate">{formatDatePretty(entry.date)}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Nota:</span>
                    <span className="text-sm font-semibold">{entry.rating}/10</span>
                    <div
                      className="h-2 w-16 rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-500 flex-shrink-0"
                      style={{ opacity: Math.max(0.35, entry.rating / 10) }}
                    />
                  </div>
                  {entry.comments && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {entry.comments}
                    </p>
                  )}
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {(() => {
                      try {
                        const date = typeof entry.updated_at === 'string' 
                          ? new Date(entry.updated_at) 
                          : entry.updated_at;
                        return date.toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      } catch (error) {
                        return 'Fecha no válida';
                      }
                    })()}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(entry)}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                  title="Eliminar registro"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="text-center text-xs text-gray-500 dark:text-gray-400 py-4">
        Hecho con ❤️ · Next.js · Vercel
        <br />
        <span className="inline-block mt-1">🔒 Datos privados y seguros</span>
      </footer>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, entry: null })}
        onConfirm={confirmDelete}
        entry={confirmDialog.entry}
      />
    </main>
  );
}