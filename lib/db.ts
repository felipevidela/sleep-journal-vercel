
import { sql } from "@vercel/postgres";

export type SleepLog = {
  id: string;
  date: string;      // ISO date (YYYY-MM-DD)
  rating: number;    // 1..10
  comments: string | null;
  created_at: string;
  updated_at: string;
};

export async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS sleep_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL UNIQUE,
      rating INT NOT NULL CHECK (rating >= 1 AND rating <= 10),
      comments TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}
