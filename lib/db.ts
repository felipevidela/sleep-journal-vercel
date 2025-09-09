
import { sql } from "@vercel/postgres";

export type SleepLog = {
  id: string;
  user_id: string;
  date: string;      // ISO date (YYYY-MM-DD)
  rating: number;    // 1..10
  comments: string | null;
  created_at: string;
  updated_at: string;
};

export async function ensureTables() {
  // Create users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      image TEXT,
      provider VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Create sleep_logs table with user relationship
  await sql`
    CREATE TABLE IF NOT EXISTS sleep_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      rating INT NOT NULL CHECK (rating >= 1 AND rating <= 10),
      comments TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, date)
    );
  `;

  // Create index for better performance
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date DESC);
  `;
}

// Backward compatibility
export const ensureTable = ensureTables;
