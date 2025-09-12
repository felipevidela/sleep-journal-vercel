// Comprehensive type definitions for the Sleep Journal app

// Database Types
export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  city: string;
  country: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  created_at: string;
  updated_at: string;
}

export interface SleepEntry {
  id: string;
  user_id: string;
  date: string; // ISO date (YYYY-MM-DD)
  rating: number; // 1-10
  comments: string | null;
  start_time: string | null; // HH:MM format (bedtime)
  end_time: string | null; // HH:MM format (wake up time)
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
}

// Form Types
export interface SleepEntryForm {
  date: string;
  rating: number;
  comments: string;
  start_time: string;
  end_time: string;
}

export interface UserRegistrationForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  city: string;
  country: string;
  gender: string;
}

export interface UserSignInForm {
  email: string;
  password: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface DashboardData {
  entries: SleepEntry[];
  user: User;
  avg7?: number;
  avg30?: number;
}

// Chart and Analytics Types
export interface ChartData {
  labels: string[];
  data: (number | null)[];
}

export interface SleepStatistics {
  average: number;
  highest: number;
  lowest: number;
  total: number;
  trend: 'improving' | 'declining' | 'stable';
  consistency: number; // 0-1 score
}

export interface DateRange {
  start: string;
  end: string;
}

export interface FilterOptions {
  dateRange?: DateRange;
  minRating?: number;
  maxRating?: number;
  searchTerm?: string;
  sortBy?: 'date' | 'rating' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

// Component Props Types
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entry: SleepEntry | null;
  isLoading?: boolean;
}

export interface SleepChartProps {
  entries: SleepEntry[];
  days?: number;
  showMovingAverage?: boolean;
  height?: number;
}

// Error Types
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type DateString = string; // YYYY-MM-DD format

export type Rating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Theme and UI Types
export interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  bgPrimary: string;
}

export type Theme = 'light' | 'dark' | 'system';

// Export/Import Types
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange?: DateRange;
  includeMetadata?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

// Validation Schema Types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
}

export type ValidationSchema<T> = {
  [K in keyof T]: ValidationRule;
};

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  ratingMin?: number;
  ratingMax?: number;
  hasComments?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

export interface SortOption {
  field: keyof SleepEntry;
  direction: 'asc' | 'desc';
}