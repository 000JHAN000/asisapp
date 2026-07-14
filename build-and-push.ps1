#Requires -Version 5.1
<#
.SYNOPSIS
    Script de build y push de imágenes Docker para ChronoGest

.DESCRIPTION
    Construye las imágenes Docker del backend (NestJS), frontend (Angular/nginx)
    y face-service (Python FastAPI) con el target 'prod', las etiqueta con el
    formato registry/prefix/nombre:tag y las sube al registry indicado.

.PARAMETER Registry
    URL del registry de Docker. Por defecto: docker.io

.PARAMETER Prefix
    Prefijo del nombre de imagen. Por defecto: chronogest

.PARAMETER Tag
    Tag de la imagen. Por defecto: latest

.EXAMPLE
    .\build-and-push.ps1
    # Usa los valores por defecto: docker.io/chronogest/nombre:latest

.EXAMPLE
    .\build-and-push.ps1 -Registry "myregistry.azurecr.io" -Prefix "cg" -Tag "v1.2.3"
    # Etiqueta: myregistry.azurecr.io/cg/nombre:v1.2.3

.EXAMPLE
    .\build-and-push.ps1 -Tag "$(Get-Date -Format 'yyyyMMdd')-$(git rev-parse --short HEAD)"
    # Tag basado en fecha y commit corto de git
#>

param(
    [string]$Registry = "docker.io",
    [string]$Prefix   = "chronogest",
    [string]$Tag      = "latest"
)

$ErrorActionPreference = "Stop"

# ── Colores para la consola ───────────────────────────────────
function Write-Header($msg) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Ok($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Write-Error($msg) {
    Write-Host "  [ERROR] $msg" -ForegroundColor Red
}

# ── Validaciones ─────────────────────────────────────────────
Write-Header "Validando entorno"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker no está instalado o no está en el PATH."
    exit 1
}
Write-Ok "Docker detectado: $(docker --version)"

# Verificar si estamos logueados en el registry (solo advertencia)
$registryHost = if ($Registry -eq "docker.io") { "Docker Hub" } else { $Registry }
Write-Host "  Registry destino: $registryHost" -ForegroundColor Yellow

# ── Configuración ────────────────────────────────────────────
$services = @(
    @{ Name = "backend";      Context = "./Asistencia-Backend";   Dockerfile = "Dockerfile"; Target = "prod" },
    @{ Name = "frontend";     Context = "./frontend";             Dockerfile = "Dockerfile"; Target = "prod" },
    @{ Name = "face-service"; Context = "./python-face-service";  Dockerfile = "Dockerfile"; Target = "" }
)

$builtImages = @()

# ── Build ─────────────────────────────────────────────────────
Write-Header "Iniciando BUILD de imágenes"
Write-Host "  Registry : $Registry"
Write-Host "  Prefix   : $Prefix"
Write-Host "  Tag      : $Tag"
Write-Host ""

foreach ($svc in $services) {
    $imageName = "$Registry/$Prefix/$($svc.Name):$Tag"
    $builtImages += $imageName

    Write-Header "Construyendo: $($svc.Name)"
    Write-Host "  Imagen destino: $imageName" -ForegroundColor Yellow
    Write-Host "  Contexto: $($svc.Context)"
    Write-Host "  Dockerfile: $($svc.Dockerfile)"
    if ($svc.Target) {
        Write-Host "  Target: $($svc.Target)"
    }
    Write-Host ""

    $buildArgs = @(
        "build",
        "--tag", $imageName,
        "--file", "$($svc.Context)/$($svc.Dockerfile)",
        "--platform", "linux/amd64"
    )

    if ($svc.Target) {
        $buildArgs += "--target"
        $buildArgs += $svc.Target
    }

    $buildArgs += $svc.Context

    docker @buildArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falló el build de $($svc.Name). Abortando."
        exit 1
    }

    Write-Ok "Build exitoso: $imageName"
}

# ── Listado de imágenes construidas ────────────────────────────
Write-Header "Imágenes construidas"
foreach ($img in $builtImages) {
    Write-Host "  • $img" -ForegroundColor Green
}

# ── Push ─────────────────────────────────────────────────────
Write-Header "Iniciando PUSH al registry"

foreach ($img in $builtImages) {
    Write-Host "`n  Subiendo: $img ..." -ForegroundColor Yellow
    docker push $img
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falló el push de $img."
        exit 1
    }
    Write-Ok "Push exitoso: $img"
}

# ── Resumen final ──────────────────────────────────────────────
Write-Header "Resumen final"
Write-Ok "Todas las imágenes fueron construidas y subidas correctamente."
Write-Host "`n  Imágenes en registry ($registryHost):" -ForegroundColor Cyan
foreach ($img in $builtImages) {
    Write-Host "    → $img" -ForegroundColor White
}
Write-Host ""
