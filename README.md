<div align="center">

<img src="Web/public/favicon.svg" width="96" alt="Logo de Michi" />

# Michi — Soporte TI con siete vidas

**Mesa de ayuda (HelpDesk) para el soporte técnico de una empresa:** los empleados reportan problemas, el equipo de TI los resuelve y los casos resueltos se convierten en un foro de soluciones anónimo. Con asistente de IA (DeepSeek) y una mascota con personalidad propia.

![Node.js](https://img.shields.io/badge/Node.js-20.12+-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-5.7+_(MAMP)-4479A1?logo=mysql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Flutter](https://img.shields.io/badge/Flutter-app_móvil-02569B?logo=flutter&logoColor=white)
![DeepSeek](https://img.shields.io/badge/IA-DeepSeek-4D6BFE)

<img src="docs/screenshots/09-admin-tickets.png" alt="Panel de tickets del administrador" width="100%" />

</div>

---

## Índice

1. [¿Qué es Michi?](#qué-es-michi)
2. [Recorrido por la aplicación](#recorrido-por-la-aplicación)
   - [Acceso](#acceso)
   - [Portal del usuario](#portal-del-usuario)
   - [Foro de soluciones](#foro-de-soluciones)
   - [Panel de administración](#panel-de-administración)
   - [Panel del agente](#panel-del-agente)
   - [Modo oscuro y diseño adaptable](#modo-oscuro-y-diseño-adaptable)
   - [Michi, la mascota](#michi-la-mascota)
3. [Arquitectura](#arquitectura)
4. [Tecnologías](#tecnologías)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Instalación paso a paso](#instalación-paso-a-paso)
7. [Configuración (`.env`)](#configuración-env)
8. [Roles y permisos](#roles-y-permisos)
9. [Inteligencia artificial](#inteligencia-artificial)
10. [Foro y anonimato](#foro-y-anonimato)
11. [Seguridad](#seguridad)
12. [API REST](#api-rest)
13. [Base de datos](#base-de-datos)
14. [Scripts disponibles](#scripts-disponibles)
15. [Solución de problemas](#solución-de-problemas)
16. [Hoja de ruta](#hoja-de-ruta)

---

## ¿Qué es Michi?

Michi centraliza el soporte técnico de una empresa en un solo lugar. Hay tres tipos de personas que lo usan, y cada una ve una aplicación distinta, adaptada a lo que necesita:

| Quién | Qué hace en Michi | Dónde |
|---|---|---|
| **Usuario** (cualquier empleado) | Reporta problemas en 3 pasos, sigue sus tickets en formato chat, busca soluciones en el foro | Portal web sencillo y app móvil |
| **Agente** (técnico de TI) | Atiende los tickets que tiene asignados: responde, cambia el estado | Panel de trabajo |
| **Administrador** | Todo lo anterior, más: asignar agentes y prioridades, gestionar usuarios, el catálogo de incidentes, los reportes y el foro | Panel completo |

**Funciones principales**

- 🎫 **Tickets con conversación**: cada ticket es un hilo de mensajes entre el usuario y el soporte, con historial de cambios.
- 🧭 **Reporte guiado**: el usuario elige categoría y tipo de problema; el ticket llega directamente al agente y con la prioridad correctos.
- 📚 **Foro de soluciones anónimo**: los casos resueltos se publican sin datos personales para que otros los resuelvan solos.
- 🤖 **IA con DeepSeek**: clasifica reportes, redacta respuestas y convierte tickets en publicaciones del foro.
- 🔒 **Seguridad**: contraseñas cifradas, sesiones con JWT, límite de intentos y secretos solo en `.env`.
- 🐱 **Michi**: una mascota que saluda, reacciona y cambia de ánimo según el trabajo pendiente.
- 🌗 **Modo oscuro** y diseño **adaptable** a cualquier tamaño de pantalla.

---

## Recorrido por la aplicación

> Todas las capturas son de la aplicación real, con datos de demostración.

### Acceso

Una sola pantalla de acceso para todos. Según el rol de la cuenta, Michi abre el portal sencillo (usuarios) o el panel de trabajo (agentes y administradores). Se puede entrar con el **correo o el nombre de usuario**, y cualquier empleado puede **crearse una cuenta** con su correo de la empresa.

Michi se asoma por encima de la tarjeta; si le haces clic, maúlla. 🐾

<img src="docs/screenshots/01-login.png" alt="Pantalla de acceso" width="100%" />

### Portal del usuario

Pensado para personas que no son técnicas: pocas opciones, lenguaje claro y siempre a la vista en qué estado está su problema.

**Inicio.** Saludo según la hora del día, un resumen de sus tickets y un *consejo de Michi* (al pulsarlo cambia). Si no tiene tickets abiertos, Michi se echa la siesta.

<img src="docs/screenshots/02-portal-inicio.png" alt="Inicio del portal del usuario" width="100%" />

**Reportar un problema en 3 pasos.**

| 1. Categoría | 2–3. Tipo de problema y descripción |
|---|---|
| <img src="docs/screenshots/03-reportar-categoria.png" alt="Paso 1: elegir categoría" /> | <img src="docs/screenshots/04-reportar-detalles.png" alt="Paso 3: describir el problema" /> |
| Cada categoría explica qué incluye, con ejemplos reales del catálogo. Si no encaja en ninguna, la opción **Otro** lo envía al equipo para que lo clasifique. | Antes de enviar, Michi sugiere **soluciones del foro** de esa categoría: muchas veces el usuario lo resuelve sin esperar. |

Al enviarlo, el ticket se crea con el **agente y la prioridad** definidos en el catálogo para ese tipo de problema.

<img src="docs/screenshots/05-reporte-enviado.png" alt="Reporte enviado" width="100%" />

**Seguimiento en formato chat.** Barra de progreso (*Recibido → En proceso → Resuelto*), quién lo atiende, el tiempo estimado y la conversación con el soporte. Cuando el ticket se resuelve, el usuario puede **proponerlo para el foro**.

<img src="docs/screenshots/06-ticket-chat.png" alt="Detalle de un ticket en formato chat" width="100%" />

**En el móvil.** El portal está diseñado para verse bien en pantallas pequeñas (además existe la app nativa en Flutter, en `movil/`).

<p align="center"><img src="docs/screenshots/19-movil-portal.png" alt="Portal en el móvil" width="320" /></p>

### Foro de soluciones

Una base de conocimiento con problemas reales ya resueltos, **todos publicados de forma anónima**. Se puede buscar (sin importar tildes ni guiones: *wifi* encuentra *Wi-Fi*), filtrar por categoría y ordenar por las más útiles.

<img src="docs/screenshots/07-foro.png" alt="Foro de soluciones" width="100%" />

Cada caso muestra **el problema** y **la solución** paso a paso. Se puede votar si sirvió y comentar, por defecto **como anónimo**.

<img src="docs/screenshots/08-foro-publicacion.png" alt="Publicación del foro" width="100%" />

### Panel de administración

**Tickets en tres columnas** (inspirado en los helpdesk profesionales): la lista a la izquierda, la conversación en el centro y las propiedades a la derecha. Cambiar estado, agente o prioridad se guarda al instante y queda registrado en el historial. El botón **Sugerir con IA** redacta un borrador de respuesta.

<img src="docs/screenshots/09-admin-tickets.png" alt="Panel de tickets" width="100%" />

El estado se cambia desde el botón azul, con una descripción de cada opción:

<img src="docs/screenshots/10-admin-cambiar-estado.png" alt="Menú para cambiar el estado" width="100%" />

**Dashboard.** Indicadores, tickets recientes y distribución por estado. El ánimo de Michi depende de la carga: preocupado si hay urgentes, trabajando si hay pendientes, celebrando si está todo resuelto. El menú lateral se puede expandir o contraer.

<img src="docs/screenshots/11-admin-dashboard.png" alt="Dashboard del administrador" width="100%" />

**Reportes.** Gráficas por tipo de incidente y por prioridad, y la bandeja de reportes **"Otros"** (los que no encajaban en el catálogo) para convertirlos en tickets, con ayuda de la IA para clasificarlos.

<img src="docs/screenshots/14-admin-reportes.png" alt="Reportes" width="100%" />

| Usuarios y roles | Agentes |
|---|---|
| <img src="docs/screenshots/15-admin-usuarios.png" alt="Gestión de usuarios" /> | <img src="docs/screenshots/13b-admin-agentes.png" alt="Carga de trabajo de los agentes" /> |
| Cambiar el rol de cada persona (usuario, agente, admin), su correo o su contraseña. | Carga de trabajo de cada agente por estado. |

**Configuración: catálogo de incidentes.** Categorías y tipos de problema, cada uno con su tiempo estimado, prioridad y agente por defecto. Este catálogo es el que ve el usuario al reportar.

<img src="docs/screenshots/16-admin-configuracion.png" alt="Catálogo de incidentes" width="100%" />

**Gestión del foro.** Las propuestas de los usuarios llegan a **Por revisar**. El admin las revisa y publica, oculta o elimina. El editor muestra el texto **ya anonimizado** (nombres, correos y teléfonos sustituidos) y avisa si queda algo por reescribir. También puede **redactarlo con IA**.

| Bandeja del foro | Editor con anonimización |
|---|---|
| <img src="docs/screenshots/12-admin-foro.png" alt="Gestión del foro" /> | <img src="docs/screenshots/13-admin-foro-editor.png" alt="Editor de publicación anonimizada" /> |

### Panel del agente

El agente ve solo **sus tickets asignados**, con el mismo espacio de trabajo que el admin (sin poder reasignar ni cambiar la prioridad) y acceso al foro.

<img src="docs/screenshots/20-agente-dashboard.png" alt="Dashboard del agente" width="100%" />

### Modo oscuro y diseño adaptable

Toda la aplicación tiene **modo oscuro** (se recuerda la preferencia). El espacio de tickets se adapta al ancho disponible: en pantallas medianas las propiedades se abren como un panel lateral con **Detalles**, y en pantallas estrechas se muestra la lista *o* el ticket.

| Modo oscuro | Ventana estrecha con panel de detalles |
|---|---|
| <img src="docs/screenshots/17-modo-oscuro.png" alt="Modo oscuro" /> | <img src="docs/screenshots/18-responsive-detalles.png" alt="Diseño adaptable" /> |

### Michi, la mascota

Michi es un gato naranja dibujado en SVG propio (sin imágenes externas), con animaciones suaves que se desactivan si el sistema tiene activado *reducir movimiento*. Aparece en cada situación con una pose distinta, y tiene su propia voz: *"Persiguiendo el cable…"* mientras carga, *"¡Gatástrofe!"* en los errores, *"¡Miau-ravilloso!"* al enviar un reporte.

<img src="docs/screenshots/21-michi-poses.png" alt="Poses de Michi" width="100%" />

Con el servidor de desarrollo encendido, la galería está en `http://localhost:5173/michi.html`. Los dibujos están en [`Web/src/components/ui/Michi.jsx`](Web/src/components/ui/Michi.jsx) y sus frases en [`Web/src/utils/michiVoice.js`](Web/src/utils/michiVoice.js).

---

## Arquitectura

```mermaid
flowchart LR
    subgraph Clientes
        W["🌐 Web · React + Vite<br/>portal, panel admin/agente"]
        M["📱 App móvil · Flutter<br/>usuarios"]
    end
    subgraph Servidor
        API["⚙️ API REST · Node.js + Express<br/>backend/ · puerto 3000"]
        IA["🤖 Servicio de IA · Python + FastAPI<br/>ai/ · 127.0.0.1:8000"]
    end
    DB[("🐬 MySQL (MAMP)<br/>base ti_tickets")]
    DS["☁️ API de DeepSeek"]

    W -- "HTTP + JWT" --> API
    M -- "HTTP + JWT" --> API
    API -- "SQL parametrizado" --> DB
    API -- "token interno + texto ya anonimizado" --> IA
    IA -- "API key (solo en ai/.env)" --> DS
```

- **La API Node es la única que toca la base de datos.** Los clientes (web y móvil) nunca se conectan directamente a MySQL.
- **El servicio de IA no tiene acceso a la base de datos**: la API le envía solo el contexto necesario, ya anonimizado cuando corresponde. Escucha únicamente en `127.0.0.1` y exige un token interno, así que la clave de DeepSeek nunca sale del servidor.
- **La web en desarrollo** redirige `/api` al backend mediante el proxy de Vite, por lo que no hay problemas de CORS.

---

## Tecnologías

| Parte | Carpeta | Tecnologías |
|---|---|---|
| Base de datos | `database/` | MySQL 5.7+ (el de MAMP) |
| API REST | `backend/` | Node.js 20.12+, Express 5, mysql2, bcryptjs, jsonwebtoken, helmet, express-rate-limit |
| Servicio de IA | `ai/` | Python 3.10+, FastAPI, Uvicorn, SDK `openai` (compatible con DeepSeek), Pydantic |
| Web | `Web/` | React 19, Vite, Tailwind CSS 4, Lucide (iconos) |
| App móvil | `movil/` | Flutter, `http`, `shared_preferences`, notificaciones locales |

---

## Estructura del proyecto

```
TI-Tickets/
├── database/
│   └── schema.sql              # Todas las tablas (importable en phpMyAdmin)
├── backend/                    # API REST (Node.js)
│   ├── src/
│   │   ├── server.js           # Arranque del servidor
│   │   ├── app.js              # Express: seguridad, rutas y errores
│   │   ├── config.js           # Lee y valida el .env (sin secretos en el código)
│   │   ├── db.js               # Conexión a MySQL (UTC, consultas parametrizadas)
│   │   ├── middleware/auth.js  # JWT y control de roles
│   │   ├── lib/anonimizar.js   # Quita nombres, correos, teléfonos e IPs
│   │   └── routes/             # auth, tickets, conversaciones, catálogo, foro, IA…
│   └── scripts/
│       ├── db-init.js          # Crea la base de datos (y datos demo con --seed)
│       └── migrate-from-supabase.js
├── ai/                         # Servicio de IA (Python + DeepSeek)
│   └── app/
│       ├── main.py             # Endpoints: clasificar, sugerir respuesta, resumen para el foro
│       ├── prompts.py          # Instrucciones para la IA
│       └── deepseek.py         # Cliente de DeepSeek y manejo de errores
├── Web/                        # Aplicación web (React)
│   └── src/
│       ├── panels/             # Panel de admin y de agente
│       ├── portal/             # Portal sencillo para usuarios
│       ├── foro/               # Foro de soluciones
│       ├── views/              # Dashboard, usuarios, reportes, configuración…
│       ├── components/         # Tickets, layout, Michi…
│       └── lib/api.js          # Cliente HTTP de la API
├── movil/                      # App móvil (Flutter)
├── docs/screenshots/           # Capturas de este README
├── .githooks/pre-commit        # Impide subir secretos a git
└── .htaccess                   # Bloquea el acceso web a la carpeta (MAMP)
```

---

## Instalación paso a paso

### Requisitos

- **[MAMP](https://www.mamp.info/)** (o cualquier MySQL 5.7+). Solo hace falta **MySQL**, no Apache.
- **[Node.js](https://nodejs.org/) 20.12 o superior.**
- **[Python](https://www.python.org/) 3.10 o superior** (para la IA).
- *(Opcional)* **[Flutter](https://flutter.dev/)** para la app móvil.
- *(Opcional)* Una **API key de [DeepSeek](https://platform.deepseek.com/api_keys)**. Sin ella todo funciona salvo los botones de IA.

### 1. Clonar y activar la protección contra secretos

```bash
git clone <url-del-repositorio> TI-Tickets
cd TI-Tickets
git config core.hooksPath .githooks     # impide subir .env o claves por error
```

### 2. Base de datos (MySQL de MAMP)

1. Abre MAMP y enciende **MySQL**. En Windows usa el puerto **3306**; en macOS, normalmente el **8889**.
2. Crea un usuario de MySQL solo para la app, con permisos únicamente sobre su base de datos. Desde phpMyAdmin (pestaña SQL) o la consola:

   ```sql
   CREATE USER 'ti_tickets_app'@'localhost' IDENTIFIED BY 'una-contraseña-larga';
   CREATE USER 'ti_tickets_app'@'127.0.0.1' IDENTIFIED BY 'una-contraseña-larga';
   GRANT ALL PRIVILEGES ON ti_tickets.* TO 'ti_tickets_app'@'localhost';
   GRANT ALL PRIVILEGES ON ti_tickets.* TO 'ti_tickets_app'@'127.0.0.1';
   FLUSH PRIVILEGES;
   ```

   > Aprovecha para cambiar la contraseña por defecto de `root` en MAMP.

### 3. API (backend)

```bash
cd backend
npm install
cp .env.example .env
```

Abre `backend/.env` y rellénalo (ver [Configuración](#configuración-env)). Para generar los secretos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Crea la base de datos con datos de demostración y arranca la API:

```bash
npm run db:seed     # crea "ti_tickets", las tablas, usuarios demo, catálogo y foro de ejemplo
npm run dev         # http://localhost:3000/api (se reinicia al guardar cambios)
```

`npm run db:seed` muestra en la consola las cuentas creadas y sus contraseñas (las de `SEED_*_PASSWORD`, o generadas al azar si están vacías).

### 4. Servicio de IA (opcional, pero recomendado)

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate            # Windows   (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env              # DEEPSEEK_API_KEY y el MISMO AI_SERVICE_TOKEN que backend/.env
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

> En Windows es mejor **no** usar `--reload`: a veces deja un proceso antiguo escuchando el puerto.

### 5. Web

```bash
cd Web
npm install
npm run dev          # http://localhost:5173
```

Abre **http://localhost:5173** y entra con las cuentas demo:

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin1@empresa.com` | la de `SEED_ADMIN_PASSWORD` |
| Agente | `agente1@empresa.com` | la de `SEED_AGENT_PASSWORD` |
| Usuario | `juan` (o `juan@empresa.com`) | la de `SEED_USER_PASSWORD` |

### 6. App móvil (opcional)

```bash
cd movil
cp .env.example .env     # API_URL (ver abajo)
flutter pub get
flutter run
```

`API_URL` depende de dónde se ejecute la app:

| Dónde | `API_URL` |
|---|---|
| Emulador de Android | `http://10.0.2.2:3000/api` |
| Móvil físico (misma red Wi-Fi) | `http://<IP-de-tu-PC>:3000/api` |
| Web o escritorio | `http://localhost:3000/api` |

### Resumen: qué tiene que estar encendido

| Servicio | Comando | Dirección |
|---|---|---|
| MySQL | MAMP → *Start* | `127.0.0.1:3306` |
| API | `cd backend && npm run dev` | `http://localhost:3000/api` |
| IA | `cd ai && uvicorn app.main:app --host 127.0.0.1 --port 8000` | `http://127.0.0.1:8000` |
| Web | `cd Web && npm run dev` | `http://localhost:5173` |

### Llevarlo a producción

1. `cd Web && npm run build` genera la web estática en `Web/dist/`.
2. Sirve `dist/` con cualquier servidor (Nginx, Apache, un hosting estático) y redirige `/api` a la API Node (o define `VITE_API_URL` antes de compilar).
3. En `backend/.env`: `NODE_ENV=production` y `CORS_ORIGINS` con el dominio real (es obligatorio en producción).
4. Usa HTTPS y mantén el servicio de IA accesible solo desde el servidor de la API.

---

## Configuración (`.env`)

Todos los secretos viven **solo** en archivos `.env`, que **nunca se suben a git**. Cada carpeta tiene una plantilla `.env.example` sin valores reales. Si falta algo obligatorio, el servicio no arranca y dice exactamente qué falta.

### `backend/.env`

| Variable | Obligatoria | Descripción |
|---|:---:|---|
| `PORT` | | Puerto de la API (por defecto `3000`) |
| `NODE_ENV` | | `development` o `production` |
| `CORS_ORIGINS` | En producción | Orígenes permitidos, separados por coma (p. ej. `http://localhost:5173`) |
| `DB_HOST`, `DB_PORT` | ✅ | Servidor MySQL (`127.0.0.1`, `3306` en MAMP para Windows) |
| `DB_USER`, `DB_PASSWORD` | ✅ | Usuario de MySQL de la app (no uses `root`) |
| `DB_NAME` | ✅ | Nombre de la base (`ti_tickets`) |
| `JWT_SECRET` | ✅ | Firma de las sesiones. Mínimo 32 caracteres, aleatorio |
| `JWT_EXPIRES_IN` | | Duración de la sesión (por defecto `12h`) |
| `AI_SERVICE_URL` | | Dirección del servicio de IA (por defecto `http://127.0.0.1:8000`) |
| `AI_SERVICE_TOKEN` | ✅ | Token compartido con el servicio de IA. Mínimo 16 caracteres |
| `SEED_ADMIN_PASSWORD`, `SEED_AGENT_PASSWORD`, `SEED_USER_PASSWORD` | | Contraseñas de las cuentas demo que crea `npm run db:seed` |
| `SUPABASE_URL`, `SUPABASE_KEY` | | Solo para migrar datos desde Supabase |

### `ai/.env`

| Variable | Obligatoria | Descripción |
|---|:---:|---|
| `DEEPSEEK_API_KEY` | Para usar la IA | Tu clave de [DeepSeek](https://platform.deepseek.com/api_keys) |
| `DEEPSEEK_BASE_URL` | | Por defecto `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | | `deepseek-chat` (rápido) o `deepseek-reasoner` |
| `AI_SERVICE_TOKEN` | ✅ | El **mismo** valor que en `backend/.env` |
| `AI_ENABLE_DOCS` | | `true` para ver la documentación interactiva en `/docs` (solo desarrollo) |

### `Web/.env` y `movil/.env`

Solo contienen la URL de la API (`VITE_API_URL` y `API_URL`). **Todo lo que pongas aquí es público**, porque se empaqueta dentro de la web o de la app: nunca pongas claves en estos archivos.

---

## Roles y permisos

| Acción | Usuario | Agente | Admin |
|---|:---:|:---:|:---:|
| Reportar problemas y ver **sus** tickets | ✅ | | |
| Escribir en la conversación de un ticket | Solo los suyos | ✅ | ✅ |
| Ver todos los tickets | | ✅ | ✅ |
| Cambiar el estado de un ticket | | ✅ | ✅ |
| Reasignar agente y cambiar la prioridad | | | ✅ |
| Usar la IA (clasificar, sugerir respuesta) | | ✅ | ✅ |
| Buscar, votar y comentar en el foro | ✅ | ✅ | ✅ |
| Proponer un ticket resuelto para el foro | ✅ | | |
| Publicar, editar, ocultar o borrar en el foro | | | ✅ |
| Gestionar usuarios, roles y el catálogo | | | ✅ |

El rol se comprueba **en el servidor** en cada petición, leyéndolo de la base de datos: si el admin le quita el rol a alguien, pierde los permisos al instante.

---

## Inteligencia artificial

La IA usa **DeepSeek** a través de un microservicio en Python. Sin API key, la aplicación funciona igual y los botones de IA muestran un mensaje claro.

| Dónde | Qué hace |
|---|---|
| **Reportes → Convertir a ticket** | *Sugerir clasificación*: elige del catálogo el tipo de incidente, la prioridad y el agente más adecuado para un reporte "Otro", y explica por qué. |
| **Ticket → Sugerir con IA** | *Sugerir respuesta*: redacta un borrador de respuesta para el usuario a partir del ticket y su conversación. El agente lo revisa antes de enviarlo. |
| **Foro → Redactar con IA** | *Resumen para el foro*: convierte un ticket resuelto en una publicación general, con título buscable, problema y pasos de solución, **sin datos personales**. |

**Cómo funciona:** la API reúne el contexto desde MySQL, se lo envía al servicio Python con el token interno, y este llama a DeepSeek y **valida la respuesta** (por ejemplo, que el incidente sugerido exista de verdad en el catálogo, o que la prioridad sea válida).

**Añadir una función de IA nueva:** el prompt va en [`ai/app/prompts.py`](ai/app/prompts.py), el endpoint en [`ai/app/main.py`](ai/app/main.py) y la ruta que lo expone en [`backend/src/routes/ai.js`](backend/src/routes/ai.js).

---

## Foro y anonimato

```mermaid
flowchart LR
    T["Ticket resuelto"] --> U{"¿Quién lo publica?"}
    U -- "El usuario pulsa<br/>Proponer para el foro" --> P["Propuesta<br/>(Por revisar)"]
    U -- "El admin pulsa<br/>Publicar en el foro" --> E
    P --> E["Editor con el texto<br/>ya anonimizado"]
    E -- "Revisar · opcional: Redactar con IA" --> F["📚 Publicado en el foro"]
```

**Cómo se protege el anonimato:**

1. **Anonimización automática:** al crear el borrador se sustituyen el nombre del usuario por `[usuario]`, el del agente por "el equipo de soporte", y correos, teléfonos e IPs por marcadores. No distingue tildes ni mayúsculas: *María*, *MARIA* y *maria.lopez* se detectan igual.
2. **Revisión humana:** el admin siempre revisa el texto antes de publicar, y el editor avisa si quedan marcadores sin reescribir.
3. **La API pública nunca expone** quién tuvo el problema, de qué ticket sale el caso ni quién escribió un comentario anónimo.
4. **A la IA solo se le envía texto ya anonimizado**, y su respuesta pasa otra vez por el anonimizador.
5. **Comentarios anónimos** por defecto; si incluyen correos o teléfonos, también se ocultan.

---

## Seguridad

| Área | Medida |
|---|---|
| **Secretos** | Solo en `.env`. El código no tiene valores por defecto y no arranca si falta un secreto o si todavía tiene el valor de ejemplo. |
| **GitHub** | `.gitignore` excluye `.env`, llaves y firmas. El hook [`.githooks/pre-commit`](.githooks/pre-commit) rechaza commits con archivos `.env` o con claves escritas en el código (DeepSeek, JWT de Supabase, llaves privadas, contraseñas). |
| **MAMP / Apache** | El proyecto está dentro de `htdocs`, así que [`.htaccess`](.htaccess) bloquea el acceso web a toda la carpeta. Sin él, Apache serviría los `.env`. |
| **Contraseñas** | Cifradas con bcrypt. Las antiguas en texto plano se cifran solas al iniciar sesión. |
| **Sesiones** | JWT firmado con HS256 (algoritmo fijado, emisor verificado); el rol se comprueba en la base de datos en cada petición. |
| **Fuerza bruta** | Máximo 20 intentos fallidos de login cada 15 minutos por IP, y límite general de peticiones. |
| **API** | Cabeceras de seguridad (helmet), consultas SQL parametrizadas, lista blanca de campos editables, errores sin detalles internos. |
| **Base de datos** | Usuario de MySQL propio con permisos solo sobre `ti_tickets`. |
| **Servicio de IA** | Solo escucha en `127.0.0.1`, exige el token interno en todas las rutas y no publica `/docs` salvo en desarrollo. |

> Si un secreto se sube por error, **cámbialo**: borrar el commit no basta, porque puede quedar en el historial o en copias.

---

## API REST

Todas las rutas, salvo `login`, `register` y `health`, requieren la cabecera `Authorization: Bearer <token>`.

| Método | Ruta | Quién |
|---|---|---|
| `POST` | `/api/auth/login` — `{ correo \| usuario, password }` | Público |
| `POST` | `/api/auth/register` — `{ usuario, contrasena, correo, departamento }` | Público |
| `GET` | `/api/auth/me` | Cualquier sesión |
| `GET` | `/api/tickets` · `/api/tickets/:id` | Staff: todos · usuario: los suyos |
| `POST` | `/api/tickets` | Cualquier sesión (agente y prioridad salen del catálogo) |
| `PATCH` | `/api/tickets/:id` | Admin, agente |
| `GET` `POST` | `/api/tickets/:id/conversaciones` | Quien tenga acceso al ticket |
| `GET` | `/api/conversaciones/ultimas?tickets=1,2` · `/api/conversaciones/nuevas?after=ID` | Cualquier sesión |
| `GET` `POST` | `/api/otros-incidentes` | Staff: todos · usuario: los suyos |
| `POST` | `/api/otros-incidentes/:id/convertir` | Admin, agente |
| `GET` | `/api/incidentes` · `/api/incidentes/categorias` · `/api/agentes` | Cualquier sesión |
| `POST` `PATCH` | `/api/incidentes` | Admin |
| `GET` · `PATCH` | `/api/usuarios` | Staff (lectura) · admin (edición) |
| `GET` | `/api/foro?q=&categoria=&orden=` · `/api/foro/:id` · `/api/foro/categorias` | Cualquier sesión (solo publicadas) |
| `POST` | `/api/foro/:id/voto` · `/api/foro/:id/comentarios` · `/api/foro/proponer` | Cualquier sesión |
| `GET` | `/api/foro/ticket/:id/estado` | Dueño del ticket o staff |
| `GET` `POST` `PATCH` `DELETE` | `/api/foro/admin/todas` · `/api/foro` · `/api/foro/:id` · `/api/foro/borrador/ticket/:id` | Admin |
| `POST` | `/api/ai/clasificar` · `/api/ai/tickets/:id/sugerir-respuesta` | Admin, agente |
| `POST` | `/api/ai/tickets/:id/resumen-foro` | Admin |

---

## Base de datos

El esquema completo está en [`database/schema.sql`](database/schema.sql). Todas las fechas se guardan en **UTC**.

```mermaid
erDiagram
    Usuarios ||--o{ Tickets : "reporta"
    Usuarios ||--o{ Otros_incidentes : "reporta"
    Usuarios ||--o{ Conversaciones : "escribe"
    Incidentes ||--o{ Tickets : "clasifica"
    Agentes ||--o{ Tickets : "atiende"
    Agentes ||--o{ Incidentes : "por defecto"
    Tickets ||--o{ Conversaciones : "tiene"
    Tickets |o--o| Foro_publicaciones : "origen"
    Foro_publicaciones ||--o{ Foro_votos : "recibe"
    Foro_publicaciones ||--o{ Foro_comentarios : "recibe"

    Usuarios {
        int id PK
        string Usuario
        string Contrasena "hash bcrypt"
        string Rol "usuario, agente o admin"
        string Correo
        string Departmento
    }
    Agentes {
        int id PK
        string Nombre
        string Especialidad
    }
    Incidentes {
        int id PK
        string Categoria
        string Incidente
        string Tiempo "estimado"
        string Prioridad
        int Agentes FK "agente por defecto"
    }
    Tickets {
        int id PK
        int Usuario FK
        int Incidente_ID FK
        int Agente FK
        string Status
        string Prioridad
        datetime Fecha
        text Descripcion
    }
    Conversaciones {
        int id PK
        int incidente_id FK "ticket"
        int Usuario_ID FK
        text mensaje
        datetime fecha_publicacion
    }
    Otros_incidentes {
        int id PK
        int Usuario_ID FK
        string Categoria
        text Descripcion
        string Status
    }
    Foro_publicaciones {
        int id PK
        string Titulo
        string Categoria
        text Problema
        text Solucion
        string Estado "propuesta, publicado u oculto"
        int Ticket_ID FK "privado"
        int Propuesto_por FK "privado"
    }
    Foro_votos {
        int Publicacion_ID PK
        int Usuario_ID PK
        bool Util
    }
    Foro_comentarios {
        int id PK
        int Publicacion_ID FK
        int Usuario_ID FK
        text Mensaje
        bool Anonimo
    }
```

> Los nombres de tablas y columnas se conservan de la versión original en Supabase, para facilitar la migración.

### Migrar datos desde Supabase

Si vienes de la versión anterior del proyecto, rellena `SUPABASE_URL` y `SUPABASE_KEY` (la clave `service_role`) en `backend/.env` y ejecuta:

```bash
cd backend
npm run db:init                 # crea el esquema vacío
npm run db:migrate-supabase     # copia todas las tablas conservando los IDs
```

Las contraseñas en texto plano se guardan cifradas con bcrypt. El script se puede ejecutar varias veces: omite los registros que ya existen.

---

## Scripts disponibles

| Carpeta | Comando | Qué hace |
|---|---|---|
| `backend/` | `npm run dev` | API en modo desarrollo (se reinicia al guardar) |
| `backend/` | `npm start` | API en modo normal |
| `backend/` | `npm run db:init` | Crea o actualiza las tablas, **sin borrar datos** |
| `backend/` | `npm run db:seed` | Tablas + datos de demostración (solo si la base está vacía) |
| `backend/` | `npm run db:migrate-supabase` | Copia los datos desde Supabase |
| `Web/` | `npm run dev` | Web en desarrollo (http://localhost:5173) |
| `Web/` | `npm run build` | Genera la versión de producción en `Web/dist/` |
| `Web/` | `npm run lint` | Revisa el código con ESLint |
| `ai/` | `uvicorn app.main:app --host 127.0.0.1 --port 8000` | Servicio de IA |

---

## Solución de problemas

<details>
<summary><b>La API dice «Configuración inválida en backend/.env» y no arranca</b></summary>

Es a propósito: falta un secreto o todavía tiene el valor de ejemplo. El mensaje dice exactamente qué variable corregir. Copia `backend/.env.example` a `backend/.env` y complétalo; para generar secretos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```
</details>

<details>
<summary><b>«No se pudo conectar a MySQL. ¿Está MAMP encendido?»</b></summary>

- Comprueba que MySQL está encendido en MAMP.
- Revisa el puerto: `3306` en Windows, normalmente `8889` en macOS (`DB_PORT` en `backend/.env`).
- Comprueba que el usuario de `DB_USER` existe y tiene permisos sobre `ti_tickets` (ver el paso 2 de la instalación).
</details>

<details>
<summary><b>Los botones de IA dicen «El servicio de IA no está disponible»</b></summary>

- ¿Está encendido `uvicorn` en la carpeta `ai/`?
- ¿`AI_SERVICE_TOKEN` es **idéntico** en `backend/.env` y `ai/.env`?
- ¿Pusiste `DEEPSEEK_API_KEY` en `ai/.env`? Tras cambiar el `.env`, reinicia el servicio.
- Si sale *«Saldo insuficiente»*, recarga saldo en tu cuenta de DeepSeek.
</details>

<details>
<summary><b>«Demasiados intentos. Espera unos minutos»</b></summary>

Es la protección contra fuerza bruta: 20 intentos fallidos de login en 15 minutos desde la misma IP. Espera o reinicia la API en desarrollo.
</details>

<details>
<summary><b>Un agente no ve sus tickets</b></summary>

El panel del agente muestra los tickets asignados al agente de la tabla **Agentes** cuyo **nombre coincide** con su nombre de usuario (por ejemplo, el usuario «Ana García» ve los tickets del agente «Ana García»). Revisa que ambos nombres sean iguales.
</details>

<details>
<summary><b>La app móvil no se conecta a la API</b></summary>

- En el emulador de Android usa `http://10.0.2.2:3000/api` (no `localhost`).
- En un móvil físico, usa la IP de tu PC en la red local y comprueba que el firewall permite el puerto 3000.
- La app ya permite `http://` en Android (`usesCleartextTraffic`); en producción usa HTTPS.
</details>

<details>
<summary><b>El commit se cancela con «Parece que hay secretos en el código»</b></summary>

El hook detectó una clave o contraseña escrita en el código o un archivo `.env` preparado para subir. Mueve el valor a `.env` y léelo con `process.env` (Node) u `os.getenv` (Python). Si estás seguro de que es un falso positivo: `git commit --no-verify`.
</details>

<details>
<summary><b>http://localhost/TI-Tickets da error 403</b></summary>

Es lo esperado: `.htaccess` bloquea que Apache sirva la carpeta, para que nadie pueda descargar los `.env`. La web se abre en **http://localhost:5173** (Vite), no desde Apache.
</details>

---

## Hoja de ruta

- [ ] Notificaciones en tiempo real (WebSocket/SSE) en lugar de consultar cada pocos segundos
- [ ] Adjuntar capturas de pantalla a los tickets
- [ ] Clasificación automática con IA al crear un reporte "Otro"
- [ ] Métricas de tiempo de resolución y cumplimiento de SLA
- [ ] Guardar la sesión de la app móvil en almacenamiento cifrado

---

<div align="center">
  Hecho con 🧡 y mucho ronroneo · <b>Michi</b>, soporte TI con siete vidas 🐾
</div>
