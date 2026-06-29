# Prompt de contexto para IA — ChronoGest

> Usa este prompt para dar contexto completo a otra IA que vaya a trabajar en el proyecto ChronoGest. Pega el contenido completo al inicio de la conversación.

---

## 1. Identidad del proyecto

**Nombre:** ChronoGest 2.1
**Tipo:** Sistema de gestión de horarios para el SENA (Servicio Nacional de Aprendizaje, Colombia).
**Stack:** Angular 21 + NestJS 11 + PostgreSQL 16 + Redis 7 + Python Face Service (reconocimiento facial).
**Propósito:** Administrar horarios, ambientes, fichas, instructores, aprendices, asistencia facial, solicitudes de cambio y eventos para centros de formación SENA.

---

## 2. Arquitectura general

- **Frontend:** SPA en Angular 21, servidor de desarrollo en `http://localhost:4200`.
- **Backend:** API REST en NestJS 11, expuesta en `http://localhost:3001/api`.
- **Base de datos:** PostgreSQL 16 corriendo en Docker, puerto `5440` mapeado al host.
- **Caché/colas:** Redis 7 en Docker, puerto `6379`.
- **Reconocimiento facial:** Servicio Python (Flask/FastAPI) en Docker, puerto `5000`, basado en DeepFace.
- **Orquestación:** Docker Compose.

### Multitenancy Database-per-Tenant

El backend implementa una arquitectura de **multitenancy basada en Database-per-Tenant**. Cada sede tiene su propia base de datos física.

#### Bases de datos actuales

| BD | Propósito |
|---|---|
| `sena_db` | BD maestra. Contiene el catálogo de tenants/sedes (`tenants`) y los usuarios de ChronoGest (`cg_usuarios`). |
| `tenant_caldas` | Datos de la sede Caldas (físicamente aislada, aunque los repositorios aún no la usan del todo). |
| `tenant_palmira` | Datos de la sede Palmira (físicamente aislada, aunque los repositorios aún no la usan del todo). |

> **Nota importante:** las BD físicas de tenants existen, pero la mayoría de repositorios de negocio aún usan el DataSource maestro (`sena_db`). El aislamiento completo de datos por sede está preparado pero no activado del todo.

#### Flujo de sede

1. Cada usuario tiene un `tenant_slug` en `cg_usuarios`.
2. El login devuelve `tenantSlug` y `tenantNombre`.
3. El frontend guarda la sede en `localStorage` (`cg_tenant`) y la envía en el header `x-tenant-id` en cada petición autenticada.
4. El `TenantMiddleware` valida el slug contra la tabla `tenants` de `sena_db`.
5. Nuevos usuarios pueden seleccionar sede durante el registro. Si se registran sin sede, un administrador debe asignarla desde **Usuarios** para que puedan iniciar sesión.

---

## 3. Estructura de carpetas

```
Nueva carpeta/
├── Asistencia-Backend/          # Backend NestJS
│   ├── src/
│   │   ├── auth/                # JWT, guards, decorators
│   │   ├── chronogest/          # Módulo principal de ChronoGest (usuarios, horarios, etc.)
│   │   ├── asistencia/          # Registro de asistencia facial
│   │   ├── horario/             # Horarios y programación
│   │   ├── ambiente/            # Ambientes físicos
│   │   ├── ficha/               # Fichas de formación
│   │   ├── instructores/        # Instructores
│   │   ├── aprendices/          # Aprendices
│   │   ├── eventos/             # Eventos institucionales
│   │   ├── solicitudes/         # Solicitudes de cambio
│   │   ├── tenants/             # Catálogo de sedes
│   │   ├── infrastructure/      # Middleware, configuración, persistencia de tenants
│   │   └── ...                  # Otros módulos formativos
│   ├── Dockerfile
│   └── .env
├── frontend/                    # Frontend Angular 21
│   ├── src/app/
│   │   ├── core/                # Servicios, modelos, interceptores, guards
│   │   ├── features/            # Componentes de vistas (auth, admin, instructor, aprendiz)
│   │   └── shared/              # Componentes reutilizables y layout
│   ├── Dockerfile
│   └── package.json
├── docker/                      # Scripts de inicialización de BD
│   └── postgres/init/
│       ├── 01-create-tenant-dbs.sql
│       ├── 02-create-tenants-table.sql
│       └── 03-migrate-users-tenant.sql
├── docker-compose.yml
├── README.md
└── AGENTS.md                    # Notas para agentes/IA
```

