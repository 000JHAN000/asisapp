# ChronoGest 2.1

Sistema de gestión de horarios para el SENA — Angular 21 + NestJS 11 + PostgreSQL 16.

---

## Tabla de contenidos

1. [Requisitos previos](#1-requisitos-previos)
2. [Inicio rápido desde cero](#2-inicio-rápido-desde-cero)
3. [Levantar el sistema con Docker](#3-levantar-el-sistema-con-docker)
4. [Configuración de variables de entorno](#4-configuración-de-variables-de-entorno)
5. [Migración y respaldo de datos](#5-migración-y-respaldo-de-datos)
6. [Comandos útiles de desarrollo](#6-comandos-útiles-de-desarrollo)
7. [Guía de inicio para el administrador](#7-guía-de-inicio-para-el-administrador)

---

## 1. Requisitos previos

Instala lo siguiente antes de continuar:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| **Docker Desktop** | 4.x | https://www.docker.com/products/docker-desktop |
| **Node.js** | 20 LTS | https://nodejs.org |
| **npm** | 9+ | Incluido con Node.js |

> PostgreSQL **no necesita instalarse** — Docker lo maneja automáticamente.

---

## 2. Inicio rápido desde cero

Sigue estos pasos en orden para levantar todo el stack por primera vez.

### Paso 1 — Entrar al proyecto

```bash
cd Chronogest-2.1-V
```

> Si tu carpeta tiene otro nombre, usa ese. Ejemplo: `cd "Nueva carpeta"`

### Paso 2 — Levantar la infraestructura (Docker)

```bash
# Base de datos PostgreSQL, Redis, Backend y Face Service
docker-compose up -d

# Verificar que todos los contenedores estén activos
docker ps
```

Deberías ver 5 contenedores activos:
| Contenedor | Puerto | Descripción |
|---|---|---|
| `chronogest_db` | `5440` | PostgreSQL 16 |
| `chronogest_redis` | `6379` | Redis 7 |
| `chronogest_backend` | `3001` | API NestJS |
| `chronogest_face_service` | `5000` | Reconocimiento facial (Python) |
| `chronogest_frontend` | `4200` | Angular (solo si usas `--profile full`) |

> La primera vez que arranca, TypeORM crea automáticamente las tablas en la base de datos.

### Paso 3 — Levantar el frontend (localmente, recomendado)

```bash
# Abrir otra terminal y entrar a la carpeta del frontend
cd frontend

# Instalar dependencias (solo la primera vez)
npm install

# Iniciar servidor de desarrollo
npm start
```

La aplicación queda disponible en: **http://localhost:4200**

> El frontend apunta automáticamente al backend en `http://localhost:3001/api`.

---

## 3. Levantar el sistema con Docker (resumen)

```bash
# Iniciar solo backend + BD + Redis + Face Service
docker-compose up -d

# Stack completo incluyendo frontend en Docker
docker-compose --profile full up -d

# Detener todo (los datos se conservan)
docker-compose down

# Reconstruir imágenes después de cambios en el código
docker-compose up -d --build

# Reiniciar solo el backend
docker restart chronogest_backend

# Reset completo (borra base de datos y volúmenes)
docker-compose down -v
```

> Por defecto el frontend **no** se incluye en Docker — se recomienda correrlo localmente con `npm start` para mejor rendimiento en desarrollo.

---

## 4. Configuración de variables de entorno

### Para desarrollo local (sin Docker)

Edita `backend/.env`:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=horarios_db

DB2_HOST=localhost
DB2_PORT=3306
DB2_USER=root
DB2_PASSWORD=
DB2_NAME=proyecto_formativo_db

JWT_SECRET=chronogest_sena_jwt_secret_2024_very_secure_key_abc123
JWT_EXPIRES_IN=24h

EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password_de_gmail
CORS_ORIGIN=http://localhost:4200
UPLOAD_DIR=uploads
```

### Para Docker

Edita `backend/.env.docker` (el host de la BD es `db`, no `localhost`):

```env
DB_HOST=db
DB_PASSWORD=chronogest2024
DB2_HOST=db
DB2_PASSWORD=chronogest2024
```

## 5. Migración y respaldo de datos

### Exportar datos actuales (hacer backup)

```bash
# Backup de horarios_db (datos del sistema)
docker exec chronogest_db mysqldump -u root -pchronogest2024 horarios_db > docker/mysql/02_horarios_db.sql

# Backup de proyecto_formativo_db (datos SENA)
docker exec chronogest_db mysqldump -u root -pchronogest2024 proyecto_formativo_db > docker/mysql/02_proyecto_formativo_db.sql
```

### Restaurar datos en un equipo nuevo

Los archivos `.sql` guardados en `docker/mysql/` se importan **automáticamente** al hacer `docker-compose up` por primera vez en un equipo nuevo.

Si ya hay un contenedor corriendo y quieres importar manualmente:

```bash
# Importar horarios_db
Get-Content docker\mysql\02_horarios_db.sql | docker exec -i chronogest_db mysql -u root -pchronogest2024 horarios_db

# Importar proyecto_formativo_db
Get-Content docker\mysql\02_proyecto_formativo_db.sql | docker exec -i chronogest_db mysql -u root -pchronogest2024 proyecto_formativo_db
```

> **Windows PowerShell:** usar `Get-Content archivo.sql |` en lugar de `<`
> **Linux / Mac:** usar `docker exec -i chronogest_db mysql ... < archivo.sql`

### Acceder directamente a MySQL dentro de Docker

```bash
docker exec -it chronogest_db mysql -u root -pchronogest2024

# Dentro de MySQL:
SHOW DATABASES;
USE horarios_db;
SHOW TABLES;
SELECT * FROM administradores;
```

---

## 6. Comandos útiles de desarrollo

### Backend (NestJS)

```bash
cd Asistencia-Backend

# Desarrollo con hot-reload (sin Docker)
npm run start:dev

# Compilar para producción
npm run build

# Ejecutar compilado de producción
npm run start:prod
```

### Frontend (Angular)

```bash
cd frontend

# Desarrollo local
npm start

# Build de producción
npm run build

# Tests
npm test
```

### Docker — monitoreo y diagnóstico

```bash
# Estado de todos los contenedores
docker ps

# Logs en tiempo real
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
docker-compose logs -f face-service

# Entrar al contenedor del backend (bash)
docker exec -it chronogest_backend sh

# Ver uso de recursos
docker stats
```

### Control del stack completo

```bash
# Reiniciar todos los servicios
docker-compose restart

# Detener todo (conserva datos)
docker-compose down

# Reset completo (borra volúmenes y base de datos)
docker-compose down -v
```

### Solución a problemas comunes

| Problema | Solución |
|---|---|
| `ng no se reconoce` | Ejecutar `npm install` en la carpeta `frontend/` |
| `npm ci` falla en Docker | Se usa `npm install` — no requiere `package-lock.json` |
| Backend no conecta a BD | Esperar que `chronogest_db` esté `(healthy)` antes de reiniciar el backend |
| Tablas no se crean | Reiniciar el backend: `docker restart chronogest_backend` |
| Puerto 5440 ocupado | Cambiar `DB_PORT` en `.env` y en `docker-compose.yml` |
| Reset completo de BD | `docker-compose down -v` luego `docker-compose up -d` |

---

## 7. Guía de inicio para el administrador

Al iniciar ChronoGest por primera vez con la base de datos vacía, sigue este orden para que el sistema funcione correctamente.

### Paso 1 — Crear la cuenta de administrador

En la pantalla de login, haz clic en **"Registrarse"**.

- El sistema pedirá un **PIN de registro**. El PIN por defecto es: **`1234`**
- Selecciona el rol **Administrador**
- Completa los datos y crea tu cuenta

> Para cambiar el PIN: ir a **Configuración → PIN de Registro**

---

### Paso 2 — Configurar los Ambientes

Los ambientes son los salones o espacios físicos donde se dictan las clases.

**Menú:** `Formativo → Ambientes`

Datos a ingresar por cada ambiente:
- Nombre del ambiente (ej: "Aula 101", "Lab Sistemas")
- Capacidad
- Tipo (aula, laboratorio, taller, etc.)

> Sin ambientes configurados, no se pueden asignar horarios.

---

### Paso 3 — Crear las Fichas de Formación

Las fichas representan los grupos de aprendices y su programa de formación.

**Menú:** `Formativo → Fichas`

Datos requeridos:
- Código de ficha (número SENA)
- Nombre del programa
- Área de formación
- Fechas de inicio y fin

---

### Paso 4 — Registrar los Instructores

**Menú:** `Usuarios → Instructores` o pidiéndole a cada instructor que se registre con el PIN.

Para registrar instructores manualmente como administrador, crea sus cuentas desde **Usuarios**.

Configuraciones especiales por instructor:
- **Líder de área:** activa desde el botón de edición del instructor. Define su área de liderazgo.
- **Transversal:** instructores que rotan entre fichas según disponibilidad. Se activa en el perfil del instructor.

---

### Paso 5 — Crear los Horarios

Con ambientes, fichas e instructores listos, ya puedes crear horarios.

**Menú:** `Horarios`

El asistente de nuevo horario permite configurar:
- **Días de la semana** activos para ese horario
- **Jornada** (Mañana 07:00–12:00 / Tarde 13:00–17:00 / Noche 18:00–20:00)
- **Hora de inicio y fin** exacta
- **Ficha** asignada
- **Instructor** asignado
- **Ambiente** asignado

> Se puede usar "Aplicar a todos los días" para configurar varios días con los mismos datos.

---

### Paso 6 — Activar un horario (iniciar clase)

Cuando un instructor llega a clase, el administrador (o el instructor desde su menú) activa el horario:

1. Ir a **Horarios** y buscar el horario correspondiente
2. Hacer clic en el botón **▶ Play** del horario
3. Seleccionar el ambiente donde se dictará la clase
4. El horario queda marcado como **Activo** (visible en tiempo real para todos)

Los horarios se cierran automáticamente cuando llega su hora de fin.

---

### Paso 7 — Programar Eventos

Los eventos son actividades especiales que afectan a las fichas (festivos, evaluaciones, actividades institucionales).

**Menú:** `Programador de Eventos`

- Define el nombre, tipo y fechas del evento
- Selecciona las fichas participantes
- El evento aparece como notificación en los horarios de esas fichas durante sus fechas

---

### Paso 8 — Gestionar Solicitudes de Cambio

Los instructores pueden solicitar cambios de horario, ambiente o jornada.

**Menú:** `Solicitudes`

Como administrador:
- Revisar las solicitudes pendientes
- Aprobar o rechazar con un comentario
- Las notificaciones llegan automáticamente al instructor

---

### Resumen de flujo inicial

```
1. Crear cuenta Admin (PIN: 1234)
        ↓
2. Crear Ambientes (salones)
        ↓
3. Crear Fichas (grupos)
        ↓
4. Registrar Instructores
        ↓
5. Crear Horarios (días + jornada + ficha + instructor + ambiente)
        ↓
6. ✅ Sistema listo para operar
```

---

## Arquitectura del sistema

```
Chronogest-2.1-V/
├── frontend/          Angular 21 — http://localhost:4200
├── backend/           NestJS 11  — http://localhost:3001/api
├── docker-compose.yml Orquestador de servicios
└── docker/
    ├── mysql/              Scripts legacy de MySQL
    └── postgres/init/      Scripts de inicialización PostgreSQL
        ├── 01-create-tenant-dbs.sql      # Crea BDs por sede
        ├── 02-create-tenants-table.sql   # Catálogo maestro de sedes
        └── 03-migrate-users-tenant.sql   # Usuarios existentes -> Yamborot
```

**Base de datos:**
- `sena_db` — BD maestra. Contiene el catálogo de tenants/sedes en la tabla `tenants` y los usuarios en `cg_usuarios`.
- `sena_db_yamborot` — BD de la sede Yamborot (Database-per-Tenant).
- `sena_db_centro_comercio` — BD de la sede Centro Comercio y Servicio (Database-per-Tenant).

> **Nota:** actualmente el catálogo de sedes y las BDs físicas están creadas, pero los repositorios de negocio siguen usando `sena_db`. El aislamiento completo por sede se activará en una fase posterior.
>
> **Aplicar en un entorno existente:** los scripts de `docker/postgres/init` solo se ejecutan automáticamente la primera vez que se crea el volumen de PostgreSQL. Si ya tienes datos, ejecuta manualmente los scripts o haz `docker-compose down -v` para recrear todo (⚠️ borra los datos actuales).

**Sede asignada por usuario:**
- Cada usuario tiene una sede asignada en el campo `tenant_slug` de `cg_usuarios`.
- **Usuarios existentes**: migrados a `yamborot` por defecto.
- **Nuevos usuarios**: se registran sin sede. El administrador debe asignarles una sede desde la pantalla **Usuarios** para que puedan iniciar sesión.
- El login detecta automáticamente la sede del usuario; no hay selector en el login.
- El frontend envía el header `x-tenant-id` en cada petición.
- El nombre de la sede se muestra como un badge en la barra superior.

**Roles de usuario:**
- **Administrador** — Acceso completo al sistema
- **Instructor** — Ve sus horarios, registra competencias, crea solicitudes de cambio
- **Aprendiz** — Ve los horarios de su ficha

---

*ChronoGest 2.1 — SENA Centro de Diseño Tecnológico Industrial*
