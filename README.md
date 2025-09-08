
# Sleep Journal (Next.js + Vercel Postgres)

Pequeña app para registrar cómo dormiste cada día: fecha, nota (1–10) y comentarios.
Bonita, minimalista, y lista para desplegar en **Vercel**.

## Stack
- Next.js (App Router, Server Actions)
- Tailwind CSS
- Vercel Postgres (`@vercel/postgres`)

## Variables de entorno
Crea un `.env.local` con:
```
POSTGRES_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE"
```
Si usas la integración de **Vercel Postgres**, Vercel creará estas variables automáticamente.

## Scripts
- `npm run dev` – modo desarrollo
- `npm run build` – compila para producción
- `npm start` – ejecuta producción local

## Despliegue
1) Sube este repo a GitHub o importa el zip en Vercel.
2) Conecta **Vercel Postgres** y añade `POSTGRES_URL` (o usa la integración automática).
3) Deploy.
