# Análisis Técnico — ChronoGest 2.1

> Fecha: 2 de julio de 2026
> Proyecto: ChronoGest — Sistema de gestión de horarios y asistencia para el SENA
> Ubicación: `C:\Users\anaco\OneDrive\Desktop\Nueva carpeta`

---

## 1. Resumen Ejecutivo

**ChronoGest** es un sistema fullstack de gestión de horarios y control de asistencia facial desarrollado para el Servicio Nacional de Aprendizaje (SENA) de Colombia. Soporta múltiples sedes mediante una arquitectura de **multitenancy Database-per-Tenant**, integra reconocimiento facial biométrico para registrar asistencia, y ofrece roles diferenciados (administrador, instructor, aprendiz, super admin).

| Atributo | Valor |
|----------|-------|
| **Nombre** | ChronoGest 2.1 |
| **Cliente/Institución** | SENA (Centro de Diseño Tecnológico Industrial) |
| **Frontend** | Angular 21 + Tailwind CSS + Lucide Icons |
| **Backend** | NestJS 11 + TypeORM + PostgreSQL 16 |
| **Microservicio** | Python 3.11 + FastAPI + DeepFace (ArcFace) |
| **Infraestructura** | Docker Compose (PostgreSQL, Redis, Backend, Frontend, Face Service) |
| **Arquitectura** | DDD/Hexagonal híbrida + Database-per-Tenant |
| **Autenticación** | JWT (Passport) + RBAC + Multitenancy por header |

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │  Angular 21 │    │  Navegador  │    │  Cámara / Móvil     │ │
│  │  (P4200)   │    │  (Web)      │    │  (Fotos asistencia) │ │
│  └──────┬──────┘    └─────────────┘    └─────────────────────┘ │
│         │                                                        │
│         ▼ HTTP + Bearer + x-tenant-id                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (NestJS 11)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Capa HTTP (Controllers)                                  │ │
│  │  - Auth, Asistencia, Horarios, Usuarios, Aplicativo      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Capa de Aplicación (Services)                             │ │
│  │  - AuthCGService, AsistenciaService, HorariosAdminService  │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Capa de Dominio (Entities + Ports)                        │ │
│  │  - Entidades puras + Interfaces de repositorio            │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Capa de Infraestructura (Adapters + ORM)                  │ │
│  │  - TypeORM Repositories + TenantConnectionManager          │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Middleware + Guards                                         │ │
│  │  - TenantMiddleware → AsyncLocalStorage → TenantContext    │ │
│  │  - JwtGuard + TenantMatchGuard + RbacGuard                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐
│  PostgreSQL 16  │  │   Redis 7    │  │  Face Service   │
│  (Multitenancy) │  │  (Cache/Bull)│  │  (Python 5000)  │
└─────────────────┘  └──────────────┘  └─────────────────┘
```

### 2.2 Patrón de multitenancy: Database-per-Tenant

El sistema implementa una arquitectura **Database-per-Tenant** con las siguientes bases de datos:

| Base de datos | Contenido |
|---------------|-----------|
| `sena_db` | Catálogo maestro (`auth.tenants`, `usuario_maestro`) |
| `sena_db_yamborot` | Datos operativos de la sede Yamborot |
| `sena_db_centro_comercio` | Datos operativos de la sede Centro Comercio y Servicio |

**Flujo de resolución de tenant:**
1. Frontend envía header `x-tenant-id` con el slug de la sede.
2. `TenantMiddleware` valida que el slug exista en `auth.tenants`.
3. El tenant se guarda en `AsyncLocalStorage` (`tenant-context.ts`).
4. `TenantConnectionManager` mantiene un pool LRU de `DataSource` TypeORM (máx. 20 conexiones).
5. Los repositorios operan sobre la BD del tenant activo.

### 2.3 Arquitectura del backend (DDD/Hexagonal híbrida)

Cada dominio tiene 4 capas internas:

```
src/<dominio>/
├── domain/
│   ├── entities/     ← Entidades de dominio puro
│   └── ports/        ← Interfaces de repositorios
├── application/      ← Casos de uso / servicios
└── infrastructure/
    ├── adapters/     ← Implementaciones TypeORM de los ports
    ├── entities/     ← Entidades ORM (TypeORM decorators)
    └── http/         ← Controllers + DTOs
