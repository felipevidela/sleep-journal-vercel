import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, cleanupExpiredSessions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Clean up expired sessions periodically
    try {
      await cleanupExpiredSessions();
    } catch (error) {
      console.warn('Failed to cleanup expired sessions:', error);
    }

    try {
      // Authenticate user
      const user = await authenticateUser(email.toLowerCase(), password);

      if (!user) {
        return NextResponse.json(
          { error: 'Email o contraseña incorrectos' },
          { status: 401 }
        );
      }

      // Create session
      await createSession(user.id);

      // Return success
      return NextResponse.json({
        success: true,
        user
      });

    } catch (error: any) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Error al iniciar sesión. Inténtalo de nuevo.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Request parsing error:', error);
    return NextResponse.json(
      { error: 'Datos de solicitud inválidos' },
      { status: 400 }
    );
  }
}