// Utility functions for the Sleep Journal app

export type SleepEntry = {
  id: string;
  user_id: string;
  date: string;
  rating: number;
  comments: string | null;
  start_time: string | null;
  end_time: string | null;
  sleep_duration_hours: number | null;
  sleep_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
};

// Date validation
export function isDateInFuture(dateString: string): boolean {
  const inputDate = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  return inputDate > today;
}

export function getMaxDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0] || '';
}

// CSV Export functionality
export function exportToCSV(entries: SleepEntry[], filename = 'sleep-journal-export.csv'): void {
  const headers = ['Fecha', 'Nota', 'Comentarios', 'Hora Dormir', 'Hora Despertar', 'Duración (horas)', 'Duración (minutos)', 'Creado', 'Actualizado'];
  
  const csvContent = [
    headers.join(','),
    ...entries.map(entry => [
      entry.date,
      entry.rating,
      `"${(entry.comments || '').replace(/"/g, '""')}"`, // Escape quotes in comments
      entry.start_time || '',
      entry.end_time || '',
      entry.sleep_duration_hours || '',
      entry.sleep_duration_minutes || '',
      entry.created_at,
      entry.updated_at
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Filter functions
export function filterEntriesByMonth(entries: SleepEntry[], year: number, month: number): SleepEntry[] {
  return entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getFullYear() === year && entryDate.getMonth() === month - 1;
  });
}

export function filterEntriesByRating(entries: SleepEntry[], minRating: number, maxRating: number): SleepEntry[] {
  return entries.filter(entry => entry.rating >= minRating && entry.rating <= maxRating);
}

export function searchEntriesByComment(entries: SleepEntry[], searchTerm: string): SleepEntry[] {
  if (!searchTerm.trim()) return entries;
  
  const term = searchTerm.toLowerCase();
  return entries.filter(entry => 
    entry.comments?.toLowerCase().includes(term) || false
  );
}

// Chart data preparation
export function prepareChartData(entries: SleepEntry[], days: number = 30) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days + 1);
  
  const labels: string[] = [];
  const data: (number | null)[] = [];
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const dateString = currentDate.toISOString().split('T')[0];
    labels.push(currentDate.toLocaleDateString('es-CL', { month: 'short', day: 'numeric' }));
    
    const entry = entries.find(e => e.date === dateString);
    data.push(entry ? entry.rating : null);
  }
  
  return { labels, data };
}

// Calculate moving average for trend line
export function calculateMovingAverage(data: (number | null)[], windowSize: number = 7): (number | null)[] {
  const result: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      result.push(null);
      continue;
    }
    
    const window = data.slice(i - windowSize + 1, i + 1);
    const validValues = window.filter(v => v !== null) as number[];
    
    if (validValues.length > 0) {
      const average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
      result.push(Math.round(average * 10) / 10); // Round to 1 decimal
    } else {
      result.push(null);
    }
  }
  
  return result;
}

// Quick note templates
export const QUICK_NOTES = [
  "Descansé bien",
  "Me desperté cansado",
  "Pesadillas",
  "Insomnio",
  "Siestas durante el día",
  "Me desperté varias veces",
  "Dormí sin alarma",
  "Estrés/Ansiedad"
];

// Dark mode utilities
export function initializeDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  const stored = localStorage.getItem('darkMode');
  let isDark: boolean;
  
  if (stored !== null) {
    isDark = stored === 'true';
  } else {
    // Default to system preference
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  // Apply immediately
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  return isDark;
}

export function toggleDarkMode(isDark: boolean): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('darkMode', isDark.toString());
  
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Sleep duration calculation utilities
export interface SleepDuration {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

/**
 * Calculate sleep duration between start and end times
 * Handles overnight sleep (e.g., 23:00 to 07:00)
 */
export function calculateSleepDuration(startTime: string, endTime: string): SleepDuration | null {
  if (!startTime || !endTime) return null;
  
  // Parse times
  const startParts = startTime.split(':').map(Number);
  const endParts = endTime.split(':').map(Number);
  
  if (startParts.length !== 2 || endParts.length !== 2) {
    return null;
  }
  
  const startHour = startParts[0]!;
  const startMin = startParts[1]!;
  const endHour = endParts[0]!;
  const endMin = endParts[1]!;
  
  // Validate time format
  if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
    return null;
  }
  
  // Create Date objects for calculation (using arbitrary date)
  const baseDate = new Date('2000-01-01');
  const start = new Date(baseDate);
  start.setHours(startHour, startMin, 0, 0);
  
  const end = new Date(baseDate);
  end.setHours(endHour, endMin, 0, 0);
  
  // If end time is earlier than start time, assume it's next day
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }
  
  // Calculate difference in milliseconds
  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.round(diffMs / (1000 * 60));
  
  // Convert to hours and minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const decimalHours = Math.round((totalMinutes / 60) * 100) / 100; // Round to 2 decimal places
  
  return {
    hours: decimalHours,
    minutes: minutes,
    totalMinutes: totalMinutes
  };
}

/**
 * Format duration for display
 */
export function formatSleepDuration(duration: SleepDuration | null): string {
  if (!duration) return '';
  
  const hours = Math.floor(duration.totalMinutes / 60);
  const minutes = duration.totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}