
import { sql } from "@vercel/postgres";
import { ensureTable } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic"; // evita caches en Vercel
export const runtime = "nodejs"; // @vercel/postgres no es edge-friendly

type Row = {
  id: string;
  date: string;      // YYYY-MM-DD
  rating: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
};

function formatDatePretty(isoDate: string) {
  try {
    const d = new Date(isoDate + "T00:00:00");
    return d.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch {
    return isoDate;
  }
}

// Server Action: Upsert (insertar o actualizar por fecha)
async function upsertEntry(formData: FormData) {
  "use server";
  const date = String(formData.get("date") || "").trim();
  const ratingRaw = String(formData.get("rating") || "").trim();
  const comments = String(formData.get("comments") || "").trim();

  if (!date) throw new Error("La fecha es obligatoria");

  let rating = parseInt(ratingRaw, 10);
  if (Number.isNaN(rating)) rating = 5;
  if (rating < 1) rating = 1;
  if (rating > 10) rating = 10;

  await ensureTable();

  await sql`
    INSERT INTO sleep_logs (date, rating, comments)
    VALUES (${date}, ${rating}, NULLIF(${comments}, ''))
    ON CONFLICT (date) DO UPDATE SET
      rating = EXCLUDED.rating,
      comments = EXCLUDED.comments,
      updated_at = NOW();
  `;

  revalidatePath("/");
}

// Server Action: Delete by id
async function deleteEntry(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  await ensureTable();
  await sql`DELETE FROM sleep_logs WHERE id = ${id}`;
  revalidatePath("/");
}

async function getData() {
  console.log("Fetching data...");
  try {
    await ensureTable();
    const list = await sql<Row>`SELECT id, date, rating, comments, created_at, updated_at
                               FROM sleep_logs
                               ORDER BY date DESC`;

    const avg7 = await sql<{ avg: number | null }>`
      SELECT AVG(rating)::float AS avg
      FROM sleep_logs
      WHERE date >= CURRENT_DATE - INTERVAL '6 days';
    `;

    const avg30 = await sql<{ avg: number | null }>`
      SELECT AVG(rating)::float AS avg
      FROM sleep_logs
      WHERE date >= CURRENT_DATE - INTERVAL '29 days';
    `;

    console.log("Data fetched successfully.");
    return {
      entries: list.rows,
      avg7: avg7.rows[0]?.avg,
      avg30: avg30.rows[0]?.avg,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Could not fetch data from the database.");
  }
}

export default async function Page() {
  const { entries, avg7, avg30 } = await getData();
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 p-[1px] shadow-lg">
          <div className="rounded-2xl bg-white p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              💤 Sleep Journal
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Registra una vez por día cómo dormiste: fecha, nota (1–10) y comentarios.
              Puedes actualizar el mismo día: se sobreescribe.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
                <div className="text-xs text-neutral-500">Promedio últimos 7 días</div>
                <div className="text-2xl font-semibold">{avg7 ? avg7.toFixed(2) : "—"}</div>
              </div>
              <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
                <div className="text-xs text-neutral-500">Promedio últimos 30 días</div>
                <div className="text-2xl font-semibold">{avg30 ? avg30.toFixed(2) : "—"}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Agregar / Actualizar registro</h2>
          <form action={upsertEntry} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-neutral-700">Fecha</span>
                <input
                  type="date"
                  name="date"
                  defaultValue={todayISO}
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-indigo-500"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm text-neutral-700">Nota (1–10)</span>
                <input
                  type="number"
                  name="rating"
                  min={1}
                  max={10}
                  defaultValue={7}
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-indigo-500"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm text-neutral-700">Comentarios</span>
              <textarea
                name="comments"
                rows={3}
                placeholder="Ej: Me desperté 1 vez, sin alarma, descansado..."
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition placeholder:text-neutral-400 focus:border-indigo-500"
              />
            </label>

            <button
              type="submit"
              className="group relative inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition hover:from-indigo-100 hover:to-emerald-100"
            >
              <span className="absolute inset-0 -z-10 animate-shimmer bg-[length:200%_200%] bg-gradient-to-r from-indigo-200 via-sky-200 to-emerald-200 opacity-0 transition group-hover:opacity-50 rounded-xl" />
              Guardar
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Historial</h2>

        {entries.length === 0 && (
          <p className="text-sm text-neutral-600">Aún no hay registros. ¡Comienza arriba!</p>
        )}

        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{formatDatePretty(e.date)}</div>
                  <div className="mt-1 inline-flex items-center gap-2">
                    <span className="text-xs text-neutral-500">Nota:</span>
                    <span className="text-sm font-semibold">{e.rating}</span>
                    <div
                      aria-hidden
                      className="ml-2 h-2 w-24 rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-500"
                      style={{ opacity: Math.max(0.35, e.rating / 10) }}
                    />
                  </div>
                  {e.comments && (
                    <p className="mt-2 text-sm text-neutral-700 whitespace-pre-wrap">{e.comments}</p>
                  )}
                </div>

                <form action={deleteEntry}>
                  <input type="hidden" name="id" value={e.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm transition hover:bg-neutral-50"
                    title="Eliminar"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-10 text-center text-xs text-neutral-500">
        Hecho con Next.js · Vercel Postgres · Tailwind
      </footer>
    </main>
  );
}
