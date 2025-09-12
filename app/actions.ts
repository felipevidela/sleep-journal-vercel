'use server';

import { sql } from "@vercel/postgres";
import { ensureTables } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { validateSleepEntry, Sanitizer } from "@/lib/validation";
import { calculateSleepDuration } from "@/lib/utils";

type Row = {
  id: string;
  user_id: string;
  date: string;      // YYYY-MM-DD
  rating: number;
  comments: string | null;
  start_time: string | null; // HH:MM format (bedtime)
  end_time: string | null;   // HH:MM format (wake up time)
  sleep_duration_hours: number | null; // Duration in hours (decimal)
  sleep_duration_minutes: number | null; // Duration in total minutes
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
  
  // Extract and sanitize raw input
  const rawData = {
    date: String(formData.get("date") || "").trim(),
    rating: String(formData.get("rating") || "").trim(),
    comments: String(formData.get("comments") || "").trim(),
    start_time: String(formData.get("start_time") || "").trim() || null,
    end_time: String(formData.get("end_time") || "").trim() || null
  };

  // Validate and sanitize core sleep entry data
  const sleepValidation = validateSleepEntry({
    date: rawData.date,
    rating: parseInt(rawData.rating) || 0,
    comments: rawData.comments
  });

  if (!sleepValidation.valid) {
    const errors = Object.values(sleepValidation.errors).filter(Boolean).join(', ');
    throw new Error(`Datos inválidos: ${errors}`);
  }

  const { date, rating, comments } = sleepValidation.sanitized!;

  // Sanitize and validate time inputs separately
  const startTime = rawData.start_time ? Sanitizer.sanitizeText(rawData.start_time, 5) : null;
  const endTime = rawData.end_time ? Sanitizer.sanitizeText(rawData.end_time, 5) : null;

  // Validate time format (HH:MM) - allows 00:00 to 23:59
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (startTime && !timeRegex.test(startTime)) {
    throw new Error("Formato de hora de inicio inválido (use HH:MM)");
  }
  if (endTime && !timeRegex.test(endTime)) {
    throw new Error("Formato de hora de fin inválido (use HH:MM)");
  }

  // Calculate sleep duration if both times are provided
  let sleepDurationHours: number | null = null;
  let sleepDurationMinutes: number | null = null;
  
  if (startTime && endTime) {
    const duration = calculateSleepDuration(startTime, endTime);
    if (duration) {
      sleepDurationHours = duration.hours;
      sleepDurationMinutes = duration.totalMinutes;
    }
  }

  try {
    await ensureTables();
    
    // Upsert: try to insert, on conflict update
    await sql`
      INSERT INTO sleep_logs (user_id, date, rating, comments, start_time, end_time, sleep_duration_hours, sleep_duration_minutes)
      VALUES (${userId}, ${date}, ${rating}, ${comments || null}, ${startTime}, ${endTime}, ${sleepDurationHours}, ${sleepDurationMinutes})
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        comments = EXCLUDED.comments,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        sleep_duration_hours = EXCLUDED.sleep_duration_hours,
        sleep_duration_minutes = EXCLUDED.sleep_duration_minutes,
        updated_at = NOW()
    `;

    console.log(`Entry upserted for user ${userId}: ${date} -> ${rating}/10 (${startTime || 'no start'} - ${endTime || 'no end'})`);
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
  
  // Sanitize and validate ID
  const rawId = String(formData.get("id") || "").trim();
  if (!rawId) throw new Error("ID es obligatorio");
  
  // Ensure ID is a valid number to prevent injection
  const id = Sanitizer.sanitizeNumber(rawId);
  if (!id || id <= 0) {
    throw new Error("ID inválido");
  }
  const idString = id.toString();

  try {
    await ensureTables();
    
    // Use parameterized query with validated input
    await sql`DELETE FROM sleep_logs WHERE id = ${idString} AND user_id = ${userId}`;
    console.log(`Entry deleted for user ${userId}: ${idString}`);
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
  console.log("getData called");
  
  try {
    const user = await getSessionUser();
    console.log("User from session:", user ? "found" : "not found");
    
    if (!user) {
      console.log("No user, returning empty data");
      return { entries: [], avg7: null, avg30: null, user: null };
    }
    
    const userId = user.id;
    console.log("Fetching data for user:", userId);
    
    try {
      console.log("Ensuring tables...");
      await ensureTables();
      console.log("Tables ensured");
      
      console.log("Fetching sleep logs...");
      const list = await sql<Row>`
        SELECT id::text, user_id::text, date::text, rating, comments, 
               start_time::text, end_time::text, 
               sleep_duration_hours, sleep_duration_minutes,
               created_at::text, updated_at::text
        FROM sleep_logs
        WHERE user_id = ${userId}
        ORDER BY date DESC
      `;
      console.log("Sleep logs fetched:", list.rows.length, "entries");

      console.log("Fetching avg7...");
      const avg7 = await sql<{ avg: number | null }>`
        SELECT AVG(rating)::float AS avg
        FROM sleep_logs
        WHERE user_id = ${userId} AND date >= CURRENT_DATE - INTERVAL '6 days'
      `;
      console.log("avg7 calculated");

      console.log("Fetching avg30...");
      const avg30 = await sql<{ avg: number | null }>`
        SELECT AVG(rating)::float AS avg
        FROM sleep_logs
        WHERE user_id = ${userId} AND date >= CURRENT_DATE - INTERVAL '29 days'
      `;
      console.log("avg30 calculated");

      console.log("Data fetched successfully for user:", userId);
      const result = {
        entries: list.rows.map(entry => ({
          ...entry,
          date: entry.date && typeof entry.date === 'object' && 'toISOString' in entry.date
            ? (entry.date as Date).toISOString().split('T')[0] || ''
            : String(entry.date || ''),
          created_at: entry.created_at && typeof entry.created_at === 'object' && 'toISOString' in entry.created_at
            ? (entry.created_at as Date).toISOString() 
            : String(entry.created_at || ''),
          updated_at: entry.updated_at && typeof entry.updated_at === 'object' && 'toISOString' in entry.updated_at
            ? (entry.updated_at as Date).toISOString() 
            : String(entry.updated_at || ''),
        })),
        avg7: avg7.rows[0]?.avg ?? null,
        avg30: avg30.rows[0]?.avg ?? null,
        user: user,
      };
      console.log("Returning result:", JSON.stringify(result, null, 2));
      return result;
    } catch (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Could not fetch data from the database.");
    }
  } catch (error) {
    console.error("Error in getData:", error);
    throw error;
  }
}