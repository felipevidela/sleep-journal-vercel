import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, cleanupExpiredSessions } from '@/lib/auth';
import { validateUserSignIn } from '@/lib/validation';
import { logger, errorHandler, performanceMonitor } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const timerId = performanceMonitor.start('signin');
  
  try {
    const requestBody = await request.json();
    const { email, password } = requestBody;

    // Validate and sanitize input
    const validation = validateUserSignIn({ email, password });
    if (!validation.valid) {
      logger.warn('Sign-in validation failed', { errors: validation.errors });
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: validation.errors },
        { status: 400 }
      );
    }

    const { sanitized } = validation;

    // Clean up expired sessions periodically
    try {
      await cleanupExpiredSessions();
      logger.debug('Expired sessions cleaned up');
    } catch (error) {
      logger.warn('Failed to cleanup expired sessions', { error: error instanceof Error ? error.message : String(error) });
    }

    const authTimerId = performanceMonitor.start('authentication');
    
    try {
      // Authenticate user
      const user = await authenticateUser(sanitized!.email, sanitized!.password);
      performanceMonitor.end(authTimerId, 'authentication');

      if (!user) {
        logger.authLog('signin', undefined, false, { email: sanitized!.email });
        return NextResponse.json(
          { error: 'Email o contraseña incorrectos' },
          { status: 401 }
        );
      }

      // Create session
      await createSession(user.id);
      logger.authLog('signin', user.id, true);

      const duration = performanceMonitor.end(timerId, 'signin', user.id);
      logger.apiLog('POST', '/api/auth/signin', 200, duration, user.id);

      // Return success
      return NextResponse.json({
        success: true,
        user
      });

    } catch (error) {
      performanceMonitor.end(authTimerId, 'authentication (failed)');
      const handled = errorHandler.handleError(error as Error, { email: sanitized!.email });
      
      const duration = performanceMonitor.end(timerId, 'signin (failed)');
      logger.apiLog('POST', '/api/auth/signin', handled.statusCode, duration);
      
      return NextResponse.json(
        { error: handled.message },
        { status: handled.statusCode }
      );
    }

  } catch (error) {
    const handled = errorHandler.handleError(error as Error, { endpoint: '/api/auth/signin' });
    
    const duration = performanceMonitor.end(timerId, 'signin (parsing failed)');
    logger.apiLog('POST', '/api/auth/signin', handled.statusCode, duration);
    
    return NextResponse.json(
      { error: handled.message },
      { status: handled.statusCode }
    );
  }
}