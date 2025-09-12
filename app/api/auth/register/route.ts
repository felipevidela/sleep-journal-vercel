import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { createUser, createSession } from '@/lib/auth';
import { ensureTables } from '@/lib/db';
import { COUNTRIES, GENDERS } from '@/lib/countries';
import { validateUserRegistration } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Ensure tables exist once at the beginning
    await ensureTables();
    
    const requestBody = await request.json();
    const { name, email, password, age, city, country, gender } = requestBody;

    // Use comprehensive validation and sanitization
    const validation = validateUserRegistration({
      name,
      email,
      password,
      confirmPassword: password, // For registration, we'll use the same password
      age,
      city,
      country,
      gender
    });

    if (!validation.valid) {
      const errors = Object.values(validation.errors).filter(Boolean).join(', ');
      return NextResponse.json(
        { error: `Datos inválidos: ${errors}` },
        { status: 400 }
      );
    }

    const sanitizedData = validation.sanitized!;

    // Additional validation for country and gender against allowed lists
    if (!COUNTRIES.includes(sanitizedData.country as any)) {
      return NextResponse.json(
        { error: 'País no válido' },
        { status: 400 }
      );
    }

    if (!GENDERS.includes(sanitizedData.gender as any)) {
      return NextResponse.json(
        { error: 'Género no válido' },
        { status: 400 }
      );
    }

    try {
      // Create user with sanitized data
      const user = await createUser({
        name: sanitizedData.name,
        email: sanitizedData.email,
        password: sanitizedData.password,
        age: parseInt(sanitizedData.age),
        city: sanitizedData.city,
        country: sanitizedData.country,
        gender: sanitizedData.gender
      });


      // Create session
      await createSession(user.id);

      // Return success (without password)
      const { ...userWithoutPassword } = user;
      return NextResponse.json({
        success: true,
        user: userWithoutPassword
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message.includes('email ya está registrado')) {
        return NextResponse.json(
          { error: 'Este email ya está registrado' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Error al crear la cuenta. Inténtalo de nuevo.' },
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