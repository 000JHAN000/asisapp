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
├── 02-create-tenants-table.sql   # Crea la tabla tenants e inserta las sedes
└── 03-migrate-users-tenant.sql   # Asigna Yamborot a usuarios existentes
```

Estos scripts se montan en `/docker-entrypoint-initdb.d` del contenedor PostgreSQL y se ejecutan automáticamente la primera vez que se levanta el volumen.

### Asignación de sede por usuario

La sede no se elige en el login. Cada usuario tiene una sede asignada en el campo `tenant_slug` de la tabla `cg_usuarios`:

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
2. El backend busca el usuario en `cg_usuarios`.
3. Si el usuario no tiene `tenant_slug`, rechaza el login con el mensaje:  
   `"No tienes una sede asignada. Contacta al administrador."`
4. Si tiene sede, valida que exista en el catálogo y devuelve `tenantSlug` + `tenantNombre` en la respuesta.
5. El frontend guarda la sede en `localStorage` (`cg_tenant`) y la muestra en el layout.

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

### Flujo en el frontend

1. El usuario llega al login y escribe sus credenciales.
2. El backend determina la sede y el frontend la guarda automáticamente.
3. El `app-layout` muestra un badge con el nombre de la sede actual.
4. Si un usuario autenticado no tiene sede seleccionada, se le cierra la sesión.
5. En la pantalla **Usuarios → Instructores/Aprendices/Administradores**, el admin puede asignar/cambiar la sede de cada usuario.

### Alcance actual

Por ahora el catálogo de tenants y las BDs físicas están creadas, pero **los repositorios de negocio aún usan el DataSource maestro** (`sena_db`). El aislamiento completo de datos por sede se activará en una fase posterior. Esto permite que el sistema siga funcionando igual mientras se prepara la arquitectura.

### Agregar una nueva sede en el futuro

1. Crear la base de datos física en PostgreSQL.
2. Insertar un registro en la tabla `tenants` de `sena_db`.
3. Reiniciar el backend para que el catálogo se recargue (el middleware valida contra BD en cada petición).
4. Asignar usuarios a la nueva sede desde la pantalla de Usuarios.

### Archivos clave

Backend:
- `src/infrastructure/middleware/tenant.middleware.ts`
- `src/infrastructure/config/tenant-context.ts`
- `src/infrastructure/persistence/tenants/tenant-connection.manager.ts`
- `src/infrastructure/persistence/tenants/tenant-data-source.provider.ts`
- `src/infrastructure/persistence/tenants/tenant.module.ts`
- `src/tenants/infrastructure/http/tenants.controller.ts`
- `src/chronogest/entities/usuario-cg.entity.ts`
- `src/chronogest/services/auth-cg.service.ts`
- `src/chronogest/services/usuarios-cg.service.ts`
- `src/chronogest/controllers/usuarios-cg.controller.ts`
- `src/chronogest/services/instructores.service.ts`
- `src/chronogest/services/aprendices.service.ts`
- `src/chronogest/services/administradores.service.ts`

Frontend:
- `src/app/features/auth/login.component.ts`
- `src/app/shared/layout/app-layout.component.ts`
- `src/app/features/admin/usuarios/usuarios.component.ts`
- `src/app/core/services/auth.service.ts`
- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/core/services/api.service.ts`
- `src/app/core/models/user.model.ts`
