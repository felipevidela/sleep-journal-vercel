import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { createUser, createSession } from '@/lib/auth';
import { ensureTables } from '@/lib/db';
import { COUNTRIES, GENDERS } from '@/lib/countries';

export async function POST(request: NextRequest) {
  try {
    // Ensure tables exist once at the beginning
    await ensureTables();
    
    const { name, email, password, age, city, country, gender } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !age || !city || !country || !gender) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      );
    }

    // Validate age
    if (age < 13 || age > 99) {
      return NextResponse.json(
        { error: 'La edad debe estar entre 13 y 99 años' },
        { status: 400 }
      );
    }

    // Validate country
    if (!COUNTRIES.includes(country)) {
      return NextResponse.json(
        { error: 'País no válido' },
        { status: 400 }
      );
    }

    // Validate gender
    if (!GENDERS.includes(gender)) {
      return NextResponse.json(
        { error: 'Género no válido' },
        { status: 400 }
      );
    }

    try {
      // Create user
      const user = await createUser({
        name,
        email: email.toLowerCase(),
        password,
        age,
        city,
        country,
        gender
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