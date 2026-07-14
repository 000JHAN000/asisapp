# Notas para agentes — ChronoGest

## Multitenancy Database-per-Tenant (sedes)

El proyecto implementa una arquitectura de **multitenancy basada en Database-per-Tenant**. Esto significa que el backend es una única instancia compartida (stateless), pero cada sede tiene su propia base de datos física de PostgreSQL.

### Sedes configuradas por defecto

| Slug              | Nombre                        | Base de datos             |
|-------------------|-------------------------------|---------------------------|
| `yamborot`        | Yamborot                      | `sena_db_yamborot`        |
| `centro-comercio` | Centro Comercio y Servicio    | `sena_db_centro_comercio` |

### Dónde vive el catálogo de sedes

La tabla `tenants` está en la base de datos maestra (`sena_db`). Contiene el slug, nombre y credenciales de conexión de cada sede.

Los scripts de inicialización se encuentran en:

```
docker/postgres/init/
├── 01-create-tenant-dbs.sql      # Crea las BDs físicas de cada sede
└── 02-create-tenants-table.sql   # Crea el esquema auth y la tabla auth.tenants
```

Estos scripts se montan en `/docker-entrypoint-initdb.d` del contenedor PostgreSQL y se ejecutan automáticamente la primera vez que se levanta el volumen.

### Asignación de sede por usuario

La sede no se elige en el login. Cada usuario tiene una sede asignada en el campo `tenant_slug` de la tabla `usuario_maestro`:

- **Usuarios existentes**: se migraron a `yamborot` por defecto.
- **Nuevos usuarios**: durante el registro pueden seleccionar una sede del catálogo disponible. Si se registran sin sede (`tenant_slug` es `null`), el administrador debe asignarles una sede desde la pantalla **Usuarios** para que puedan iniciar sesión.
- **Cambio de sede**: el administrador puede cambiar la sede de cualquier usuario desde la columna "Sede" en la pantalla de Usuarios.

### Header `x-tenant-id`

El frontend envía el header `x-tenant-id` en cada petición autenticada con el slug de la sede asignada al usuario. El backend:

1. Lo recibe a través de `TenantMiddleware`.
2. Valida que el slug exista en el catálogo `tenants`.
3. Lo guarda en un `AsyncLocalStorage` (`tenant-context.ts`) para que esté disponible durante toda la petición.

### Login automático por sede

El flujo de autenticación es:

1. El usuario ingresa solo correo/documento y contraseña.
2. El backend busca la credencial en `sena_db` (`credencial` → `usuario` → `persona`).
3. Si el usuario no tiene `tenant_slug`, rechaza el login con el mensaje:  
   `"No tienes una sede asignada. Contacta al administrador."`
4. Si tiene sede, valida que exista en el catálogo, resuelve el `perfilId` y (para aprendices) la ficha actual según la BD del tenant, y devuelve `tenantSlug` + `tenantNombre` en la respuesta.
5. El frontend guarda la sede en `localStorage` (`cg_tenant`) y la muestra en el layout.

### Registro de usuarios de sede

- `POST /api/auth/register` (público, previo PIN) y `POST /api/auth/register-admin` (solo admins) crean la persona, usuario y credencial en `sena_db`, y el perfil correspondiente en la BD del tenant.
- Para el rol **aprendiz**, si el frontend envía `fichaId`, el backend también crea la **matrícula** en el tenant. Esto permite que, al iniciar sesión, el aprendiz reciba su `fichaId` y pueda ver las sesiones de asistencia activas de su ficha.
- El registro valida que no exista ya una persona con el mismo correo o documento.

### Registro masivo de usuarios

La pantalla **Registro Masivo** permite a un administrador subir un archivo Excel/CSV para crear aprendices o instructores en bloque dentro de su sede.

```
POST /api/admin/registro-masivo?tipo=aprendices|instructores
Content-Type: multipart/form-data
Body: file (archivo .xlsx, .xls o .csv)
Headers: Authorization: Bearer <token>, x-tenant-id: <slug>
```

**Columnas esperadas:**

- **Aprendices:** `nombre`, `apellido`, `tipo_doc`, `num_doc`, `correo`, `telefono`, `ficha_codigo`, `genero`, `municipio`
- **Instructores:** `nombre`, `apellido`, `tipo_doc`, `num_doc`, `correo`, `telefono`, `genero`, `municipio`, `area`

Los campos `nombre`, `apellido`, `num_doc` y `correo` son obligatorios. La contraseña inicial de cada usuario es su número de documento (`num_doc`).

**Respuesta:**

```json
{
  "total": 10,
  "exitosos": 8,
  "fallidos": 2,
  "errores": [
    { "fila": 3, "datos": { ... }, "error": "La ficha '2557890' no existe en esta sede" }
  ]
}
```

Por cada fila exitosa el backend crea: persona, usuario, credencial y `usuario_maestro` en `sena_db`; y el perfil correspondiente en la BD del tenant (matrícula para aprendices, instructor para instructores). Las filas con error no detienen el procesamiento de las demás.

### Fichas e instructor líder

- El Programador de Fichas (`/app/admin/programador-fichas`) usa el modal **Nueva Ficha** para crear un `Curso` en el tenant.
- El modal permite seleccionar un **instructor líder** de la lista de instructores de la sede; el backend guarda el nombre completo en el campo `lider` de `curso_orm_entity`.
- `GET /api/horarios-admin/fichas` devuelve cada ficha incluyendo su `lider`.

