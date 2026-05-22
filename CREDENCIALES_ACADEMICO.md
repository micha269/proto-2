# Credenciales — entrega académica CoopTech RISK-CORE

Documento de referencia para evaluación. Las mismas variables están en `.env` en la raíz del proyecto.

## Supabase

| Variable | Valor |
|----------|--------|
| Project ID | `zfjgepbaokxeavipjxoi` |
| URL API | `https://zfjgepbaokxeavipjxoi.supabase.co` |
| Anon key (JWT) | Ver `.env` → `SUPABASE_ANON_KEY` |
| Secret key (service) | Ver `.env` → `SUPABASE_SECRET_KEY` |

## PostgreSQL directo (opcional en settings)

| Campo | Valor |
|-------|--------|
| Host | `db.zfjgepbaokxeavipjxoi.supabase.co` |
| Puerto | `5432` |
| Base | `postgres` |
| Usuario | `postgres` |
| Contraseña | Ver `.env` → `SUPABASE_DB_PASSWORD` |

## Tablas en Supabase

- `Tabla Creditos`
- `Ahorros`
- `Supabase Transacciones`

## Groq (asistente IA)

| Variable | Uso |
|----------|-----|
| `VITE_GROQ_API_KEY` | Chat en frontend (`asistente-ia.js`) |
| Modelo | `llama-3.3-70b-versatile` |

## Django

| Variable | Valor |
|----------|--------|
| `DJANGO_SECRET_KEY` | Ver `.env` |

## Arranque

```powershell
.\start-backend.ps1
.\start-frontend.ps1
```

Frontend: http://localhost:5173/ — Backend: http://127.0.0.1:8000/
