'use server';

import { sql } from "@vercel/postgres";
import { ensureTables } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

type Row = {
  id: string;
  user_id: string;
  date: string;      // YYYY-MM-DD
  rating: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
};

async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/auth/signin');
  }
  return user;
}

// Server Action: Upsert (insertar o actualizar por fecha)
export async function upsertEntry(formData: FormData) {
  const user = await requireAuth();
  const userId = user.id;
  
  const date = String(formData.get("date") || "").trim();
  const ratingRaw = String(formData.get("rating") || "").trim();
  const comments = String(formData.get("comments") || "").trim();

  if (!date) throw new Error("La fecha es obligatoria");

  // Validate future dates
  const inputDate = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (inputDate > today) {
    throw new Error("No puedes registrar fechas futuras");
  }

  let rating = parseInt(ratingRaw, 10);
  if (Number.isNaN(rating)) rating = 5;
  if (rating < 1) rating = 1;
  if (rating > 10) rating = 10;

  try {
    await ensureTables();
    
    // Upsert: try to insert, on conflict update
    await sql`
      INSERT INTO sleep_logs (user_id, date, rating, comments)
      VALUES (${userId}, ${date}, ${rating}, ${comments || null})
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        comments = EXCLUDED.comments,
        updated_at = NOW()
    `;

    console.log(`Entry upserted for user ${userId}: ${date} -> ${rating}/10`);
  } catch (error) {
    console.error("Error upserting entry:", error);
    throw new Error("Could not save entry to database.");
  }

  revalidatePath("/");
}

// Server Action: Delete entry
export async function deleteEntry(formData: FormData) {
  const user = await requireAuth();
  const userId = user.id;
  
  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("ID es obligatorio");

  try {
    await ensureTables();
    await sql`DELETE FROM sleep_logs WHERE id = ${id} AND user_id = ${userId}`;
    console.log(`Entry deleted for user ${userId}: ${id}`);
  } catch (error) {
    console.error("Error deleting entry:", error);
    throw new Error("Could not delete entry from database.");
  }

  revalidatePath("/");
}

export async function getCurrentUser() {
  const user = await getSessionUser();
  return user;
}

export async function getData() {
  const user = await getSessionUser();
  if (!user) {
    return { entries: [], avg7: null, avg30: null, user: null };
  }
  const userId = user.id;
  
  console.log("Fetching data for user:", userId);
  try {
    await ensureTables();
    
    const list = await sql<Row>`
      SELECT id::text, user_id::text, date::text, rating, comments, created_at::text, updated_at::text
      FROM sleep_logs
      WHERE user_id = ${userId}
      ORDER BY date DESC
    `;

    const avg7 = await sql<{ avg: number | null }>`
      SELECT AVG(rating)::float AS avg
      FROM sleep_logs
      WHERE user_id = ${userId} AND date >= CURRENT_DATE - INTERVAL '6 days'
    `;

    const avg30 = await sql<{ avg: number | null }>`
      SELECT AVG(rating)::float AS avg
      FROM sleep_logs
      WHERE user_id = ${userId} AND date >= CURRENT_DATE - INTERVAL '29 days'
    `;

    console.log("Data fetched successfully for user:", userId);
    return {
      entries: list.rows.map(entry => ({
        ...entry,
        date: entry.date && typeof entry.date === 'object' && 'toISOString' in entry.date
          ? (entry.date as Date).toISOString().split('T')[0] 
          : String(entry.date || ''),
        created_at: entry.created_at && typeof entry.created_at === 'object' && 'toISOString' in entry.created_at
          ? (entry.created_at as Date).toISOString() 
          : String(entry.created_at || ''),
        updated_at: entry.updated_at && typeof entry.updated_at === 'object' && 'toISOString' in entry.updated_at
          ? (entry.updated_at as Date).toISOString() 
          : String(entry.updated_at || ''),
      })),
      avg7: avg7.rows[0]?.avg,
      avg30: avg30.rows[0]?.avg,
      user: user,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Could not fetch data from the database.");
  }
}