### Endpoint público de sedes

```
GET /api/tenants
```

Retorna la lista de sedes disponibles. Se usa en la pantalla de Usuarios para el selector de sede.

### Endpoint de asignación de sede

```
PATCH /api/usuarios/tenant
Body: { documento: string, tenantSlug: string | null }
```

Permite al administrador asignar o cambiar la sede de un usuario por su número de documento.

### Endpoint de activación/inactivación de usuario

```
PATCH /api/usuarios/activo
Body: { documento: string, activo: boolean }
```

Permite al administrador activar o desactivar un usuario. Un usuario inactivo no puede iniciar sesión.

### Endpoint de municipio de usuario

```
PATCH /api/usuarios/municipio
Body: { documento: string, municipio: string | null }
```

Permite al administrador asignar o cambiar el municipio de un usuario.

### Flujo en el frontend

1. El usuario llega al login y escribe sus credenciales.
2. El backend determina la sede y el frontend la guarda automáticamente.
3. El `app-layout` muestra un badge con el nombre de la sede actual.
4. Si un usuario autenticado no tiene sede seleccionada, se le cierra la sesión.
5. En la pantalla **Usuarios → Instructores/Aprendices**, el admin puede asignar/cambiar la sede, activar/desactivar y ver documento, ficha y municipio de cada usuario.

### Alcance actual

Por ahora el catálogo de tenants y las BDs físicas están creadas. La autenticación de sedes, la administración de horarios/competencias/eventos/notificaciones/solicitudes/configuración, la gestión de instructores/aprendices/administradores y el módulo de asistencia operan sobre el modelo legacy conectado por tenant. Las tablas `cg_*` fueron eliminadas de las bases de datos tenant una vez validada la migración; los respaldos previos al borrado se guardan en `backups/cg_drop_<fecha>/`. La base maestra `sena_db` conserva `tenants` (catálogo de sedes) y `usuario_maestro` (credenciales, rol, sede y datos de perfil). El resto de tablas `cg_*` fueron eliminadas de `sena_db` y de `test_sede_db3`.

### Agregar una nueva sede en el futuro

1. Crear la base de datos física en PostgreSQL.
2. Insertar un registro en la tabla `tenants` de `sena_db`.
3. Reiniciar el backend para que el catálogo se recargue (el middleware valida contra BD en cada petición).
4. Asignar usuarios a la nueva sede desde la pantalla de Usuarios.

### Migración a tablas legacy conectadas (en progreso)

Los endpoints de autenticación (`/api/auth`) y administración de horarios (`/api/horarios-admin/*`, `/api/competencias`, `/api/eventos`, `/api/notificaciones`, `/api/solicitudes`, `/api/configuracion`) ya no usan las tablas desconectadas `cg_*`; operan sobre el modelo legacy conectado por tenant (`persona`, `usuario`, `credencial`, `rol`, `instructor`, `administrador`, `curso`, `ambiente`, `horario`, `matricula`, `competencia`, `evento`, `notificacion`, `solicitud_cambio`, `configuracion_app`).

- Scripts de migración de datos (raíz del proyecto):
  - `migrar_tenant_legacy.sql`: migra instructores, aprendices, administradores, cursos, ambientes, matrículas y horarios; incluye corrección robusta de `instructor_fk`.
  - `migrar_cg_extras.sql`: migra competencias, eventos, notificaciones, solicitudes de cambio y configuración; es idempotente.
- Servicios legacy conectados:
  - `HorariosAdminCGService`
  - `CompetenciasCGService`
  - `EventosCGService`
  - `NotificacionesCGService`
  - `SolicitudesCGService`
  - `ConfiguracionCGService`

### Archivos clave

Backend:
- `src/infrastructure/middleware/tenant.middleware.ts`
- `src/infrastructure/config/tenant-context.ts`
- `src/auth/infrastructure/persistence/tenants/tenant-connection.manager.ts`
- `src/auth/infrastructure/persistence/tenants/tenant-data-source.provider.ts`
- `src/auth/infrastructure/persistence/tenants/tenant.module.ts`
- `src/auth/infrastructure/http/tenants.controller.ts`
- `src/auth/infrastructure/http/tenants-admin.controller.ts`
- `src/auth/infrastructure/entities/usuario-maestro.orm-entity.ts`
- `src/auth/application/tenant-provisioning.service.ts`
- `src/auth/application/auth-cg.service.ts`
- `src/horario/application/horarios-admin-cg.service.ts`
- `src/modulo/application/competencias-cg.service.ts`
- `src/aplicativo/application/eventos-cg.service.ts`
- `src/aplicativo/application/notificaciones-cg.service.ts`
- `src/aplicativo/application/solicitudes-cg.service.ts`
- `src/aplicativo/application/configuracion-cg.service.ts`

Frontend:
- `src/app/features/auth/login.component.ts`
- `src/app/shared/layout/app-layout.component.ts`
- `src/app/features/admin/usuarios/usuarios.component.ts`
- `src/app/core/services/auth.service.ts`
- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/core/services/api.service.ts`
- `src/app/core/models/user.model.ts`
