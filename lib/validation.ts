// Comprehensive validation and sanitization utilities

import { ValidationError } from './types';
import type { 
  ValidationSchema, 
  ValidationRule, 
  SleepEntryForm, 
  UserRegistrationForm, 
  UserSignInForm 
} from './types';

// Sanitization utilities
export class Sanitizer {
  /**
   * Remove HTML tags and potentially harmful content
   */
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Sanitize and validate email addresses
   */
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[^\w@.-]/g, ''); // Keep only valid email characters
  }

  /**
   * Sanitize text input for database storage
   */
  static sanitizeText(input: string, maxLength = 1000): string {
    if (!input || typeof input !== 'string') return '';
    
    return this.sanitizeHtml(input)
      .slice(0, maxLength)
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: any, min?: number, max?: number): number | null {
    const num = Number(input);
    if (isNaN(num)) return null;
    
    // Don't auto-correct to min/max, let validation handle it
    if (min !== undefined && num < min) return null;
    if (max !== undefined && num > max) return null;
    
    return num;
  }

  /**
   * Sanitize date string to YYYY-MM-DD format
   */
  static sanitizeDate(input: string): string | null {
    if (!input || typeof input !== 'string') return null;
    
    const date = new Date(input + 'T00:00:00');
    if (isNaN(date.getTime())) return null;
    
    return date.toISOString().split('T')[0] || null;
  }
}

// Validation utilities
export class Validator {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }
    
    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }
    
    if (password.length > 128) {
      errors.push('La contraseña no puede exceder 128 caracteres');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate date is not in the future
   */
  static isValidSleepDate(dateString: string): boolean {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return date <= today && date >= new Date('2000-01-01');
  }

  /**
   * Validate sleep rating (1-10)
   */
  static isValidRating(rating: number): boolean {
    return Number.isInteger(rating) && rating >= 1 && rating <= 10;
  }

  /**
   * Validate age
   */
  static isValidAge(age: number): boolean {
    return Number.isInteger(age) && age >= 13 && age <= 150;
  }

  /**
   * Generic field validation
   */
  static validateField(value: any, rule: ValidationRule): string | null {
    if (rule.required && (value === undefined || value === null || value === '')) {
      return 'Este campo es obligatorio';
    }

    if (value === undefined || value === null || value === '') {
      return null; // Optional field, no validation needed
    }

    const stringValue = String(value);

    if (rule.minLength && stringValue.length < rule.minLength) {
      return `Debe tener al menos ${rule.minLength} caracteres`;
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return `No puede exceder ${rule.maxLength} caracteres`;
    }

    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return 'Formato inválido';
    }

    const numValue = Number(value);
    if (!isNaN(numValue)) {
      if (rule.min !== undefined && numValue < rule.min) {
        return `Debe ser al menos ${rule.min}`;
      }

      if (rule.max !== undefined && numValue > rule.max) {
        return `No puede ser mayor a ${rule.max}`;
      }
    }

    if (rule.custom) {
      const result = rule.custom(value);
      if (typeof result === 'string') {
        return result;
      }
      if (result === false) {
        return 'Valor inválido';
      }
    }

    return null;
  }

  /**
   * Validate object against schema
   */
  static validateSchema<T>(data: Partial<T>, schema: ValidationSchema<T>): {
    valid: boolean;
    errors: Partial<Record<keyof T, string>>;
  } {
    const errors: Partial<Record<keyof T, string>> = {};

    for (const [key, rule] of Object.entries(schema) as [keyof T, ValidationRule][]) {
      const error = this.validateField(data[key], rule);
      if (error) {
        errors[key] = error;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Validation schemas
export const sleepEntrySchema: ValidationSchema<SleepEntryForm> = {
  date: {
    required: true,
    custom: (value) => {
      const sanitized = Sanitizer.sanitizeDate(value);
      if (!sanitized) return 'Fecha inválida';
      if (!Validator.isValidSleepDate(sanitized)) return 'La fecha no puede ser futura';
      return true;
    }
  },
  rating: {
    required: true,
    min: 1,
    max: 10,
    custom: (value) => {
      const num = Number(value);
      if (!Validator.isValidRating(num)) return 'La calificación debe ser entre 1 y 10';
      return true;
    }
  },
  comments: {
    maxLength: 1000,
    custom: (value) => {
      if (value && typeof value === 'string') {
        const sanitized = Sanitizer.sanitizeText(value);
        if (sanitized !== value.trim()) {
          return 'El comentario contiene contenido no permitido';
        }
      }
      return true;
    }
  },
  start_time: {
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    custom: (value) => {
      if (value && !(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value))) {
        return 'Formato de hora inválido (HH:MM)';
      }
      return true;
    }
  },
  end_time: {
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    custom: (value) => {
      if (value && !(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value))) {
        return 'Formato de hora inválido (HH:MM)';
      }
      return true;
    }
  }
};

export const userRegistrationSchema: ValidationSchema<UserRegistrationForm> = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    custom: (value) => {
      const sanitized = Sanitizer.sanitizeText(value);
      if (!sanitized) return 'Nombre inválido';
      return true;
    }
  },
  email: {
    required: true,
    maxLength: 255,
    custom: (value) => {
      const sanitized = Sanitizer.sanitizeEmail(value);
      if (!Validator.isValidEmail(sanitized)) return 'Email inválido';
      return true;
    }
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    custom: (value) => {
      const validation = Validator.isValidPassword(value);
      if (!validation.valid) return validation.errors[0] || 'Contraseña inválida';
      return true;
    }
  },
  confirmPassword: {
    required: true,
    minLength: 8
  },
  age: {
    required: true,
    custom: (value) => {
      const age = Number(value);
      if (!Validator.isValidAge(age)) return 'Edad debe estar entre 13 y 150 años';
      return true;
    }
  },
  city: {
    required: true,
    minLength: 2,
    maxLength: 100,
    custom: (value) => {
      const sanitized = Sanitizer.sanitizeText(value);
      if (!sanitized) return 'Ciudad inválida';
      return true;
    }
  },
  country: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  gender: {
    required: true,
    custom: (value) => {
      if (!['Masculino', 'Femenino', 'Otro'].includes(value)) {
        return 'Género inválido';
      }
      return true;
    }
  }
};

