import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { ensureTables } from '@/lib/db';
import { sql } from "@vercel/postgres";

type Row = {
  id: string;
  user_id: string;
  date: string;
  rating: number;
  comments: string | null;
  start_time: string | null;
  end_time: string | null;
  sleep_duration_hours: number | null;
  sleep_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  console.log("API: getData called");
  
  try {
    const user = await getSessionUser();
    console.log("API: User from session:", user ? "found" : "not found");
    
    if (!user) {
      console.log("API: No user, returning empty data");
      return NextResponse.json({ entries: [], avg7: null, avg30: null, user: null });
    }
    
    const userId = user.id;
    console.log("API: Fetching data for user:", userId);
    
    try {
      console.log("API: Ensuring tables...");
      await ensureTables();
      console.log("API: Tables ensured");
      
      console.log("API: Fetching sleep logs...");
      const list = await sql<Row>`
        SELECT id::text, user_id::text, date::text, rating, comments, 
               start_time::text, end_time::text, 
               sleep_duration_hours, sleep_duration_minutes,
               created_at::text, updated_at::text
        FROM sleep_logs
        WHERE user_id = ${userId}
        ORDER BY date DESC
      `;
      console.log("API: Sleep logs fetched:", list.rows.length, "entries");

      console.log("API: Fetching avg7...");
      const avg7 = await sql<{ avg: number | null }>`
        SELECT AVG(rating)::float AS avg
        FROM sleep_logs
        WHERE user_id = ${userId} AND date >= CURRENT_DATE - INTERVAL '6 days'
      `;
      console.log("API: avg7 calculated");

      console.log("API: Fetching avg30...");
      const avg30 = await sql<{ avg: number | null }>`
        SELECT AVG(rating)::float AS avg
        FROM sleep_logs
        WHERE user_id = ${userId} AND date >= CURRENT_DATE - INTERVAL '29 days'
      `;
      console.log("API: avg30 calculated");

      console.log("API: Data fetched successfully for user:", userId);
      const result = {
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
      console.log("API: Returning result:", JSON.stringify(result, null, 2));
      return NextResponse.json(result);
    } catch (dbError) {
      console.error("API: Database error:", dbError);
      return NextResponse.json({ error: "Could not fetch data from the database." }, { status: 500 });
    }
  } catch (error) {
    console.error("API: Error in getData:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}