```

**Patrones implementados:**
- **Repository Pattern**: cada dominio define su puerto (`*.repository.port.ts`) y su adaptador (`*.typeorm.repository.ts`).
- **Inyección de dependencias**: tokens simbólicos (`HORARIO_REPOSITORY`, `AUTH_REPOSITORY`).
- **CQRS híbrido**: servicios `*-cg.service.ts` operan directamente sobre el tenant activo sin pasar por el dominio puro.

---

## 3. Stack Tecnológico Detallado

### 3.1 Frontend (Angular 21)

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Angular | 21.2.0 | Framework principal (standalone components) |
| Angular Material | 21.2.11 | Instalado pero **no usado activamente** en componentes principales |
| PrimeNG | 21.1.7 | Instalado pero **no usado activamente** |
| Taiga UI | 5.6.0 | Instalado pero **no usado activamente** |
| Tailwind CSS | 4.2.2 | Framework CSS principal (custom UI) |
| Lucide Angular | 1.0.0 | Librería de iconos (usada en TODO el frontend) |
| html2canvas | 1.4.1 | Generación de capturas de pantalla para reportes |
| jspdf | 4.2.1 | Generación de PDFs |
| RxJS | 7.8.0 | HTTP + operadores reactivos |

**Observación importante**: El frontend usa un UI **100% custom** con HTML/CSS/Sass + Tailwind. Las librerías Angular Material, PrimeNG y Taiga UI están instaladas pero no se detectan en los imports de los componentes principales. Esto sugiere una dependencia no utilizada o en fase de transición.

### 3.2 Backend (NestJS 11)

| Tecnología | Versión | Uso |
|------------|---------|-----|
| NestJS | 11.0.1 | Framework backend (modular) |
| TypeORM | 0.3.28 | ORM principal (PostgreSQL) |
| PostgreSQL | 16 | Base de datos principal (multitenancy) |
| Redis | 7 | Cache + Bull queues |
| Bull | 4.16.5 | Colas de procesamiento en background |
| Passport + JWT | 0.7.0 / 11.0.2 | Autenticación JWT |
| bcrypt | 6.0.0 | Hash de contraseñas |
| Swagger | 11.2.6 | Documentación API |
| Prisma | 7.5.0 | Instalado pero no se detecta uso activo en el análisis |
| MySQL2 | 3.22.3 | Driver legacy (probablemente migración de MySQL a PostgreSQL) |

### 3.3 Microservicio de Reconocimiento Facial

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Python | 3.11 | Lenguaje principal |
| FastAPI | — | Framework REST |
| Uvicorn | — | Servidor ASGI |
| DeepFace | 0.0.93 | Motor de reconocimiento facial |
| ArcFace | — | Modelo de embeddings faciales |
| OpenCV | — | Detector de rostros (backend) |

**Flujo de verificación facial (3 capas):**
1. Detección de rostro (exactamente 1 rostro, confianza > 0.5).
2. Coincidencia con foto base (umbral de distancia coseno = 0.20).
3. Anti-reutilización (compara con última foto de asistencia, umbral = 0.08).

---

## 4. Estructura de Dominios y Features

### 4.1 Dominios del backend (24 módulos)

| Dominio | Archivo raíz | Responsabilidad principal |
|---------|-------------|---------------------------|
| `auth` | `auth.module.ts` | Login, JWT, registro, multitenancy, sedes |
| `asistencia` | `asistencia.module.ts` | Sesiones de asistencia, firma, verificación facial, reportes |
| `horario` | `horario.module.ts` | Horarios de clase, administración CRUD |
| `aplicativo` | `aplicativo.module.ts` | Eventos, notificaciones, solicitudes, configuración, uploads |
| `persona` | `persona.module.ts` | Personas, instructores, aprendices, administradores, registro facial |
| `usuario` | `usuario.module.ts` | Usuarios, asignación de sedes, activación/inactivación |
| `curso` | `curso.module.ts` | Fichas (cursos), programas, áreas |
| `matricula` | `matricula.module.ts` | Matrículas de aprendices a fichas |
| `super-admin` | `super-admin.module.ts` | Gestión de tenants/sedes (solo super_admin) |
| `queues` | `queues.module.ts` | Jobs en background con Bull |

### 4.2 Features del frontend (por rol)

| Rol | Rutas | Features disponibles |
|-----|-------|---------------------|
| **Administrador** | `/app/admin/...` | Dashboard, horarios (3 vistas), programador de eventos/fichas, usuarios, solicitudes, configuración, asistencia-historial, registro masivo |
| **Instructor** | `/app/instructor/...` | Dashboard, mis horarios, gestión de asistencia, solicitudes (si es líder) |
| **Aprendiz** | `/app/aprendiz/...` | Dashboard, mis horarios, registro facial, asistencia (firma) |
| **Super Admin** | `/super-admin/...` | Gestión de tenants/sedes |
| **Dev** | `/dev/...` | Formativo, horarios-admin (CRUD legacy) |

---

## 5. Endpoints API Principales

### 5.1 Autenticación (`/api/auth`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login por correo/documento + contraseña |
| POST | `/api/auth/logout` | Invalida token (blacklist en memoria) |
| POST | `/api/auth/register` | Registro público |
| POST | `/api/auth/register-admin` | Registro admin (requiere admin) |
| POST | `/api/auth/verify-pin` | Verifica PIN de registro |
| GET | `/api/auth/me` | Perfil del usuario autenticado |

### 5.2 Asistencia (`/api/asistencia`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/asistencia/sesiones` | Crear sesión de asistencia |
| GET | `/api/asistencia/sesiones/:id` | Ver sesión con registros |
| GET | `/api/asistencia/sesiones/horario/:horarioId/activa` | Sesión activa por horario |
| PATCH | `/api/asistencia/sesiones/:id/cerrar` | Cerrar sesión |
| SSE | `/api/asistencia/sesiones/:id/stream` | Firmas en tiempo real |
| POST | `/api/asistencia/registros/verificar-rostro` | Verificación facial |
| POST | `/api/asistencia/registros/firma` | Registrar firma del aprendiz |
| PATCH | `/api/asistencia/registros/falla-justificada` | Marcar falla justificada |

