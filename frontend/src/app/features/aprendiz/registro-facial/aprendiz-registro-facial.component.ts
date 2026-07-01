import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { FaceCaptureComponent } from '../../../shared/components/face-capture.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-aprendiz-registro-facial',
  imports: [FaceCaptureComponent, LucideAngularModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Registro Facial</h2>
        <p class="text-muted text-sm">Registra tu rostro para poder marcar asistencia de forma segura</p>
      </div>
    </div>

    @if (loading()) {
      <div class="card mt-4 empty-state">
        <lucide-icon name="loader" [size]="32" class="spin"></lucide-icon>
        <p>Verificando estado...</p>
      </div>
    } @else if (hasFace()) {
      <div class="card mt-4 success-state">
        <lucide-icon name="shield-check" [size]="48" style="color:#16a34a"></lucide-icon>
        <h3>¡Rostro Registrado!</h3>
        <p class="text-muted text-sm">Tu rostro ya está registrado en el sistema. No puedes modificarlo.</p>
        @if (facePhoto()) {
          <img [src]="facePhoto()" class="face-preview" alt="Tu foto registrada">
        }
        <button class="btn btn-outline mt-3" (click)="router.navigate(['/app/aprendiz/dashboard'])">
          Volver al inicio
        </button>
      </div>
    } @else {
      <div class="card mt-4">
        <div class="steps">
          <div class="step active">
            <span class="step-num">1</span>
            <span class="step-label">Posición</span>
          </div>
          <div class="step-line"></div>
          <div class="step">
            <span class="step-num">2</span>
            <span class="step-label">Verificación</span>
          </div>
        </div>

        <p class="text-muted text-sm mt-3 text-center">
          Coloca tu rostro dentro del óvalo. Asegúrate de tener buena iluminación y quitar accesorios (gafas, gorra).
        </p>

        <div class="capture-area mt-3">
          <app-face-capture (captured)="onCaptured($event)"></app-face-capture>
        </div>

        @if (processing()) {
          <div class="processing-overlay">
            <lucide-icon name="loader" [size]="32" class="spin"></lucide-icon>
            <p>Analizando rostro...</p>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header h2 { font-size: 1.4rem; color: var(--text); }
    .text-muted { color: var(--text-muted); }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .empty-state { text-align: center; padding: 40px 20px; }
    .success-state { text-align: center; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .face-preview { width: 160px; height: 200px; object-fit: cover; border-radius: 12px; border: 2px solid #86efac; margin-top: 8px; }
    .steps { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .step { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--text-muted); }
    .step.active { color: var(--blue); }
    .step-num { width: 24px; height: 24px; border-radius: 50%; background: var(--gray-100); display: flex; align-items: center; justify-content: center; font-size: 11px; }
    .step.active .step-num { background: var(--blue); color: #fff; }
    .step-line { width: 40px; height: 2px; background: var(--border); }
    .capture-area { display: flex; justify-content: center; }
    .processing-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 200; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #fff; font-weight: 600; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .btn-outline { background: transparent; border-color: var(--border); color: var(--text); }
    .mt-3 { margin-top: 12px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `],
})
export class AprendizRegistroFacialComponent implements OnInit {
  loading = signal(true);
  hasFace = signal(false);
  facePhoto = signal<string | null>(null);
  processing = signal(false);

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private toast: ToastService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.checkStatus();
  }

  checkStatus() {
    this.http.get<{ hasFace: boolean; facePhoto: string | null }>('http://127.0.0.1:3001/api/aprendices/me/face-status')
      .subscribe({
        next: (res) => {
          this.hasFace.set(res.hasFace);
          this.facePhoto.set(res.facePhoto);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Error al verificar estado facial');
        },
      });
  }

  onCaptured(imageBase64: string) {
    this.processing.set(true);
    this.http.post<{ success: boolean; message: string }>(
      'http://127.0.0.1:3001/api/aprendices/me/register-face',
      { image: imageBase64 },
    ).subscribe({
      next: (res) => {
        this.processing.set(false);
        if (res.success) {
          this.toast.success('Rostro registrado correctamente');
          this.hasFace.set(true);
          this.facePhoto.set(imageBase64);
        } else {
          this.toast.error(res.message || 'Error al registrar rostro');
        }
      },
      error: (err) => {
        this.processing.set(false);
        this.toast.error(err.error?.message || 'Error al registrar rostro. Intenta de nuevo.');
      },
    });
  }
}
