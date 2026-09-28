# 🐱 Michi — Soporte TI con siete vidas

**Michi** es una mesa de ayuda (HelpDesk) con panel web para administradores y agentes, portal y app móvil para usuarios, foro de soluciones anónimo y asistente de IA.

```
┌──────────────┐     ┌──────────────┐
│ Web (React)  │     │ Móvil        │
│ admin/agente │     │ (Flutter)    │
└──────┬───────┘     └──────┬───────┘
       │  HTTP + JWT        │
       ▼                    ▼
┌─────────────────────────────────┐      ┌──────────────────────┐      ┌──────────┐
│ backend/  API Node.js (Express) │ ───► │ ai/  Python (FastAPI)│ ───► │ DeepSeek │
└───────────────┬─────────────────┘      └──────────────────────┘      └──────────┘
                ▼
        MySQL (MAMP) · ti_tickets
```

| Carpeta | Tecnología | Función |
|---|---|---|
| `database/` | MySQL 5.7+ | `schema.sql` con todas las tablas |
| `backend/` | Node.js 20.12+, Express 5, mysql2, JWT, bcrypt | API REST — el único componente que toca la base de datos |
| `ai/` | Python 3.10+, FastAPI, SDK `openai` | Servicio de IA con la API de DeepSeek |
| `Web/` | React 19, Vite, Tailwind | Panel para admin/agentes y portal sencillo para usuarios |
| `movil/` | Flutter | App para que los usuarios reporten incidentes |

## Puesta en marcha

### 1. Base de datos (MAMP)

Enciende MAMP (Apache no es necesario, solo **MySQL**). En Windows MAMP usa el puerto **3306**; en macOS suele ser el **8889**. Crea un usuario de MySQL para la app con permisos solo sobre `ti_tickets` (desde phpMyAdmin → Cuentas de usuario) y pon sus datos en `backend/.env`. Cambia también la contraseña por defecto de `root` de MAMP.

```bash
cd backend
npm install
cp .env.example .env      # rellena DB_*, JWT_SECRET, AI_SERVICE_TOKEN y SEED_*_PASSWORD
npm run db:seed           # crea la BD "ti_tickets" y carga datos demo
```

También puedes importar `database/schema.sql` desde phpMyAdmin (`http://localhost/phpMyAdmin`), pero entonces no habrá usuarios: créalos con el seed o regístralos desde la app móvil.

**Usuarios demo** (creados por `npm run db:seed`): `admin1@empresa.com` (admin), `agente1@empresa.com` (agente) y `juan` (usuario). Sus contraseñas se definen en `backend/.env` (`SEED_ADMIN_PASSWORD`, `SEED_AGENT_PASSWORD`, `SEED_USER_PASSWORD`); si están vacías se generan al azar y se muestran en la consola.

#### Migrar los datos existentes de Supabase (opcional)

Rellena `SUPABASE_URL` y `SUPABASE_KEY` (la clave `service_role`) en `backend/.env` y ejecuta:

```bash
npm run db:init                 # solo el esquema, sin datos demo
npm run db:migrate-supabase     # copia todas las tablas conservando los IDs
```

Las contraseñas en texto plano se guardan hasheadas con bcrypt.

### 2. API Node.js

```bash
cd backend
npm run dev        # http://localhost:3000/api  (se reinicia al guardar)
```

### 3. Servicio de IA (Python + DeepSeek)

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # DEEPSEEK_API_KEY y el MISMO AI_SERVICE_TOKEN que backend/.env
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Consigue la clave en <https://platform.deepseek.com/api_keys>. Sin la clave el resto del sistema funciona igual: solo fallan los botones de IA, con un mensaje claro.

### 4. Web

```bash
cd Web
npm install
npm run dev        # http://localhost:5173 — Vite redirige /api al backend
```

### 5. App móvil

```bash
cd movil
cp .env.example .env    # API_URL: 10.0.2.2 en el emulador Android, la IP del PC en un móvil físico
flutter pub get
flutter run
```

## Funciones de IA

| Dónde | Qué hace | Endpoint |
|---|---|---|
| Web → Reportes → *Convertir a ticket* | **Sugerir clasificación con IA**: elige el incidente del catálogo, la prioridad y el agente para un reporte "Otros" | `POST /api/ai/clasificar` |
| Web → detalle de ticket | **Sugerir respuesta con IA**: redacta un borrador de respuesta a partir del ticket y su historial | `POST /api/ai/tickets/:id/sugerir-respuesta` |

El backend lee el contexto de MySQL y se lo envía al servicio Python, que llama a DeepSeek y **valida** la respuesta (por ejemplo, que el incidente sugerido exista en el catálogo). El servicio escucha solo en `127.0.0.1` y exige el token compartido `AI_SERVICE_TOKEN`, así la clave de DeepSeek nunca sale del servidor.

Para añadir funciones nuevas: el prompt va en `ai/app/prompts.py`, el endpoint en `ai/app/main.py` y la ruta que lo expone en `backend/src/routes/ai.js`.

## Foro de soluciones

Base de conocimiento con casos ya resueltos, publicados **de forma anónima**:

- **Usuarios y agentes**: buscan soluciones (sin importar tildes ni guiones), votan si les sirvió y comentan, con la opción de hacerlo como anónimos. Al reportar un problema, el asistente sugiere soluciones del foro de esa categoría.
- **Usuario → propone**: en un ticket resuelto puede pulsar *Proponer para el foro*; el caso llega al admin como propuesta.
- **Admin → publica**: en *Foro* revisa las propuestas; desde un ticket finalizado usa *Publicar en el foro*. El borrador llega ya anonimizado (nombres, correos, teléfonos e IPs se sustituyen) y puede redactarse con IA; el admin lo revisa antes de publicar.
- **Garantía de anonimato**: la API pública nunca devuelve quién tuvo el problema, el ticket de origen ni el autor de un comentario anónimo. A la IA solo se le envía texto ya anonimizado.

Si ya tenías la base de datos creada, ejecuta `npm run db:init` en `backend/` para añadir las tablas del foro (no borra datos).

## Seguridad

- **Secretos solo en `.env`**: `backend/.env` (MySQL, JWT, token interno, contraseñas demo, Supabase) y `ai/.env` (API key de DeepSeek, token interno). El código no tiene valores por defecto: si falta un secreto, el servicio **no arranca** y dice cuál falta. Las plantillas `.env.example` no llevan valores reales.
- **Nada de secretos en el frontend**: las variables `VITE_*` (web) y el `.env` de la app móvil se empaquetan en el cliente y son públicas; solo contienen la URL de la API.
- **GitHub**: `.gitignore` excluye `.env`, llaves y firmas. Además, el hook `.githooks/pre-commit` rechaza cualquier commit con archivos `.env` o con API keys/contraseñas escritas en el código. Tras clonar el repo, actívalo con:
  ```bash
  git config core.hooksPath .githooks
  ```
- **MAMP/Apache**: el proyecto está dentro de `htdocs`, así que `.htaccess` bloquea el acceso web a toda la carpeta (si no, Apache serviría los `.env`). La app no usa Apache.
- **MySQL**: la API usa el usuario `ti_tickets_app`, con permisos solo sobre la base `ti_tickets` (no `root`).
- **API**: contraseñas con bcrypt, JWT HS256 con el rol verificado en la base de datos en cada petición, límite de 20 intentos fallidos de login cada 15 min por IP, cabeceras de seguridad (helmet) y consultas SQL parametrizadas.
- **Servicio de IA**: escucha solo en `127.0.0.1`, exige el token interno en todas las rutas y no expone `/docs` salvo con `AI_ENABLE_DOCS=true`.
- Si un secreto se filtra (por ejemplo, se sube por error), **cámbialo**: borrar el commit no basta.

## API REST (resumen)

Todas las rutas, salvo `/api/auth/login`, `/api/auth/register` y `/api/health`, requieren `Authorization: Bearer <token>`.

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/auth/login` — `{ correo \| usuario, password }` | público |
| POST | `/api/auth/register` | público |
| GET | `/api/tickets` · `/api/tickets/:id` | staff: todos · usuario: los suyos |
| POST | `/api/tickets` | cualquiera |
| PATCH | `/api/tickets/:id` | admin, agente |
| GET/POST | `/api/tickets/:id/conversaciones` | con acceso al ticket |
| GET | `/api/conversaciones/ultimas?tickets=1,2` · `/api/conversaciones/nuevas?after=ID` | cualquiera |
| GET/POST | `/api/otros-incidentes` | staff: todos · usuario: los suyos |
| POST | `/api/otros-incidentes/:id/convertir` | admin, agente |
| GET | `/api/incidentes` · `/api/incidentes/categorias` · `/api/agentes` | cualquiera |
| POST/PATCH | `/api/incidentes` | admin |
| GET · PATCH | `/api/usuarios` | admin y agente (lectura) · admin (edición) |
| GET | `/api/foro?q=&categoria=` · `/api/foro/:id` | cualquiera (solo publicadas) |
| POST | `/api/foro/:id/voto` · `/api/foro/:id/comentarios` · `/api/foro/proponer` | cualquiera |
| GET/POST/PATCH/DELETE | `/api/foro/admin/todas` · `/api/foro` · `/api/foro/borrador/ticket/:id` | admin |

## Esquema de base de datos

Se conservan los nombres de tablas y columnas que tenía Supabase (`database/schema.sql`):

- **Usuarios** — `id, Usuario, Contraseña (bcrypt), Rol (usuario|agente|admin), Correo, Departmento`
- **Agentes** — `id, Nombre, Especialidad`
- **Incidentes** — catálogo: `id, Categoria, Incidente, Tiempo, Prioridad, Agentes (agente por defecto)`
- **Tickets** — `id, Usuario, Departamento, Status, Incidente_ID, Fecha, Descripcion, Prioridad, Agente, comment`
- **Otros_incidentes** — reportes que no encajan en el catálogo, pendientes de convertir en ticket
- **Conversaciones** — `id, incidente_id (→ Tickets.id), mensaje, fecha_publicacion, Usuario_ID`

Las fechas se guardan en UTC.

## Roadmap

- [ ] Vista **Reportes** — gráficas y métricas con datos reales
- [ ] Vista **Configuración** — SLAs, notificaciones
- [ ] Triaje automático con IA al crear un "Otro incidente" desde la app
- [ ] Notificaciones en tiempo real (WebSocket/SSE) en lugar de sondeo
