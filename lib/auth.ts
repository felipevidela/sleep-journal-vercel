import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { User, UserSession, ensureTables } from "./db";

// Session management
const SESSION_COOKIE_NAME = "sleep_journal_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateSessionToken(): string {
  return Math.random().toString(36) + Math.random().toString(36);
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  age: number;
  city: string;
  country: string;
  gender: string;
}): Promise<User> {
  const hashedPassword = await hashPassword(userData.password);
  
  try {
    const result = await sql<User>`
      INSERT INTO users (name, email, password_hash, age, city, country, gender)
      VALUES (${userData.name}, ${userData.email}, ${hashedPassword}, ${userData.age}, ${userData.city}, ${userData.country}, ${userData.gender})
      RETURNING id::text, name, email, age, city, country, gender, created_at::text, updated_at::text
    `;
    
    if (result.rows.length === 0) {
      throw new Error("Failed to create user");
    }
    
    return result.rows[0];
  } catch (error: any) {
    if (error.constraint === 'users_email_key') {
      throw new Error("El email ya está registrado");
    }
    console.error("Error creating user:", error);
    throw new Error("Error al crear el usuario");
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  await ensureTables();
  
  try {
    const result = await sql<User & { password_hash: string }>`
      SELECT id::text, name, email, age, city, country, gender, password_hash, created_at::text, updated_at::text
      FROM users
      WHERE email = ${email}
    `;
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    const isValidPassword = await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return null;
    }
    
    // Remove password_hash from returned user
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Error authenticating user:", error);
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const userIdNumber = parseInt(userId, 10);
  
  // Validate the parsed user ID
  if (isNaN(userIdNumber)) {
    throw new Error(`Invalid user ID: ${userId}`);
  }
  
  try {
    // First check if the user actually exists
    const userCheck = await sql`SELECT id FROM users WHERE id = ${userIdNumber}`;
    if (userCheck.rows.length === 0) {
      throw new Error(`User with ID ${userIdNumber} not found in database`);
    }
    
    await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${userIdNumber}, ${sessionToken}, ${expiresAt.toISOString()})
    `;
    
    // Set session cookie
    cookies().set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/'
    });
    
    return sessionToken;
  } catch (error) {
    console.error("Error creating session:", error);
    throw new Error("Error al crear la sesión");
  }
}

export async function getSessionUser(): Promise<User | null> {
  await ensureTables();
  
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionToken) {
    return null;
  }
  
  try {
    const result = await sql<User & { expires_at: string }>`
      SELECT u.id::text, u.name, u.email, u.age, u.city, u.country, u.gender, u.created_at::text, u.updated_at::text, s.expires_at::text
      FROM users u
      INNER JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
      AND s.expires_at > NOW()
    `;
    
    if (result.rows.length === 0) {
      // Session expired or invalid, clear cookie
      clearSession();
      return null;
    }
    
    const { expires_at, ...user } = result.rows[0];
    return user;
  } catch (error) {
    console.error("Error getting session user:", error);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (sessionToken) {
    try {
      // Delete session from database
      await sql`
        DELETE FROM user_sessions 
        WHERE session_token = ${sessionToken}
      `;
    } catch (error) {
      console.error("Error clearing session from database:", error);
    }
  }
  
  // Clear session cookie
  cookies().set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
}

export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await sql`
      DELETE FROM user_sessions 
      WHERE expires_at < NOW()
    `;
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error);
  }
}