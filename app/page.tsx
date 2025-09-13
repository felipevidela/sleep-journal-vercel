'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Moon, Sun, Download, Filter, Search,
  Trash2, X, ChevronDown, ChevronUp, AlertCircle, LogOut, User
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import SleepChart from '@/components/SleepChart';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';
import QuickInsights from '@/components/QuickInsights';
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
  toggleDarkMode,
  formatSleepDuration
} from '@/lib/utils';
import { upsertEntry, deleteEntry, getData } from './actions';

interface PageData {
  entries: SleepEntry[];
  avg7: number | null;
  avg30: number | null;
  user: { id: string; name: string; email: string; age: number; city: string; country: string; gender: string } | null;
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
      dateToFormat = isoDate.split('T')[0] || isoDate;
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
  console.log("Client: Page component rendered");
  
  // Simple test to see if client-side JavaScript is working
  if (typeof window !== 'undefined') {
    console.log("Client: We are in the browser!");
    console.log("Client: Window object exists:", !!window);
    console.log("Client: Document exists:", !!document);
  } else {
    console.log("Client: We are on the server");
  }
  
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string; age: number; city: string; country: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // State management
  const [data, setData] = useState<PageData>({ entries: [], avg7: null, avg30: null, user: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; entry: SleepEntry | null }>({ isOpen: false, entry: null });
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0] || '',
    rating: '',
    comments: '',
    start_time: '',
    end_time: ''
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