---

## 4. Entidades y tablas principales

### ChronoGest (`sena_db`)

- `cg_usuarios` — usuarios del sistema (admin, instructor, aprendiz).
- `cg_administradores`, `cg_instructores`, `cg_aprendices` — perfiles por rol.
- `cg_fichas`, `cg_ambientes`, `cg_horarios`, `cg_competencias`, `cg_eventos`, `cg_solicitudes_cambio`, `cg_notificaciones`, `cg_ubicaciones`.
- `cg_configuracion` — configuración global, incluye `pinRegistro` (default `1234`).
- `tenants` — catálogo maestro de sedes.

### Otros módulos

- `horario_orm_entity`, `asistencia_registros`, `asistencia_sesiones`, etc.
- Módulos formativos: `centro_formacion`, `sede`, `departamento`, `municipio`, `area`, `programa`, `curso`, `matricula`, `persona`, `rol`, `permiso`, `acceso`, etc.

---

## 5. Flujos clave

### Registro

1. Usuario hace clic en "Registrarse".
2. El frontend pide PIN (`/api/auth/verify-pin`). PIN por defecto: `1234`.
3. Al validar el PIN, carga:
   - Fichas (`/api/fichas`)
   - Municipios (`/api/formativo/municipios`)
   - Sedes (`/api/tenants`)
4. El usuario completa el formulario y selecciona una **sede obligatoria**.
5. El frontend envía el registro a `POST /api/auth/register` incluyendo `tenantSlug`.
6. El backend valida la sede, guarda el usuario y retorna éxito.
7. El usuario puede iniciar sesión inmediatamente.

### Login

1. Usuario ingresa correo/documento y contraseña.
2. Backend busca en `cg_usuarios`.
3. Si no tiene `tenant_slug`, rechaza con: *"No tienes una sede asignada. Contacta al administrador."*
4. Si tiene sede, valida contra `tenants` y devuelve token + datos de usuario + sede.
5. Frontend guarda token, usuario y sede en `localStorage`.
6. El layout muestra un badge con el nombre de la sede.

### Asignación/cambio de sede por admin

- Endpoint: `PATCH /api/usuarios/tenant`
- Body: `{ documento: string, tenantSlug: string | null }`
- Usado desde la pantalla **Usuarios** del panel de administración.

---

## 6. Configuración y ejecución

### Requisitos

- Docker Desktop 4.x+
- Node.js 20 LTS+
- npm 9+

### Levantar el stack

```bash
# Backend + BD + Redis + Face Service
docker-compose up -d

# Frontend local (recomendado)
cd frontend
npm install
npm start
```

### URLs

- Frontend: http://localhost:4200
- Backend: http://localhost:3001/api
- Face Service: http://localhost:5000
- PostgreSQL: localhost:5440
- Redis: localhost:6379

### Variables de entorno clave

En `Asistencia-Backend/.env`:

```env
PORT=3001
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5440
DB_USER=postgres
DB_PASSWORD=alejo.v02
DB_NAME=sena_db
DB2_HOST=127.0.0.1
DB2_PORT=5440
DB2_USER=postgres
DB2_PASSWORD=alejo.v02
DB2_NAME=proyecto_formativo_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=chronogest_sena_jwt_secret_2024_very_secure_key_abc123
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:4200
UPLOAD_DIR=uploads
```

> En Docker, `DB_HOST`, `DB2_HOST` y `REDIS_HOST` se sobreescriben a `db` y `redis` respectivamente.

---

## 7. Cambios recientes importantes

### Selector de sede en el registro

- **Backend:** `Asistencia-Backend/src/chronogest/services/auth-cg.service.ts` ahora acepta `tenantSlug` en `register()` y valida que la sede exista antes de guardar.
- **Frontend:** `frontend/src/app/features/auth/login.component.ts` muestra un selector de sede obligatorio después de validar el PIN.
- **Motivo:** antes los nuevos usuarios se registraban sin sede y no podían iniciar sesión.

### Estabilización del backend en Docker

- **Archivo:** `docker-compose.yml`
- **Cambio:** el servicio `backend` ahora usa `command: npx nest start` (sin `--watch`) para evitar reinicios constantes en Docker Desktop para Windows.