### 5.3 Horarios (`/api/horarios`, `/api/horarios-admin`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/horarios` | Listar horarios |
| POST | `/api/horarios` | Crear horario(s) |
| PUT | `/api/horarios/:id` | Actualizar horario |
| PATCH | `/api/horarios/:id/toggle` | Activar/desactivar |
| PATCH | `/api/horarios/:id/play` | Iniciar clase |
| PATCH | `/api/horarios/:id/finalizar` | Finalizar clase |
| GET | `/api/horarios-admin/*` | CRUD completo de admin (fichas, ambientes, instructores, etc.) |

### 5.4 Multitenancy / Sedes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tenants` | Lista pública de sedes disponibles |
| GET | `/api/super-admin/tenants` | Lista completa (super_admin) |
| POST | `/api/super-admin/tenants` | Crear nueva sede |
| PATCH | `/api/super-admin/tenants/:slug/status` | Activar/suspender sede |
| PATCH | `/api/usuarios/tenant` | Asignar/cambiar sede de usuario |
| PATCH | `/api/usuarios/activo` | Activar/desactivar usuario |
| PATCH | `/api/usuarios/municipio` | Asignar municipio |

---

## 6. Autenticación y Autorización

### 6.1 Sistema de Guards (4 capas)

El `AppModule` registra 4 guards globales en orden:

