import { sql } from "@vercel/postgres";

export type User = {
  id: string;
  name: string;
  email: string;
  age: number;
  city: string;
  country: string;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  created_at: string;
  updated_at: string;
};

export type SleepLog = {
  id: string;
  user_id: string;
  date: string;      // ISO date (YYYY-MM-DD)
  rating: number;    // 1..10
  comments: string | null;
  start_time: string | null; // HH:MM format (bedtime)
  end_time: string | null;   // HH:MM format (wake up time)
  sleep_duration_hours: number | null; // Duration in hours (decimal)
  sleep_duration_minutes: number | null; // Duration in total minutes
  created_at: string;
  updated_at: string;
};

export type UserSession = {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
};

export async function ensureTables() {
  try {
    console.log("Ensuring tables exist...");

    // Create users table with profile information
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        age INTEGER NOT NULL CHECK (age >= 13 AND age <= 99),
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        gender VARCHAR(20) NOT NULL CHECK (gender IN ('Masculino', 'Femenino', 'Otro')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create user sessions table for simple session management
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create sleep_logs table (updated to reference users.id)
    await sql`
      CREATE TABLE IF NOT EXISTS sleep_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
        comments TEXT,
        start_time TIME,
        end_time TIME,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, date)
      )
    `;

    // Add columns if they don't exist (for existing databases)
    await sql`
      ALTER TABLE sleep_logs 
      ADD COLUMN IF NOT EXISTS start_time TIME,
      ADD COLUMN IF NOT EXISTS end_time TIME,
      ADD COLUMN IF NOT EXISTS sleep_duration_hours DECIMAL(4,2),
      ADD COLUMN IF NOT EXISTS sleep_duration_minutes INTEGER
    `;

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)
    `;

    console.log("All tables created successfully");
  } catch (error) {
    console.error("Error ensuring tables:", error);
    throw error;
  }
}

// Backward compatibility
export const ensureTable = ensureTables;