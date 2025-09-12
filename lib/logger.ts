// Enhanced logging and error handling system

import { ValidationError, AuthenticationError, DatabaseError } from './types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.logLevel = (process.env['LOG_LEVEL'] as LogLevel) || 'info';
    this.isDevelopment = process.env['NODE_ENV'] === 'development';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    
    let logMessage = `[${timestamp}] ${level} ${entry.message}`;
    
    if (entry.userId) {
      logMessage += ` | userId: ${entry.userId}`;
    }
    
    if (entry.requestId) {
      logMessage += ` | requestId: ${entry.requestId}`;
    }
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      logMessage += ` | context: ${JSON.stringify(entry.context)}`;
    }
    
    return logMessage;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedMessage = this.formatLog(entry);

    if (this.isDevelopment) {
      // Enhanced development logging
      const style = this.getConsoleStyle(entry.level);
      console.log(`%c${formattedMessage}`, style);
      
      if (entry.error) {
        console.error('Error details:', entry.error);
        if (entry.error.stack) {
          console.error('Stack trace:', entry.error.stack);
        }
      }
    } else {
      // Production logging (could be sent to external service)
      console.log(JSON.stringify({
        ...entry,
        formatted: formattedMessage
      }));
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #888; font-size: 12px;',
      info: 'color: #0066cc; font-weight: bold;',
      warn: 'color: #ff9900; font-weight: bold;',
      error: 'color: #cc0000; font-weight: bold; background: #ffe6e6;'
    };
    return styles[level] || '';
  }

  debug(message: string, context?: Record<string, any>, userId?: string): void {
    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString()
    };
    
    if (context) entry.context = context;
    if (userId) entry.userId = userId;
    
    this.writeLog(entry);
  }

  info(message: string, context?: Record<string, any>, userId?: string): void {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString()
    };
    
    if (context) entry.context = context;
    if (userId) entry.userId = userId;
    
    this.writeLog(entry);
  }

  warn(message: string, context?: Record<string, any>, userId?: string): void {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString()
    };
    
    if (context) entry.context = context;
    if (userId) entry.userId = userId;
    
    this.writeLog(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>, userId?: string): void {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString()
    };
    
    if (error) entry.error = error;
    if (context) entry.context = context;
    if (userId) entry.userId = userId;
    
    this.writeLog(entry);
  }

  // Specialized logging methods
  authLog(event: string, userId?: string, success = true, details?: Record<string, any>): void {
    this.info(`Auth: ${event}${success ? ' successful' : ' failed'}`, {
      event,
      success,
      ...details
    }, userId);
  }

  dbLog(operation: string, table?: string, userId?: string, duration?: number): void {
    this.debug(`DB: ${operation}${table ? ` on ${table}` : ''}`, {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined
    }, userId);
  }

  apiLog(method: string, path: string, status: number, duration: number, userId?: string): void {
    const level = status >= 400 ? 'warn' : 'info';
    const message = `API: ${method} ${path} - ${status}`;
    
    this[level](message, {
      method,
      path,
      status,
      duration: `${duration}ms`
    }, userId);
  }
}

// Error handler utilities
export class ErrorHandler {
  private static logger = Logger.getInstance();

  /**
   * Handle and classify errors
   */
  static handleError(error: Error, context?: Record<string, any>, userId?: string): {
    message: string;
    statusCode: number;
    code: string;
  } {
    let message: string;
    let statusCode: number;
    let code: string;

    if (error instanceof ValidationError) {
      message = error.message;
      statusCode = 400;
      code = error.code;
      this.logger.warn(`Validation error: ${message}`, { ...context, field: error.field }, userId);
    } else if (error instanceof AuthenticationError) {
      message = 'Authentication required';
      statusCode = 401;
      code = 'AUTHENTICATION_ERROR';
      this.logger.warn(`Authentication error: ${error.message}`, context, userId);
    } else if (error instanceof DatabaseError) {
      message = 'Database operation failed';
      statusCode = 500;
      code = 'DATABASE_ERROR';
      this.logger.error(`Database error: ${error.message}`, error.originalError, context, userId);
    } else {
      message = 'An unexpected error occurred';
      statusCode = 500;
      code = 'INTERNAL_ERROR';
      this.logger.error(`Unexpected error: ${error.message}`, error, context, userId);
    }

    return { message, statusCode, code };
  }