export const userSignInSchema: ValidationSchema<UserSignInForm> = {
  email: {
    required: true,
    custom: (value) => {
      const sanitized = Sanitizer.sanitizeEmail(value);
      if (!Validator.isValidEmail(sanitized)) return 'Email inválido';
      return true;
    }
  },
  password: {
    required: true,
    minLength: 1
  }
};

// Helper functions for form validation
export function validateSleepEntry(data: Partial<SleepEntryForm>): {
  valid: boolean;
  errors: Partial<Record<keyof SleepEntryForm, string>>;
  sanitized: SleepEntryForm | null;
} {
  const validation = Validator.validateSchema(data, sleepEntrySchema);
  
  if (!validation.valid) {
    return { ...validation, sanitized: null };
  }

  const sanitizedRating = Sanitizer.sanitizeNumber(data.rating!, 1, 10);
  
  const sanitized: SleepEntryForm = {
    date: Sanitizer.sanitizeDate(data.date!) || '',
    rating: sanitizedRating || 0, // Will be caught by validation if invalid
    comments: Sanitizer.sanitizeText(data.comments || '', 1000),
    start_time: data.start_time || '',
    end_time: data.end_time || ''
  };

  return { ...validation, sanitized };
}

export function validateUserRegistration(data: Partial<UserRegistrationForm>): {
  valid: boolean;
  errors: Partial<Record<keyof UserRegistrationForm, string>>;
  sanitized: Omit<UserRegistrationForm, 'confirmPassword'> | null;
} {
  const validation = Validator.validateSchema(data, userRegistrationSchema);
  
  // Check password confirmation
  if (data.password !== data.confirmPassword) {
    validation.errors.confirmPassword = 'Las contraseñas no coinciden';
    validation.valid = false;
  }
  
  if (!validation.valid) {
    return { ...validation, sanitized: null };
  }

  const sanitized = {
    name: Sanitizer.sanitizeText(data.name!),
    email: Sanitizer.sanitizeEmail(data.email!),
    password: data.password!,
    age: String(Sanitizer.sanitizeNumber(data.age!, 13, 150)),
    city: Sanitizer.sanitizeText(data.city!),
    country: Sanitizer.sanitizeText(data.country!),
    gender: data.gender!
  };

  return { ...validation, sanitized };
}

export function validateUserSignIn(data: Partial<UserSignInForm>): {
  valid: boolean;
  errors: Partial<Record<keyof UserSignInForm, string>>;
  sanitized: UserSignInForm | null;
} {
  const validation = Validator.validateSchema(data, userSignInSchema);
  
  if (!validation.valid) {
    return { ...validation, sanitized: null };
  }

  const sanitized: UserSignInForm = {
    email: Sanitizer.sanitizeEmail(data.email!),
    password: data.password!
  };

  return { ...validation, sanitized };
}