### Datos corregidos en BD

- Se asignó la sede `caldas` a todos los usuarios existentes que tenían `tenant_slug` vacío.
- Se creó un usuario administrador funcional:
  - Correo: `admin@caldas.com`
  - Documento: `12345`
  - Contraseña: `Admin1234!`
  - Sede: `caldas`

---

## 8. Archivos clave para entender el sistema

### Backend

- `Asistencia-Backend/src/chronogest/services/auth-cg.service.ts` — login, registro, PIN.
- `Asistencia-Backend/src/chronogest/controllers/auth-cg.controller.ts` — rutas de auth.
- `Asistencia-Backend/src/chronogest/entities/usuario-cg.entity.ts` — entidad de usuario.
- `Asistencia-Backend/src/infrastructure/middleware/tenant.middleware.ts` — validación de header `x-tenant-id`.
- `Asistencia-Backend/src/infrastructure/persistence/tenants/tenant-connection.manager.ts` — resolución de tenants.
- `Asistencia-Backend/src/tenants/infrastructure/http/tenants.controller.ts` — endpoint `/api/tenants`.
- `Asistencia-Backend/src/chronogest/services/usuarios-cg.service.ts` — asignación de sede a usuarios.

### Frontend

- `frontend/src/app/features/auth/login.component.ts` — login, registro, PIN, selector de sede.
- `frontend/src/app/core/services/auth.service.ts` — llamadas a `/api/auth/*`.
- `frontend/src/app/core/services/api.service.ts` — llamadas generales a la API.
- `frontend/src/app/core/interceptors/auth.interceptor.ts` — añade token y header `x-tenant-id`.
- `frontend/src/app/shared/layout/app-layout.component.ts` — layout con badge de sede.
- `frontend/src/app/features/admin/usuarios/usuarios.component.ts` — gestión de usuarios y asignación de sede.

---

## 9. Convenciones y estilo

- **Backend:** NestJS modular, TypeORM, repositorios inyectados, DTOs implícitos en algunos endpoints.
- **Frontend:** Angular con signals (`signal()`, `computed()`), componentes standalone, `ngModel` para formularios simples, componente `app-ss` para selects searchable.
- **Nomenclatura:** tablas de ChronoGest prefijadas con `cg_`.
- **Idioma:** español para nombres de tablas, columnas, endpoints y mensajes de usuario.

---

## 10. Problemas y soluciones conocidas

| Problema | Causa | Solución actual |
|---|---|---|
| Usuario registrado no puede iniciar sesión | No tenía `tenant_slug` | Se agregó selector de sede en registro; se asignó sede a usuarios existentes. |
| Backend se reinicia constantemente en Docker | `nest start --watch` inestable en Docker Desktop Windows | Se cambió a `npx nest start` sin watch. |
| Tablas no se crean | TypeORM con `synchronize` puede fallar | Verificar conexión a BD y reiniciar backend. |

---

## 11. Notas para la IA

- Si vas a modificar autenticación, considera siempre el flujo de sede (`tenantSlug`).
- Si creas nuevos endpoints protegidos, asegúrate de que el `TenantMiddleware` pueda acceder al catálogo `tenants` en `sena_db`.
- Los repositorios de negocio aún usan principalmente `sena_db`; cualquier cambio hacia aislamiento real por tenant debe hacerse con cuidado y probarse en `tenant_caldas` / `tenant_palmira`.
- El frontend usa URLs hardcodeadas a `http://localhost:3001/api` en varios lugares; si cambias el puerto o host del backend, actualiza también el frontend.
- El reconocimiento facial depende del servicio Python (`python-face-service`) y del directorio `uploads/` compartido.

---

## 12. Preguntas frecuentes para orientar el trabajo

- ¿Necesitas agregar un nuevo módulo de negocio? Revisa si ya existe en `Asistencia-Backend/src/` y en `frontend/src/app/features/`.
- ¿Necesitas cambiar el flujo de registro/login? Revisa `auth-cg.service.ts` y `login.component.ts`.
- ¿Necesitas agregar una nueva sede? Crea la BD física, inserta el registro en `tenants`, y reinicia el backend.
- ¿Necesitas modificar la base de datos? Los scripts de inicialización están en `docker/postgres/init/`.

---

**Fin del contexto.** Ahora puedes pedirme que realice tareas específicas sobre ChronoGest.
