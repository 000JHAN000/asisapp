import { Component, OnInit, signal, viewChild, ElementRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AsistenciaService } from '../../../core/services/asistencia/asistencia.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { FaceCaptureComponent } from '../../../shared/components/face-capture.component';
import { LucideAngularModule } from 'lucide-angular';


@Component({
  selector: 'app-aprendiz-firma',
  imports: [LucideAngularModule, FaceCaptureComponent, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Registro de Asistencia</h2>
        <p class="text-muted text-sm">Verificación facial + firma digital</p>
      </div>
    </div>

    @if (!sesion()) {
      <div class="card mt-4 empty-card">
        <lucide-icon name="clock" [size]="40" style="opacity:.3"></lucide-icon>
        <h3>No hay sesión activa</h3>
        <p class="text-muted text-sm">Tu instructor aún no ha iniciado la asistencia para tu ficha. Vuelve más tarde.</p>
      </div>

      <!-- Clases recientes sin marcar: permite solicitar justificación -->
      <div class="card mt-3">
        <h4 class="section-subtitle">Mis clases recientes</h4>
        @if (misSesiones().length === 0) {
          <p class="text-muted text-sm mt-2">No hay clases registradas todavía.</p>
        } @else {
          <div class="mis-sesiones-list mt-2">
            @for (s of misSesiones(); track s.id) {
              <div class="sesion-row">
                <div class="sesion-info">
                  <span class="sesion-fecha">{{ s.fecha }}</span>
                  <span class="sesion-hora">{{ s.horaInicio }} — {{ s.horaFin }}</span>
                </div>
                @if (s.miRegistro?.estado === 'presente') {
                  <span class="badge presente">Presente</span>
                } @else if (s.miRegistro?.estado === 'falla_justificada') {
                  <span class="badge falla">Falla Just.</span>
                } @else if (s.miRegistro?.estado === 'justificacion_pendiente') {
                  <span class="badge pendiente">Justificación pendiente</span>
                } @else if (s.estado === 'activa') {
                  <span class="badge pendiente">En curso</span>
                } @else if (s.miRegistro?.estado === 'falla_injustificada') {
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="badge falla-injustificada">Falla No Just.</span>
                    <button class="btn btn-outline btn-sm" (click)="abrirJustificacion(s)">
                      <lucide-icon name="file-plus" [size]="12"></lucide-icon> Justificar
                    </button>
                  </div>
                } @else {
                  <button class="btn btn-outline btn-sm" (click)="abrirJustificacion(s)">
                    <lucide-icon name="file-plus" [size]="12"></lucide-icon> Justificar
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>

      @if (justificarSesion()) {
        <div class="modal-overlay" (click)="cerrarJustificacion()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Justificar inasistencia</h3>
              <button class="btn-icon" (click)="cerrarJustificacion()"><lucide-icon name="x" [size]="18"></lucide-icon></button>
            </div>
            <p class="text-muted text-sm">{{ justificarSesion()?.fecha }} — {{ justificarSesion()?.horaInicio }} a {{ justificarSesion()?.horaFin }}</p>
            <div class="form-group mt-3">
              <label class="form-label">Motivo</label>
              <textarea class="form-control" rows="3" [(ngModel)]="justificacionNota" placeholder="Explica por qué no marcaste asistencia..."></textarea>
            </div>
            <div class="form-group mt-3">
              <label class="form-label">Soporte (opcional)</label>
              <input type="file" (change)="onJustificacionSoporte($event)">
              @if (justificacionSoporteUrl) {
                <p class="text-sm text-muted mt-1">Archivo adjuntado correctamente</p>
              }
            </div>
            <div class="btn-row mt-4">
              <button class="btn btn-outline" (click)="cerrarJustificacion()">Cancelar</button>
              <button class="btn btn-blue" [disabled]="!justificacionNota.trim() || enviandoJustificacion()" (click)="enviarJustificacion()">
                @if (enviandoJustificacion()) {
                  <lucide-icon name="loader" [size]="14" class="spin"></lucide-icon> Enviando...
                } @else {
                  Enviar solicitud
                }
              </button>
            </div>
          </div>
        </div>
      }
    } @else if (yaFirmo()) {
      <div class="card mt-4 success-card">
        <lucide-icon name="check-circle" [size]="40" style="color:#16a34a"></lucide-icon>
        <h3>¡Asistencia Registrada!</h3>
        <p class="text-muted text-sm">Tu firma fue guardada exitosamente.</p>
        <div class="mt-2">
          <p><strong>Ficha:</strong> {{ sesion()?.ficha?.codigo }}</p>
          <p><strong>Fecha:</strong> {{ sesion()?.fecha }}</p>
          <p><strong>Hora:</strong> {{ sesion()?.horaInicio }} — {{ sesion()?.horaFin }}</p>
        </div>
      </div>
    } @else if (needsFaceRegistration()) {
      <div class="card mt-4 alert-card">
        <lucide-icon name="scan-face" [size]="40" style="color:#d97706"></lucide-icon>
        <h3>Registro Facial Requerido</h3>
        <p class="text-muted text-sm">Debes registrar tu rostro antes de poder marcar asistencia. Este proceso solo se hace una vez.</p>
        <button class="btn btn-blue mt-3" (click)="router.navigate(['/app/aprendiz/registro-facial'])">
          <lucide-icon name="scan-face" [size]="16"></lucide-icon>
          Ir a Registro Facial
        </button>
      </div>
    } @else {
      <div class="card mt-4">
        <div class="session-info">
          <div class="info-row">
            <lucide-icon name="book-open" [size]="16"></lucide-icon>
            <span><strong>Ficha:</strong> {{ sesion()?.ficha?.codigo }} — {{ sesion()?.ficha?.programa }}</span>
          </div>
          <div class="info-row">
            <lucide-icon name="clock" [size]="16"></lucide-icon>
            <span><strong>Horario:</strong> {{ sesion()?.horaInicio }} — {{ sesion()?.horaFin }}</span>
          </div>
          <div class="info-row">
            <lucide-icon name="user" [size]="16"></lucide-icon>
            <span><strong>Instructor:</strong> {{ sesion()?.instructor?.nombre }} {{ sesion()?.instructor?.apellido }}</span>
          </div>
        </div>

        <!-- Paso 1: Verificación Facial -->
        @if (!faceVerified()) {
          <div class="face-section mt-4">
            <div class="section-header">
              <span class="step-badge">1</span>
              <h4>Verificación Facial</h4>
            </div>
            <p class="text-muted text-sm">Coloca tu rostro dentro del óvalo y presiona Capturar.</p>
            @if (verificandoRostro()) {
              <div class="verificando-bar mt-2">
                <span class="spin">⟳</span>
                <span>Verificando rostro con el registrado...</span>
              </div>
            }
            <div class="capture-wrap mt-2">
              <app-face-capture (captured)="onFaceCaptured($event)"></app-face-capture>
            </div>
          </div>
        } @else {
          <!-- Paso 2: Firma Digital -->
          <div class="face-verified-bar mt-3">
            <lucide-icon name="shield-check" [size]="16" style="color:#16a34a"></lucide-icon>
            <span>Identidad verificada correctamente</span>
          </div>

          <div class="section-header mt-4">
            <span class="step-badge">2</span>
            <h4>Firma Digital</h4>
          </div>

          <div class="ip-notice mt-2">
            <lucide-icon name="shield-check" [size]="14" style="color:var(--blue)"></lucide-icon>
            <div class="ip-text">
              <span class="text-muted text-sm">Tu IP será registrada para verificar tu ubicación.</span>
              @if (clientIP()) {
                <span class="ip-value">{{ clientIP() }}</span>
              }
            </div>
          </div>

          <div class="canvas-wrap mt-3">
            <label class="form-label">Realiza tu firma a mano alzada en el recuadro:</label>
            <div class="canvas-container" (touchstart)="touchStart($event)" (touchend)="touchEnd()">
              <canvas
                #firmaCanvas
                class="firma-canvas"
                (mousedown)="startDrawing($event)"
                (mousemove)="draw($event)"
                (mouseup)="stopDrawing()"
                (mouseleave)="stopDrawing()"
                (touchstart)="startDrawingTouch($event)"
                (touchmove)="drawTouch($event)"
                (touchend)="stopDrawing()"
              ></canvas>
              @if (!hasDrawing()) {
                <span class="canvas-placeholder">Firma aquí</span>
              }
            </div>
            <div class="canvas-actions mt-2">
              <button class="btn btn-outline btn-sm" (click)="limpiarFirma()">
                <lucide-icon name="eraser" [size]="14"></lucide-icon> Limpiar
              </button>
              <button class="btn btn-blue btn-sm" [disabled]="!hasDrawing() || enviando()" (click)="enviarFirma()">
                @if (enviando()) {
                  <lucide-icon name="loader" [size]="14" class="spin"></lucide-icon> Enviando...
                } @else {
                  <lucide-icon name="send" [size]="14"></lucide-icon> Confirmar Asistencia
                }
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .empty-card { text-align: center; padding: 40px 20px; color: var(--text-muted); }
    .success-card { text-align: center; padding: 40px 20px; border-color: #86efac; background: #f0fdf4; }
    .alert-card { text-align: center; padding: 40px 20px; border-color: #fcd34d; background: #fffbeb; }
    .page-header h2 { font-size: 1.4rem; color: var(--text); }
    .text-muted { color: var(--text-muted); }
    .text-sm { font-size: 13px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
    .session-info { display: flex; flex-direction: column; gap: 8px; }
    .info-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text); }
    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .section-header h4 { margin: 0; font-size: 14px; color: var(--text); }
    .step-badge { width: 22px; height: 22px; border-radius: 50%; background: var(--blue); color: #fff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
    .face-section { border-top: 1px solid var(--border); padding-top: 16px; }
    .capture-wrap { display: flex; justify-content: center; }
    .face-verified-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; font-size: 13px; font-weight: 600; color: #166534; }
    .verificando-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 13px; font-weight: 600; color: #1e40af; justify-content: center; }
    .canvas-wrap { display: flex; flex-direction: column; gap: 8px; }
    .form-label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
    .canvas-container { position: relative; width: 100%; height: 200px; border: 2px dashed var(--border); border-radius: 10px; background: #fff; overflow: hidden; }
    .firma-canvas { width: 100%; height: 100%; display: block; cursor: crosshair; touch-action: none; }
    .canvas-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 14px; pointer-events: none; }
    .canvas-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .ip-notice { display: flex; align-items: flex-start; gap: 6px; padding: 8px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; }
    .ip-text { display: flex; flex-direction: column; gap: 2px; }
    .ip-value { font-family: monospace; font-size: 11px; background: #dbeafe; color: #1e40af; padding: 1px 6px; border-radius: 4px; display: inline-block; width: fit-content; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .btn-blue { background: var(--blue); color: #fff; }
    .btn-outline { background: transparent; border-color: var(--border); color: var(--text); }
    .btn-sm { padding: 6px 10px; font-size: 12px; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .section-subtitle { font-size: .95rem; font-weight: 700; color: var(--text); margin: 0; }
    .mis-sesiones-list { display: flex; flex-direction: column; gap: 8px; }
    .sesion-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; }
    .sesion-info { display: flex; flex-direction: column; gap: 2px; }
    .sesion-fecha { font-weight: 700; font-size: 13px; color: var(--text); }
    .sesion-hora { font-size: 12px; color: var(--text-muted); }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .badge.presente { background: #dcfce7; color: #166534; }
    .badge.falla { background: #fee2e2; color: #991b1b; }
    .badge.pendiente { background: #fef3c7; color: #92400e; }
    .badge.falla-injustificada { background: #fecaca; color: #7f1d1d; }
    .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal { background: var(--surface); border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-lg); width: 100%; max-width: 480px; padding: 20px; max-height: 90vh; overflow: auto; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .btn-row { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
  `],
})
export class AprendizFirmaComponent implements OnInit, OnDestroy {
  private canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('firmaCanvas');
  sesion = signal<any>(null);
  yaFirmo = signal(false);
  needsFaceRegistration = signal(false);
  faceVerified = signal(false);
  faceVerificationImage = signal<string | null>(null);
  verificandoRostro = signal(false);
  hasDrawing = signal(false);
  enviando = signal(false);
  clientIP = signal<string | null>(null);

  misSesiones = signal<any[]>([]);
  justificarSesion = signal<any>(null);
  justificacionNota = '';
  justificacionSoporteUrl = '';
  enviandoJustificacion = signal(false);

  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;

  constructor(
    private asistencia: AsistenciaService,
    private auth: AuthService,
    private toast: ToastService,
    private http: HttpClient,
    private api: ApiService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.verificarEstado();
    this.obtenerIP();
    setTimeout(() => this.setupCanvas(), 200);
  }

  obtenerIP() {
    this.http.get<{ ip: string }>('https://api.ipify.org?format=json')
      .subscribe({
        next: (res) => this.clientIP.set(res.ip),
        error: () => this.clientIP.set(null),
      });
  }

  ngOnDestroy() {}

  verificarEstado() {
    const fichaId = this.auth.currentUser()?.fichaId;
    if (!fichaId) return;

    // Verificar sesión activa y estado facial en paralelo
    this.asistencia.getSesionActivaByFicha(fichaId).subscribe({
      next: (sesion: any) => {
        this.sesion.set(sesion);
        if (sesion) {
          const miRegistro = sesion.registros?.find((r: any) => r.aprendizId === this.auth.currentUser()?.perfilId);
          this.yaFirmo.set(!!miRegistro);
        } else {
          this.cargarMisSesiones();
        }
      },
      error: () => this.cargarMisSesiones(),
    });

    this.http.get<{ hasFace: boolean }>('http://127.0.0.1:3001/api/aprendices/me/face-status')
      .subscribe({
        next: (res) => {
          this.needsFaceRegistration.set(!res.hasFace);
        },
        error: () => {
          this.needsFaceRegistration.set(true);
        },
      });
  }

  onFaceCaptured(imageBase64: string) {
    this.verificandoRostro.set(true);
    this.faceVerificationImage.set(imageBase64);

    this.asistencia.verificarRostro({ faceVerificationImage: imageBase64 }).subscribe({
      next: (res: any) => {
        this.verificandoRostro.set(false);
        if (res.verified) {
          this.faceVerified.set(true);
          this.toast.success('Rostro verificado correctamente. Ahora firma para confirmar tu asistencia.');
          setTimeout(() => this.setupCanvas(), 0);
        } else {
          this.toast.error(res.message || 'El rostro no coincide con el registrado. Intenta de nuevo.');
          this.faceVerificationImage.set(null);
        }
      },
      error: (err: any) => {
        this.verificandoRostro.set(false);
        this.faceVerificationImage.set(null);
        this.toast.error(err.error?.message || 'Error al verificar rostro. Intenta de nuevo.');
      },
    });
  }

  private get ctx2d() {
    if (!this.ctx) {
      const canvas = this.canvasRef()?.nativeElement;
      if (canvas) this.ctx = canvas.getContext('2d');
    }
    return this.ctx;
  }

  setupCanvas() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    this.ctx = ctx;
  }

  startDrawing(e: MouseEvent) {
    this.isDrawing = true;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }

  draw(e: MouseEvent) {
    if (!this.isDrawing || !this.ctx2d) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.ctx2d.beginPath();
    this.ctx2d.moveTo(this.lastX, this.lastY);
    this.ctx2d.lineTo(x, y);
    this.ctx2d.stroke();
    this.lastX = x;
    this.lastY = y;
    this.hasDrawing.set(true);
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  startDrawingTouch(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    this.isDrawing = true;
    this.lastX = touch.clientX - rect.left;
    this.lastY = touch.clientY - rect.top;
  }

  drawTouch(e: TouchEvent) {
    e.preventDefault();
    if (!this.isDrawing || !this.ctx2d) return;
    const touch = e.touches[0];
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.ctx2d.beginPath();
    this.ctx2d.moveTo(this.lastX, this.lastY);
    this.ctx2d.lineTo(x, y);
    this.ctx2d.stroke();
    this.lastX = x;
    this.lastY = y;
    this.hasDrawing.set(true);
  }

  touchStart(e: TouchEvent) {}
  touchEnd() {
    this.isDrawing = false;
  }

  limpiarFirma() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas || !this.ctx2d) return;
    this.ctx2d.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
    this.hasDrawing.set(false);
  }

  enviarFirma() {
    const canvas = this.canvasRef()?.nativeElement;
    const sesion = this.sesion();
    const aprendizId = this.auth.currentUser()?.perfilId;
    const faceImage = this.faceVerificationImage();
    if (!canvas || !sesion || !aprendizId) return;

    const firmaBase64 = canvas.toDataURL('image/png');
    this.enviando.set(true);

    const payload: any = {
      sesionId: sesion.id,
      aprendizId,
      firmaImagen: firmaBase64,
      ipAddress: this.clientIP() || undefined,
    };
    if (faceImage) {
      payload.faceVerificationImage = faceImage;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          payload.latitud = pos.coords.latitude;
          payload.longitud = pos.coords.longitude;
          this.enviar(payload);
        },
        () => this.enviar(payload),
        { enableHighAccuracy: false, timeout: 5000 },
      );
    } else {
      this.enviar(payload);
    }
  }

  private enviar(payload: any) {
    console.log('[FIRMA] Enviando payload, faceVerificationImage presente:', !!payload.faceVerificationImage);
    this.asistencia.registrarFirma(payload).subscribe({
      next: (res: any) => {
        console.log('[FIRMA] Respuesta:', res);
        this.enviando.set(false);
        this.yaFirmo.set(true);
        this.toast.success('Asistencia confirmada correctamente');
      },
      error: (err: any) => {
        this.enviando.set(false);
        console.error('[FIRMA] Error:', err);
        this.toast.error(err.error?.message || 'Error al confirmar asistencia');
      },
    });
  }

  cargarMisSesiones() {
    const fichaId = this.auth.currentUser()?.fichaId;
    if (!fichaId) return;
    this.asistencia.getMisSesiones(fichaId).subscribe({
      next: (list: any) => this.misSesiones.set(list ?? []),
      error: () => {},
    });
  }

  abrirJustificacion(sesion: any) {
    this.justificarSesion.set(sesion);
    this.justificacionNota = '';
    this.justificacionSoporteUrl = '';
  }

  cerrarJustificacion() {
    this.justificarSesion.set(null);
  }

  onJustificacionSoporte(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (!file) return;
    this.api.uploadAdjunto(file).subscribe({
      next: (res: any) => { this.justificacionSoporteUrl = res.url; },
      error: () => this.toast.error('Error al subir el soporte'),
    });
  }

  enviarJustificacion() {
    const sesion = this.justificarSesion();
    if (!sesion || !this.justificacionNota.trim()) return;
    this.enviandoJustificacion.set(true);
    this.asistencia.solicitarJustificacion({
      sesionId: sesion.id,
      nota: this.justificacionNota,
      soporte: this.justificacionSoporteUrl || undefined,
    }).subscribe({
      next: () => {
        this.enviandoJustificacion.set(false);
        this.toast.success('Solicitud de justificación enviada. Tu instructor la revisará.');
        this.cerrarJustificacion();
        this.cargarMisSesiones();
      },
      error: (err: any) => {
        this.enviandoJustificacion.set(false);
        this.toast.error(err.error?.message || 'Error al enviar la justificación');
      },
    });
  }
}
