# Cooperativa Tulcán — RISK-CORE (CoopTech DevIAthon)

Solución fullstack: **React + Tailwind v4** + **Django REST** + **Supabase** (REST HTTPS).

## Versión

- **v1.0.0** — Dashboard de riesgo, 17 agencias, paginación, caché Supabase, scoring heurístico de mora.

## Entrega académica

Este repositorio incluye **`.env`** y **`CREDENCIALES_ACADEMICO.md`** con API keys y acceso a base de datos para que el evaluador pueda ejecutar el proyecto sin configuración adicional.

```powershell
# Opcional si no existe .env (ya viene en el repo académico)
copy .env.example .env
```

## Versión actual

- Dashboard Supabase REST, 17 agencias, asistente IA Groq, endpoint `/api/socio/{id}/`
## Estructura

```
proto 2/
├── cooptech/settings.py      # Django + PostgreSQL Supabase
├── cartera/views.py          # DashboardAnalisisAPI + motor IA mora
├── cartera/urls.py           # /api/dashboard/analisis/
├── frontend/src/Dashboard.jsx
└── requirements.txt
```

## Inicio rápido (recomendado)

**Terminal 1 — Backend:**
```powershell
cd "c:\Users\User\.cursor\proto 2"
.\start-backend.ps1
```

**Abrir en el navegador:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)  
(Dashboard integrado en Django; no requiere Node/npm.)

API: `http://127.0.0.1:8000/api/dashboard/analisis/?search=9082`  
Socio por ID: `http://127.0.0.1:8000/api/socio/{token}/`

## Frontend React (opcional)

Requiere Node.js instalado (`npm` en PATH):

```powershell
cd "c:\Users\User\.cursor\proto 2\frontend"
npm install
npm run dev
```

Abrir: `http://localhost:5173` (proxy Vite → Django `:8000`).

## Si aparece "Connection failed"

1. Confirme que `start-backend.ps1` está corriendo sin errores.
2. Use **http://127.0.0.1:8000/** (no abra el HTML directamente).
3. Si Supabase no responde desde su red, la API entrega **modo demo** con datos de muestra hasta habilitar su IP en Supabase → *Project Settings → Database → Network*.

## Motor predictivo de mora

| Condición | Incremento |
|-----------|------------|
| Base | 12% |
| `dias_mora > 0` | +45% |
| `saldo_ahorro < 5%` del crédito | +35% |
| Tope | 100% |

## Supabase (esquema actualizado)

- **Project ID:** `zfjgepbaokxeavipjxoi`
- **Tabla créditos:** `Tabla Creditos` (`monto_credito`, `dias_mora`, `fecha_corte`, `calificacion`, …)
- **Tabla ahorros:** `Ahorros` (`saldo_disponible`, `fecha_corte_ahorro`)
- **Transacciones:** `Supabase Transacciones`
- Unión relacional por `token_seguridad` vía API REST HTTPS
