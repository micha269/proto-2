# Cooperativa Tulcán — RISK-CORE (CoopTech DevIAthon)

Solución fullstack: **React + Tailwind v4** + **Django REST** + **Supabase** (REST HTTPS).

## Versión 2.0.0

- Logo oficial Cooptulcán en panel y barra lateral
- Análisis predictivo con universo completo (~35k socios) y gráficos (pastel, histogramas)
- Búsqueda de perfil con paginación (50/100 por página, 700+ páginas)
- Ficha resumida de socio y gestión de alertas (modal + persistencia local)
- Asistente IA Groq, API `/api/socio/{id}/`, `/api/dashboard/predictivo/resumen/`
- **Sin credenciales en el repositorio** — configurar `.env` local

## Configuración (obligatoria)

```powershell
copy .env.example .env
# Edite .env con SUPABASE_SECRET_KEY, SUPABASE_ANON_KEY, SUPABASE_DB_PASSWORD, VITE_GROQ_API_KEY, etc.
```

El archivo `.env` está en `.gitignore` y **no debe subirse a Git**.

## Inicio con Docker (recomendado en otras PCs)

Requisitos: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.

```powershell
copy .env.example .env
# Editar .env con credenciales Supabase + VITE_GROQ_API_KEY

.\start-docker.ps1
```

En Linux/macOS:

```bash
chmod +x start-docker.sh
./start-docker.sh
```

| Servicio | URL |
|----------|-----|
| **Panel web** | http://localhost:5173/ |
| **API Django** | http://localhost:8000/ |

Comandos útiles:

```powershell
docker compose logs -f      # ver logs
docker compose down         # detener
docker compose up --build   # reconstruir tras cambios
```

La caché de Supabase se guarda en el volumen Docker `cooptech_cache`.

## Inicio local (sin Docker)

**Backend:**
```powershell
.\start-backend.ps1
```

**Frontend:**
```powershell
.\start-frontend.ps1
```

- Panel: http://localhost:5173/
- API: http://127.0.0.1:8000/api/dashboard/analisis/

## Estructura

```
proto 2/
├── cooptech/           # Django
├── cartera/            # API dashboard, predictivo, socio
├── frontend/           # React SPA + logo en public/
├── start-backend.ps1
└── start-frontend.ps1
```

## Motor predictivo de mora

| Condición | Incremento |
|-----------|------------|
| Base | 12% |
| `dias_mora > 0` | +45% |
| `saldo_ahorro < 5%` del crédito | +35% |
| Tope | 100% |

## Supabase

- Tablas: `Tabla Creditos`, `Ahorros`, `Supabase Transacciones`
- Unión por `token_seguridad` vía API REST
