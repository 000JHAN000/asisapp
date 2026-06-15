import { Component, OnInit, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { DIAS_LABELS } from '../../../core/models/user.model';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-solicitudes',
  imports: [FormsModule, DatePipe, TitleCasePipe, UpperCasePipe, LucideAngularModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Solicitudes de Cambio</h2>
        <p class="text-muted text-sm">Gestión de solicitudes de modificación de horarios enviadas por instructores</p>
      </div>
    </div>

    <!-- Filtro de estado (tabs) -->
    <div class="filter-row mt-4">
      <button class="filter-btn" [class.active]="filtroEstado() === 'pendiente'" (click)="filtroEstado.set('pendiente')">
        <lucide-icon name="clock" [size]="13"></lucide-icon>
        Pendientes
        @if (pendientes().length > 0) {
          <span class="filter-count">{{ pendientes().length }}</span>
        }
      </button>
      <button class="filter-btn" [class.active]="filtroEstado() === 'aprobado'" (click)="filtroEstado.set('aprobado')">
        <lucide-icon name="check-circle" [size]="13"></lucide-icon>
        Aprobadas
      </button>
      <button class="filter-btn" [class.active]="filtroEstado() === 'rechazado'" (click)="filtroEstado.set('rechazado')">
        <lucide-icon name="x-circle" [size]="13"></lucide-icon>
        Rechazadas
      </button>
      <button class="filter-btn" [class.active]="filtroEstado() === 'cancelada'" (click)="filtroEstado.set('cancelada')">
        <lucide-icon name="ban" [size]="13"></lucide-icon>
        Canceladas
      </button>
      <button class="filter-btn" [class.active]="filtroEstado() === 'todas'" (click)="filtroEstado.set('todas')">
        Todas
      </button>
    </div>

    <!-- Lista de solicitudes -->
    <div class="solicitudes-container mt-4">
      @if (!solicitudesFiltradas().length) {
        <div class="empty-state">
          <lucide-icon name="inbox" [size]="40" style="color:var(--border)"></lucide-icon>
          <p class="text-muted mt-2">No hay solicitudes {{ filtroEstado() !== 'todas' ? filtroEstado() + 's' : '' }}</p>
        </div>
      }

      @for (s of solicitudesFiltradas(); track s.id) {
      <div class="solicitud-card" [class.pendiente]="s.estado === 'pendiente'">
        <!-- Encabezado -->
        <div class="sol-card-header">
          <div class="instructor-info">
            <div class="instructor-avatar">{{ s.instructor?.nombre?.[0] }}{{ s.instructor?.apellido?.[0] }}</div>
            <div>
              <div class="instructor-name">{{ s.instructor?.nombre }} {{ s.instructor?.apellido }}</div>
              <div class="sol-meta text-xs text-muted">
                <lucide-icon name="calendar" [size]="11"></lucide-icon>
                {{ s.fecha | date:'dd MMM yyyy, HH:mm' }}
              </div>
            </div>
          </div>
          <span class="estado-badge" [class]="s.estado">{{ s.estado | titlecase }}</span>
        </div>

        <!-- Comparación de horarios -->
        <div class="horarios-compare">
          <div class="horario-side actual">
            <div class="side-label">
              <lucide-icon name="calendar" [size]="11"></lucide-icon>
              Horario Actual
            </div>
            <div class="side-day">{{ LABELS[s.horarioActual?.diaSemana] }}</div>
            <div class="side-time">{{ s.horarioActual?.horaInicio?.slice(0,5) }} — {{ s.horarioActual?.horaFin?.slice(0,5) }}</div>
            <div class="side-detail">
              <lucide-icon name="building-2" [size]="12"></lucide-icon>
              {{ s.horarioActual?.ambiente?.nombre || 'Sin ambiente' }}
            </div>
            <div class="side-detail">
              <lucide-icon name="book-open" [size]="12"></lucide-icon>
              Ficha {{ s.horarioActual?.ficha?.codigo || '—' }}
            </div>
          </div>

          <div class="compare-arrow">
            <lucide-icon name="arrow-right" [size]="24" style="color:var(--blue)"></lucide-icon>
          </div>

          <div class="horario-side propuesta">
            @if (s.horarioPropuesto) {
              <div class="side-label" style="color:var(--blue);">
                <lucide-icon name="git-branch" [size]="11"></lucide-icon>
                Nueva Propuesta
              </div>
              <div class="side-day" style="color:var(--blue)">{{ LABELS[s.horarioPropuesto.diaSemana] || s.horarioPropuesto.diaSemana }}</div>
              <div class="side-time">{{ s.horarioPropuesto.horaInicio }} — {{ s.horarioPropuesto.horaFin }}</div>
              @if (s.horarioPropuesto.jornada) {
                <div class="side-detail">
                  <lucide-icon name="sun" [size]="12"></lucide-icon>
                  Jornada {{ s.horarioPropuesto.jornada }}
                </div>
              }
              @if (s.horarioPropuesto.ambienteId) {
                <div class="side-detail">
                  <lucide-icon name="building-2" [size]="12"></lucide-icon>
                  {{ ambienteNombre(s.horarioPropuesto.ambienteId) }}
                </div>
              }
            } @else {
              <div class="side-label">Sin propuesta específica</div>
              <div class="text-muted text-sm mt-2">El instructor no especificó un horario alternativo concreto.</div>
            }
          </div>
        </div>

        <!-- Motivo -->
        @if (s.razon) {
        <div class="motivo-section">
          <div class="motivo-label"><lucide-icon name="message-square" [size]="13"></lucide-icon> Motivo</div>
          <div class="motivo-text">"{{ s.razon }}"</div>
        </div>
        }

        <!-- Adjunto (Archivo o Imagen) -->
        @if (s.archivoAdjuntoUrl) {
        <div class="adjunto-section">
          <div class="adjunto-label"><lucide-icon name="paperclip" [size]="13"></lucide-icon> Soporte adjunto</div>
          @if (esImagen(s.archivoAdjuntoUrl)) {
            <!-- Previsualización de imagen -->
            <div class="img-preview-wrap">
              <img [src]="urlCompleta(s.archivoAdjuntoUrl)" class="adjunto-img"
                   (click)="abrirImagen(s.archivoAdjuntoUrl)"
                   alt="Adjunto soporte" title="Clic para ampliar">
              <div class="img-overlay" (click)="abrirImagen(s.archivoAdjuntoUrl)">
                <lucide-icon name="zoom-in" [size]="20"></lucide-icon>
                Ampliar
              </div>
            </div>
          } @else {
            <!-- Archivo no imagen (PDF, DOC, etc) -->
            <a [href]="urlCompleta(s.archivoAdjuntoUrl)" target="_blank" class="file-download-btn">
              <lucide-icon name="download" [size]="14"></lucide-icon>
              Descargar archivo adjunto
              <span class="file-ext">{{ getExtension(s.archivoAdjuntoUrl) | uppercase }}</span>
            </a>
          }
        </div>
        }

        <!-- Respuesta admin (si ya fue respondida) -->
        @if (s.respuestaAdmin) {
        <div class="respuesta-admin">
          <lucide-icon name="shield-check" [size]="13"></lucide-icon>
          <strong>Respuesta:</strong> {{ s.respuestaAdmin }}
        </div>
        }

        <!-- Acciones (solo si está pendiente) -->
        @if (s.estado === 'pendiente') {
        <div class="acciones-section">
          <div class="form-group" style="flex:1; min-width:200px;">
            <input class="form-control" [(ngModel)]="respuestas[s.id]" placeholder="Comentario para el instructor (opcional)...">
          </div>
          <button class="btn-aprobar" (click)="responder(s, 'aprobado')">
            <lucide-icon name="check-circle" [size]="15"></lucide-icon>
            Aprobar y Aplicar
          </button>
          <button class="btn-rechazar" (click)="responder(s, 'rechazado')">
            <lucide-icon name="x-circle" [size]="15"></lucide-icon>
            Rechazar
          </button>
        </div>
        }
        <!-- Eliminar registro (siempre disponible) -->
        <div style="display:flex;justify-content:flex-end;margin-top:8px;">
          <button class="btn-eliminar" (click)="eliminar(s)" title="Eliminar este registro">
            <lucide-icon name="trash-2" [size]="13"></lucide-icon>
            Eliminar registro
          </button>
        </div>
      </div>
      }
    </div>

    <!-- LIGHTBOX de imagen -->
    @if (imagenAmpliada()) {
    <div class="lightbox-overlay" (click)="imagenAmpliada.set(null)">
      <div class="lightbox-box" (click)="$event.stopPropagation()">
        <button class="lightbox-close" (click)="imagenAmpliada.set(null)">
          <lucide-icon name="x" [size]="22"></lucide-icon>
        </button>
        <img [src]="urlCompleta(imagenAmpliada()!)" class="lightbox-img" alt="Vista ampliada">
        <a [href]="urlCompleta(imagenAmpliada()!)" target="_blank" class="lightbox-download">
          <lucide-icon name="download" [size]="14"></lucide-icon> Descargar
        </a>
      </div>
    </div>
    }
  `,
  styles: [`
    .page-header { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px; }
    .header-stats { display:flex;gap:8px; }
    .stat-badge { padding:4px 12px;border-radius:10px;font-size:12px;font-weight:700; }
    .stat-badge.pendientes { background:#fef3c7;color:#92400e;border:1px solid #fde68a; }
    .stat-badge.total { background:#f1f5f9;color:#475569;border:1px solid #e2e8f0; }

    /* Filtros tabs */
    .filter-row { display:flex;gap:4px;flex-wrap:wrap;border-bottom:2px solid var(--border);padding-bottom:0;margin-bottom:0; }
    .filter-btn { padding:8px 14px;border:none;background:transparent;color:var(--text-muted);cursor:pointer;font-size:13px;font-weight:600;transition:all .15s;display:flex;align-items:center;gap:5px;border-bottom:2px solid transparent;margin-bottom:-2px;border-radius:0; }
    .filter-btn:hover { color:var(--text);background:var(--surface2); }
    .filter-btn.active { color:var(--navy);border-bottom-color:var(--navy);background:transparent; }
    .filter-count { background:var(--navy);color:#fff;border-radius:10px;padding:1px 7px;font-size:11px; }

    /* Cards de solicitudes */
    .solicitudes-container { display:flex;flex-direction:column;gap:16px; }
    .empty-state { display:flex;flex-direction:column;align-items:center;padding:60px 20px;background:var(--surface);border-radius:12px;border:1px solid var(--border); }

    .solicitud-card { background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;box-shadow:var(--shadow);transition:border-color .2s; }
    .solicitud-card.pendiente { border-left:4px solid #f59e0b; }

    /* Header de la card */
    .sol-card-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px; }
    .instructor-info { display:flex;align-items:center;gap:12px; }
    .instructor-avatar { width:40px;height:40px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex-shrink:0; }
    .instructor-name { font-weight:700;font-size:15px;color:var(--text); }
    .sol-meta { display:flex;align-items:center;gap:4px;margin-top:2px; }

    /* Estado badge */
    .estado-badge { padding:4px 12px;border-radius:10px;font-size:12px;font-weight:700; }
    .estado-badge.pendiente { background:#fef3c7;color:#92400e; }
    .estado-badge.aprobado { background:#dcfce7;color:#166534; }
    .estado-badge.rechazado { background:#fee2e2;color:#991b1b; }
    .estado-badge.cancelada { background:#f1f5f9;color:#64748b; }

    /* Comparación horarios */
    .horarios-compare { display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;background:var(--surface2);border-radius:10px;padding:16px;margin-bottom:16px; }
    @media (max-width:600px) { .horarios-compare { grid-template-columns:1fr; } .compare-arrow { transform:rotate(90deg); } }
    .compare-arrow { display:flex;justify-content:center; }
    .horario-side { padding:12px;border-radius:8px; }
    .horario-side.actual { background:#f8fafc;border:1px solid #e2e8f0; }
    .horario-side.propuesta { background:#eff6ff;border:1px solid #bfdbfe; }
    .side-label { font-size:10px;text-transform:uppercase;font-weight:800;color:#64748b;margin-bottom:6px; }
    .side-day { font-size:16px;font-weight:800;color:var(--text); }
    .side-time { font-size:14px;font-weight:700;color:var(--navy);margin:2px 0 6px; }
    .side-detail { font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:5px;margin-top:3px; }

    /* Motivo */
    .motivo-section { background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:12px; }
    .motivo-label { font-size:11px;color:#92400e;font-weight:700;text-transform:uppercase;display:flex;align-items:center;gap:5px;margin-bottom:4px; }
    .motivo-text { font-size:13px;color:#78350f;font-style:italic; }

    /* Adjunto */
    .adjunto-section { margin-bottom:12px; }
    .adjunto-label { font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;display:flex;align-items:center;gap:5px;margin-bottom:8px; }
    .img-preview-wrap { position:relative;display:inline-block;cursor:pointer; }
    .adjunto-img { max-width:260px;max-height:180px;object-fit:cover;border-radius:8px;border:2px solid var(--border);display:block; }
    .img-overlay { position:absolute;inset:0;background:rgba(0,0,0,.4);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;gap:4px;opacity:0;transition:.2s; }
    .img-preview-wrap:hover .img-overlay { opacity:1; }
    .file-download-btn { display:inline-flex;align-items:center;gap:8px;background:#f1f5f9;border:1.5px solid #cbd5e1;color:var(--navy);padding:8px 14px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;transition:.15s; }
    .file-download-btn:hover { background:#e2e8f0; }
    .file-ext { background:var(--navy);color:#fff;border-radius:4px;padding:1px 6px;font-size:10px; }

    /* Respuesta */
    .respuesta-admin { display:flex;align-items:center;gap:6px;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;font-size:13px;color:#166534;margin-bottom:12px; }

    /* Acciones */
    .acciones-section { display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--border);margin-top:4px; }
    .btn-aprobar { display:flex;align-items:center;gap:6px;background:#dcfce7;border:1.5px solid #86efac;color:#166534;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;transition:.15s; }
    .btn-aprobar:hover { background:#bbf7d0; }
    .btn-rechazar { display:flex;align-items:center;gap:6px;background:#fee2e2;border:1.5px solid #fca5a5;color:#991b1b;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;transition:.15s; }
    .btn-rechazar:hover { background:#fecaca; }
    .btn-eliminar { display:flex;align-items:center;gap:5px;background:transparent;border:1px solid #e2e8f0;color:#94a3b8;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;transition:.15s; }
    .btn-eliminar:hover { background:#fee2e2;border-color:#fca5a5;color:#991b1b; }

    /* Lightbox */
    .lightbox-overlay { position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px; }
    .lightbox-box { position:relative;background:#000;border-radius:12px;overflow:hidden;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;align-items:center; }
    .lightbox-close { position:absolute;top:12px;right:12px;background:rgba(0,0,0,.6);border:none;color:#fff;cursor:pointer;border-radius:50%;padding:6px;display:flex;align-items:center;justify-content:center;z-index:10; }
    .lightbox-img { max-width:90vw;max-height:80vh;object-fit:contain;display:block; }
    .lightbox-download { display:flex;align-items:center;gap:6px;color:#fff;text-decoration:none;padding:10px 16px;font-size:13px;background:rgba(255,255,255,.1); }
    .lightbox-download:hover { background:rgba(255,255,255,.2); }
  `],
})
export class AdminSolicitudesComponent implements OnInit {
  readonly LABELS = DIAS_LABELS;
  readonly BASE_URL = 'http://localhost:3001';

  solicitudes = signal<any[]>([]);
  ambientesList = signal<any[]>([]);
  filtroEstado = signal<string>('pendiente');
  imagenAmpliada = signal<string | null>(null);
  respuestas: Record<number, string> = {};

  pendientes = computed(() => this.solicitudes().filter(s => s.estado === 'pendiente'));

  solicitudesFiltradas = computed(() => {
    if (this.filtroEstado() === 'todas') return this.solicitudes();
    return this.solicitudes().filter(s => s.estado === this.filtroEstado());
  });

  // Ya no necesario como array, los filtros están en el template directamente
  filtroOpciones = [];

  private toast = inject(ToastService);

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargar();
    this.api.getAmbientes().subscribe(a => this.ambientesList.set(a));
  }

  cargar() {
    this.api.getSolicitudes().subscribe(s => {
      this.solicitudes.set([...s]);
      this.cdr.detectChanges(); // Forzar actualización de vista
    });
  }

  ambienteNombre(id: number): string {
    const a = this.ambientesList().find(x => x.id === +id);
    return a ? a.nombre : `Ambiente #${id}`;
  }

  esImagen(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  }

  getExtension(url: string): string {
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    return match ? match[1] : 'archivo';
  }

  urlCompleta(url: string): string {
    if (!url) return '';
    // Las URLs con emojis o caracteres extraños necesitan ser encodeadas
    const encodedUrl = encodeURI(url);
    return url.startsWith('http') ? encodedUrl : `${this.BASE_URL}${encodedUrl.startsWith('/') ? '' : '/'}${encodedUrl}`;
  }

  abrirImagen(url: string) {
    this.imagenAmpliada.set(url);
  }

  responder(s: any, estado: string) {
    const resp = this.respuestas[s.id];
    this.api.responderSolicitud(s.id, estado, resp || undefined).subscribe({
      next: () => {
        this.respuestas[s.id] = '';
        this.cargar();
        const label = estado === 'aprobada' ? 'aprobada' : 'rechazada';
        this.toast.success(
          `Solicitud ${label}`,
          estado === 'aprobada'
            ? 'El cambio fue aprobado y aplicado automáticamente al horario del instructor.'
            : 'El instructor fue notificado del rechazo.',
        );
      },
      error: (e) => this.toast.error('Error al responder', e?.error?.message ?? 'No se pudo procesar la respuesta.'),
    });
  }

  eliminar(s: any) {
    if (!confirm('¿Eliminar este registro de solicitud permanentemente?')) return;
    this.api.deleteSolicitud(s.id).subscribe({
      next: () => {
        this.solicitudes.set([...this.solicitudes().filter(x => x.id !== s.id)]);
        this.toast.success('Solicitud eliminada', 'El registro fue eliminado del sistema.');
      },
      error: (e) => this.toast.error('Error al eliminar', e?.error?.message ?? 'No se pudo eliminar la solicitud.'),
    });
  }
}