  /**
   * Create a safe error response for clients
   */
  static createErrorResponse(error: Error, isDevelopment = false) {
    const handled = this.handleError(error);
    
    return {
      error: handled.message,
      code: handled.code,
      ...(isDevelopment && { 
        stack: error.stack,
        originalMessage: error.message 
      })
    };
  }

  /**
   * Async wrapper to catch and handle errors
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>,
    userId?: string
  ): Promise<{ success: true; data: T } | { success: false; error: ReturnType<typeof ErrorHandler.handleError> }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const handledError = this.handleError(error as Error, context, userId);
      return { success: false, error: handledError };
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static logger = Logger.getInstance();
  private static timers = new Map<string, number>();

  /**
   * Start timing an operation
   */
  static start(operation: string): string {
    const timerId = `${operation}_${Date.now()}_${Math.random()}`;
    this.timers.set(timerId, performance.now());
    return timerId;
  }

  /**
   * End timing and log results
   */
  static end(timerId: string, operation?: string, userId?: string): number {
    const startTime = this.timers.get(timerId);
    if (!startTime) {
      this.logger.warn('Performance timer not found', { timerId });
      return 0;
    }

    const duration = Math.round(performance.now() - startTime);
    this.timers.delete(timerId);

    const logContext = {
      operation: operation || 'unknown',
      duration: `${duration}ms`,
      timerId
    };

    if (duration > 1000) {
      this.logger.warn(`Slow operation detected: ${operation}`, logContext, userId);
    } else if (duration > 500) {
      this.logger.info(`Operation timing: ${operation}`, logContext, userId);
    } else {
      this.logger.debug(`Operation timing: ${operation}`, logContext, userId);
    }

    return duration;
  }

  /**
   * Time a function execution
   */
  static async time<T>(
    operation: string,
    fn: () => Promise<T> | T,
    userId?: string
  ): Promise<{ result: T; duration: number }> {
    const timerId = this.start(operation);
    try {
      const result = await fn();
      const duration = this.end(timerId, operation, userId);
      return { result, duration };
    } catch (error) {
      this.end(timerId, `${operation} (failed)`, userId);
      throw error;
    }
  }
}

// Rate limiting utilities
export class RateLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number }>();
  private static logger = Logger.getInstance();

  /**
   * Check if request should be rate limited
   */
  static checkLimit(
    key: string, 
    maxAttempts: number, 
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let record = this.attempts.get(key);
    
    if (!record || record.resetTime < windowStart) {
      // Create new record or reset expired record
      record = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    record.count += 1;
    this.attempts.set(key, record);

    const allowed = record.count <= maxAttempts;
    const remaining = Math.max(0, maxAttempts - record.count);

    if (!allowed) {
      this.logger.warn('Rate limit exceeded', {
        key,
        attempts: record.count,
        maxAttempts,
        resetTime: new Date(record.resetTime).toISOString()
      });
    }

    return {
      allowed,
      remaining,
      resetTime: record.resetTime
    };
  }

  /**
   * Reset rate limit for a key
   */
  static reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clean up expired records
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (record.resetTime < now) {
        this.attempts.delete(key);
      }
    }
  }
}

// Export singleton instances
export const logger = Logger.getInstance();
export const performanceMonitor = PerformanceMonitor;
export const errorHandler = ErrorHandler;
export const rateLimiter = RateLimiter;

// Cleanup function for rate limiter (should be called periodically)
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    RateLimiter.cleanup();
  }, 5 * 60 * 1000); // Cleanup every 5 minutes
}