  const checkAuth = async () => {
    console.log("Client: checkAuth started");
    try {
      console.log("Client: calling getData Server Action...");
      const result = await getData();
      console.log("Client: Server Action result:", result);
      if (result && result.user) {
        console.log("Client: Setting data and user");
        setData(result);
        setUser(result.user);
        console.log("Client: Auth successful");
      } else {
        console.log("Client: No user in result, redirecting to signin");
        router.push('/auth/signin');
        return;
      }
    } catch (err) {
      console.log("Client: Error in checkAuth:", err);
      router.push('/auth/signin');
      return;
    } finally {
      console.log("Client: Setting loading states to false");
      setAuthLoading(false);
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getData();
      if (result) {
        setData(result);
        // Update user info if it comes with the data
        if (result.user) {
          setUser(result.user);
        }
      } else {
        setData({ entries: [], avg7: null, avg30: null, user: null });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
      setData({ entries: [], avg7: null, avg30: null, user: null });
    } finally {
      setLoading(false);
    }
  };

  // Initialize dark mode, check auth and load data
  useEffect(() => {
    console.log("Client: useEffect triggered");
    console.log("Client: checkAuth function exists:", typeof checkAuth);
    
    // Initialize dark mode
    console.log("Client: Initializing dark mode");
    const darkMode = initializeDarkMode();
    setIsDark(darkMode);
    console.log("Client: Dark mode set to:", darkMode);
    
    // Check authentication
    console.log("Client: About to call checkAuth");
    checkAuth().catch(err => console.log("Client: checkAuth error:", err));
    
    // Fallback: Force loading to false after 10 seconds
    const fallbackTimeout = setTimeout(() => {
      console.log("Client: Fallback timeout - forcing loading to false");
      setAuthLoading(false);
      setLoading(false);
    }, 10000);
    
    return () => clearTimeout(fallbackTimeout);
  }, []);

  // Force clean form on component mount
  useEffect(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0] || '',
      rating: '',
      comments: '',
      start_time: '',
      end_time: ''
    });
  }, []);

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        router.push('/auth/signin');
      } else {
        console.error('Error signing out');
      }
    } catch (error) {
      console.error('Error signing out:', error);
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

    // Validar que rating no esté vacío
    if (!formData.rating || formData.rating === '') {
      setFormError('La nota es obligatoria');
      return;
    }

    const form = new FormData();
    form.append('date', formData.date);
    form.append('rating', formData.rating.toString());
    form.append('comments', formData.comments);
    form.append('start_time', formData.start_time);
    form.append('end_time', formData.end_time);

    try {
      startTransition(async () => {
        await upsertEntry(form);
        await loadData();
        setFormData({ ...formData, rating: '', comments: '', start_time: '', end_time: '' }); // Clear rating, comments and times but keep date
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
  console.log("Client: Render state - authLoading:", authLoading, "loading:", loading, "user:", !!user);
  if (authLoading || loading) {
    console.log("Client: Showing loading skeleton");
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 min-h-screen">
        {/* Header Skeleton */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="card p-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-10"></div>
            </div>
            <div className="card p-4">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-10"></div>
            </div>
          </div>
        </header>

        {/* Chart Skeleton */}
        <section className="mb-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4"></div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12 mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16 mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12 mx-auto"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Skeleton */}
        <section className="mb-6">
          <div className="card p-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32 mb-4"></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12 mb-1"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12 mb-1"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20 mb-1"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Entries List Skeleton */}
        <section>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32 mb-2"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-10"></div>
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mb-1"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
                  </div>
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Don't render if not authenticated (redirect is handled in checkAuth)
  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 min-h-screen">
      {/* User header - Mobile optimized */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {user?.email || 'usuario@email.com'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSignOut}
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
              <p className="mt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-400">
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
            <div className="card stats-card p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Últimos 7 días</div>
              <div className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{data.avg7 ? data.avg7.toFixed(1) : "—"}</div>
            </div>
            <div className="card stats-card p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">Últimos 30 días</div>
              <div className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{data.avg30 ? data.avg30.toFixed(1) : "—"}</div>
            </div>
          </div>

          {/* Quick Insights */}
          <QuickInsights entries={data?.entries || []} />
        </div>
      </header>

      {/* Chart - Collapsible on mobile */}
      {showChart && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-semibold">Tendencias</h2>
            <button
              onClick={() => setShowChart(false)}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded"
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

      {/* Advanced Analytics - Collapsible */}
      {showAnalytics && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-semibold">Análisis Avanzado</h2>
            <button
              onClick={() => setShowAnalytics(false)}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded"
            >
              Ocultar <ChevronUp className="h-3 w-3 inline ml-1" />
            </button>
          </div>
          <AdvancedAnalytics entries={data?.entries || []} />
        </section>
      )}

      {!showAnalytics && data?.entries && data.entries.length >= 3 && (
        <div className="mb-6">
          <button
            onClick={() => setShowAnalytics(true)}
            className="btn w-full"
          >
            📊 Mostrar Análisis Avanzado <ChevronDown className="h-4 w-4 ml-2" />
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

          <form onSubmit={handleSubmit} className="space-y-4" key="sleep-form-v2">
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
                  value={formData.rating === '' ? '' : formData.rating}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir campo vacío o números enteros del 1 al 10
                    if (value === '' || (/^[1-9]$|^10$/.test(value))) {
                      setFormData({ ...formData, rating: value });
                    }
                  }}
                  onBlur={(e) => {
                    // Si el campo está vacío al perder foco, no hacer nada
                    // La validación required se encargará del resto
                  }}
                  min={1}
                  max={10}
                  step={1}
                  placeholder=""
                  className="input-field mt-1"
                  autoComplete="off"
                  data-testid="rating-input"
                  key="rating-input-clean"
                  required
                />
              </label>
            </div>

            {/* Time tracking section - Formato militar (24h) */}
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <label className="block">
                <span className="text-sm text-gray-700 dark:text-gray-300">Hora de dormir (24h)</span>
                <input
                  type="time"
                  value={formData.start_time || ''}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="input-field mt-1"
                  placeholder="23:30"
                  autoComplete="off"
                  data-testid="start-time-input"
                  key="start-time-military"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Formato: HH:MM (ej: 23:30)</span>
              </label>

              <label className="block">
                <span className="text-sm text-gray-700 dark:text-gray-300">Hora de despertar (24h)</span>
                <input
                  type="time"
                  value={formData.end_time || ''}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="input-field mt-1"
                  placeholder="07:30"
                  autoComplete="off"
                  data-testid="end-time-input"
                  key="end-time-military"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Formato: HH:MM (ej: 07:30)</span>
              </label>
            </div>

            {/* Sleep duration display */}
            {formData.start_time && formData.end_time && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Duración estimada:</strong> {(() => {
                    const duration = formatSleepDuration({
                      hours: 0,
                      minutes: 0,
                      totalMinutes: (() => {
                        const start = new Date(`2000-01-01T${formData.start_time}`);
                        const end = new Date(`2000-01-${formData.start_time > formData.end_time ? '02' : '01'}T${formData.end_time}`);
                        return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                      })()
                    });
                    return duration;
                  })()}
                </div>
              </div>
            )}

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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
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
                <span className="text-gray-600 dark:text-gray-400">-</span>
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
            <p className="text-gray-700 dark:text-gray-400 mb-2 text-sm">
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
                    <span className="text-xs text-gray-600 dark:text-gray-400">Nota:</span>
                    <span className="text-sm font-semibold">{entry.rating}/10</span>
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-500 transition-all duration-300"
                        style={{ width: `${entry.rating * 10}%` }}
                        aria-label={`Calificación: ${entry.rating} de 10`}
                      />
                    </div>
                  </div>
                  
                  {/* Sleep time information - Formato militar */}
                  {(entry.start_time || entry.end_time || entry.sleep_duration_minutes) && (
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {entry.start_time && (
                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">🛌 {entry.start_time}h</span>
                      )}
                      {entry.end_time && (
                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">⏰ {entry.end_time}h</span>
                      )}
                      {entry.sleep_duration_minutes && (
                        <span className="font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                          ⏱️ {formatSleepDuration({
                            hours: entry.sleep_duration_hours || 0,
                            minutes: 0,
                            totalMinutes: entry.sleep_duration_minutes
                          })}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {entry.comments && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {entry.comments}
                    </p>
                  )}
                  <div className="text-xs text-gray-600 dark:text-gray-500 mt-2">
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
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                  title="Eliminar registro"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="text-center text-xs text-gray-600 dark:text-gray-400 py-4">
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