1. **JwtGuard**: Protege todas las rutas excepto `@Public()`.
2. **TenantMatchGuard**: Valida que el tenant del JWT coincida con el header `x-tenant-id`.
3. **RbacGuard**: Control de roles basado en decorador `@Roles()`.
4. **TenantGuard**: Validación legacy de `x-aplicativo-id`.

### 6.2 Roles de usuario

| Rol | Permisos |
|-----|----------|
| `super_admin` | Gestión de plataforma, tenants, sedes |
| `admin` | Acceso completo al sistema de su sede |
| `instructor` | Ver sus horarios, registrar competencias, crear solicitudes de cambio |
| `aprendiz` | Ver horarios de su ficha, registrar asistencia facial |

### 6.3 Flujo de login

1. Usuario envía `identifier` (correo o documento) + `password`.
2. `AuthCGService.login()` busca en `credencial` → `usuario` → `persona`.
3. Valida que el usuario tenga `tenant_slug` asignado (excepto `super_admin`).
4. Si no tiene sede: rechaza con *"No tienes una sede asignada. Contacta al administrador."*
5. Resuelve `perfilId` en la BD del tenant (instructor/admin/aprendiz).
6. Genera JWT con `tenantSlug`, `tenantNombre`, `rol`, `perfilId`.
7. Frontend guarda token y tenant en `localStorage`.

---

## 7. Fortalezas del Proyecto

### 7.1 Arquitectura sólida
- **Multitenancy real**: Database-per-Tenant con catálogo maestro de sedes.
- **DDD/Hexagonal híbrida**: Separación clara entre dominio, aplicación e infraestructura.
- **Repository Pattern**: Puertos y adaptadores bien definidos para desacoplamiento.
- **AsyncLocalStorage**: Propagación elegante del tenant sin contaminar firmas de funciones.
- **Pool de conexiones LRU**: `TenantConnectionManager` gestiona hasta 20 conexiones TypeORM dinámicamente.

### 7.2 Seguridad
- **JWT con blacklist**: Tokens invalidados en logout (aunque en memoria, no persistente).
- **4 capas de guards**: Protección profunda (JWT + TenantMatch + RBAC + TenantGuard).
- **Verificación facial de 3 capas**: Anti-spoofing + anti-reutilización de fotos.
- **Hash de contraseñas**: bcrypt con sal automático.
- **Roles diferenciados**: Acceso granular por rol de usuario.

### 7.3 Funcionalidades completas
- **Gestión de horarios matricial**: Vista por instructor, ficha y ambiente.
- **Asistencia en tiempo real**: Server-Sent Events (SSE) para firmas simultáneas.
- **Reconocimiento facial**: Microservicio Python con DeepFace/ArcFace.
- **Solicitudes de cambio**: Flujo de aprobación/rechazo de cambios de horario.
- **Eventos y notificaciones**: Sistema de alertas integrado.
- **Programador de fichas/eventos**: Planificación de actividades institucionales.
- **Dark/Light mode**: Tema oscuro con persistencia en localStorage.

### 7.4 Infraestructura moderna
- **Docker Compose**: Stack completo orquestado (PostgreSQL, Redis, Backend, Frontend, Face Service).
- **Hot reload**: Volúmenes montados para desarrollo en tiempo real.
- **Health checks**: PostgreSQL con healthcheck para dependencias ordenadas.
- **Redis**: Cache distribuida + colas de procesamiento (Bull).

---

## 8. Áreas de Mejora y Riesgos

### 8.1 Deuda técnica

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| **Librerías UI no utilizadas** | Media | Angular Material, PrimeNG y Taiga UI están instaladas pero no se usan. Aumentan el bundle size innecesariamente. |
| **MySQL2 en dependencias** | Media | El proyecto usa PostgreSQL pero mantiene `mysql2` como dependencia (legado de migración). |
| **Prisma instalado pero no usado** | Baja | Prisma está en `package.json` pero no se detecta uso activo; solo TypeORM se usa. |
| **Dualidad de conexiones** | Media | El backend mantiene `DB` (maestra) y `DB2` (legacy). El README aún menciona MySQL en algunos scripts de backup. |
| **Blacklist en memoria** | Media | Los tokens revocados se guardan en un `Set<string>` en memoria. Si el backend se reinicia, los tokens revocados se vuelven válidos. Debería usar Redis. |
| **Credenciales hardcodeadas** | Alta | La contraseña de PostgreSQL (`alejo.v02`) está hardcodeada en `docker-compose.yml` y `.env`. |
| **Tests ausentes** | Media | Jest está configurado pero no se detectan tests ejecutándose activamente en el flujo de desarrollo. |
| **Polling cada 15s** | Baja | La pantalla de usuarios hace polling cada 15 segundos. Para escalabilidad, SSE o WebSockets serían más eficientes. |

### 8.2 Seguridad

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| **Token sin expiración controlada en Redis** | Media | El JWT tiene expiración (`JWT_EXPIRES_IN`) pero la blacklist es en memoria. Un token robado seguiría siendo válido hasta su expiración natural si el backend se reinicia. |
| **PIN de registro por defecto** | Baja | El PIN de registro por defecto es `1234`. Esto debería ser aleatorio o forzado a cambiar en el primer login. |
| **CORS abierto** | Baja | `CORS_ORIGIN` apunta a `localhost:4200` en desarrollo. En producción debe restringirse. |
| **.env con credenciales reales** | Alta | El archivo `.env` real contiene credenciales y aparece en el historial de Git (aunque fue eliminado del repo, sigue en el directorio de trabajo). |

### 8.3 Escalabilidad

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| **Pool de 20 conexiones** | Media | `TENANT_MAX_POOLS=20` puede ser insuficiente si el número de sedes crece significativamente. |
| **Imágenes en disco local** | Baja | Las fotos faciales se guardan en disco del contenedor. En producción debería usar S3/MinIO. |
| **Sin réplica de BD** | Baja | No hay configuración de replicación de PostgreSQL para alta disponibilidad. |
| **SSE sin room management** | Baja | El SSE de asistencia no parece tener manejo de rooms; podría saturar conexiones en clases grandes. |

### 8.4 Mantenibilidad

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| **Componentes muy largos** | Media | `login.component.ts` (701 líneas), `app-layout.component.ts` (695 líneas), `horarios.component.ts` (~1000+ líneas de template). Dificultan mantenimiento y testing. |
| **api.service.ts monolítico** | Baja | Un solo servicio HTTP centralizado con 309 líneas cubre toda la API. Podría fragmentarse por dominio. |
| **Sin tests E2E** | Media | `test:e2e` está en scripts pero no se detecta uso activo. |
| **Documentación desactualizada** | Baja | El README aún menciona MySQL en algunos scripts de backup (`docker/mysql/02_horarios_db.sql`). |

---

## 9. Recomendaciones Priorizadas

### 9.1 Inmediatas (Alta prioridad)

1. **Mover blacklist de JWT a Redis**: Reemplazar el `Set<string>` en memoria por una lista de tokens revocados en Redis con TTL igual al tiempo de expiración del JWT.
2. **Eliminar dependencias no usadas**: Quitar `mysql2`, `prisma` y las librerías UI no utilizadas (`@angular/material`, `primeng`, `@taiga-ui/*`) del `package.json` para reducir el bundle y la superficie de ataque.
3. **Externalizar credenciales**: Usar Docker secrets o variables de entorno inyectadas por el orquestador en producción. Nunca hardcodear contraseñas en `docker-compose.yml`.
4. **Generar PIN aleatorio**: En el primer inicio del sistema, generar un PIN de registro aleatorio y mostrarlo en los logs del backend, en lugar de usar `1234` por defecto.

### 9.2 A corto plazo (Media prioridad)

5. **Refactorizar componentes grandes**: Dividir `login.component.ts`, `app-layout.component.ts` y `horarios.component.ts` en subcomponentes más pequeños y testeables.
6. **Fragmentar api.service.ts**: Crear servicios por dominio (`horarios-api.service.ts`, `asistencia-api.service.ts`, etc.) en lugar de un monolito.
7. **Agregar tests unitarios y E2E**: Cubrir al menos los servicios críticos de autenticación, asistencia y horarios.
8. **Mover fotos a almacenamiento objeto**: Usar S3/MinIO o al menos un volumen compartido persistente para las fotos faciales en producción.
9. **Revisar y eliminar DB2**: Si la base de datos secundaria (`DB2`) ya no es necesaria, eliminar su configuración y sus dependencias.

### 9.3 A largo plazo (Baja prioridad)

10. **Implementar WebSockets para asistencia**: Reemplazar SSE por WebSockets con manejo de rooms para escalabilidad en clases grandes.
11. **Replicación de PostgreSQL**: Configurar streaming replication para alta disponibilidad.
12. **Monitoreo y observabilidad**: Agregar Prometheus metrics, health checks de negocio y tracing distribuido.
13. **CI/CD pipeline**: Automatizar builds, tests y despliegue con GitHub Actions o similar.

---

## 10. Métricas Cualitativas

| Dimensión | Calificación | Justificación |
|-----------|-------------|---------------|
| **Arquitectura** | ⭐⭐⭐⭐☆ | DDD/Hexagonal híbrida con multitenancy real. Bien estructurada pero con algo de dualidad legacy. |
| **Seguridad** | ⭐⭐⭐⭐☆ | JWT + RBAC + verificación facial de 3 capas. Blacklist en memoria es el punto débil. |
| **Escalabilidad** | ⭐⭐⭐☆☆ | Pool de 20 conexiones, sin réplica de BD, imágenes en disco local. Suficiente para < 10 sedes. |
| **Mantenibilidad** | ⭐⭐⭐☆☆ | Componentes largos, falta de tests, dependencias no usadas. La estructura por dominio ayuda. |
| **Funcionalidad** | ⭐⭐⭐⭐⭐ | Completo: horarios, asistencia facial, eventos, solicitudes, notificaciones, multitenancy. |
| **UX/UI** | ⭐⭐⭐⭐☆ | UI custom con Tailwind, dark mode, responsive. Faltan tests de usabilidad. |
| **Infraestructura** | ⭐⭐⭐⭐☆ | Docker Compose bien orquestado, health checks, Redis, hot reload. Falta CI/CD. |
| **Documentación** | ⭐⭐⭐☆☆ | README detallado pero con referencias a MySQL desactualizadas. Falta documentación de API (aunque Swagger está). |

**Promedio general**: ⭐⭐⭐⭐☆ (3.6/5) — Sistema funcional y bien arquitectado con deuda técnica manejable.

---

## 11. Conclusiones

ChronoGest 2.1 es un sistema **funcionalmente completo** y **arquitectónicamente sólido** para la gestión de horarios y asistencia del SENA. Su implementación de multitenancy con Database-per-Tenant es correcta y escalable para el número de sedes esperado. La integración de reconocimiento facial con DeepFace/ArcFace añade un valor diferenciador importante.

Los principales puntos de atención son:
- **Deuda técnica**: dependencias no usadas, componentes largos, falta de tests.
- **Seguridad**: blacklist en memoria, credenciales hardcodeadas, PIN por defecto inseguro.
- **Escalabilidad**: limitada para > 10 sedes o > 1000 usuarios concurrentes sin ajustes.

Con las recomendaciones implementadas, el proyecto puede escalar de manera confiable y mantenerse a largo plazo.

---

*Análisis generado automáticamente. Para dudas o profundización en algún módulo específico, consultar los archivos fuente en el workspace.*
