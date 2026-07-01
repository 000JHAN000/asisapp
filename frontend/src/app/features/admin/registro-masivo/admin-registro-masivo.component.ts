import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast.service';

interface RegistroResultado {
  total: number;
  exitosos: number;
  fallidos: number;
  errores: { fila: number; datos: any; error: string }[];
}

@Component({
  selector: 'app-admin-registro-masivo',
  imports: [LucideAngularModule, DecimalPipe],
  template: `
    <div class="page-header">
      <div>
        <h2>Registro Masivo</h2>
        <p class="text-muted text-sm">Sube un archivo Excel o CSV para registrar aprendices o instructores en bloque</p>
      </div>
    </div>

    <div class="card mt-4">
      <div class="form-section">
        <label class="form-label">Tipo de registro</label>
        <div class="tipo-selector">
          <button
            class="tipo-btn"
            [class.active]="tipo() === 'aprendices'"
            (click)="tipo.set('aprendices')">
            <lucide-icon name="users" [size]="18"></lucide-icon>
            Aprendices
          </button>
          <button
            class="tipo-btn"
            [class.active]="tipo() === 'instructores'"
            (click)="tipo.set('instructores')">
            <lucide-icon name="user" [size]="18"></lucide-icon>
            Instructores
          </button>
        </div>
      </div>

      <div class="form-section mt-3">
        <label class="form-label">Archivo</label>
        <div
          class="drop-zone"
          [class.dragover]="dragOver()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)">
          <lucide-icon name="file-spreadsheet" [size]="40" style="opacity:.4"></lucide-icon>
          <p class="drop-text">
            @if (archivo()) {
              <strong>{{ archivo()?.name }}</strong><br>
              <span class="text-muted">{{ (archivo()?.size ?? 0) / 1024 | number:'1.0-1' }} KB</span>
            } @else {
              Arrastra aquí tu archivo Excel o CSV<br>
              <span class="text-muted">o haz clic para seleccionar</span>
            }
          </p>
          <input
            type="file"
            #fileInput
            accept=".xlsx,.xls,.csv"
            style="display:none"
            (change)="onFileSelect($event)">
          <button class="btn btn-outline btn-sm" (click)="fileInput.click()">
            <lucide-icon name="folder-open" [size]="14"></lucide-icon>
            Seleccionar archivo
          </button>
        </div>
      </div>

      @if (tipo() === 'aprendices') {
        <div class="hint-box mt-3">
          <p><strong>Columnas esperadas:</strong> nombre, apellido, tipo_doc, num_doc, correo, telefono, ficha_codigo, genero, municipio</p>
          <p class="text-muted">* nombre, apellido, num_doc y correo son obligatorios</p>
        </div>
      } @else {
        <div class="hint-box mt-3">
          <p><strong>Columnas esperadas:</strong> nombre, apellido, tipo_doc, num_doc, correo, telefono, genero, municipio, area</p>
          <p class="text-muted">* nombre, apellido, num_doc y correo son obligatorios</p>
        </div>
      }

      <div class="btn-row mt-4">
        <button
          class="btn btn-blue"
          [disabled]="!archivo() || procesando()"
          (click)="procesar()">
          @if (procesando()) {
            <lucide-icon name="loader" [size]="14" class="spin"></lucide-icon>
            Procesando...
          } @else {
            <lucide-icon name="upload" [size]="14"></lucide-icon>
            Subir y Procesar
          }
        </button>
      </div>
    </div>

    @if (resultado()) {
      <div class="card mt-4 resultado-card">
        <h3 class="card-title">Resultado del Procesamiento</h3>
        <div class="stats-grid mt-3">
          <div class="stat-box">
            <span class="stat-value">{{ resultado()?.total }}</span>
            <span class="stat-label">Total filas</span>
          </div>
          <div class="stat-box exito">
            <span class="stat-value">{{ resultado()?.exitosos }}</span>
            <span class="stat-label">Exitosos</span>
          </div>
          <div class="stat-box fallo">
            <span class="stat-value">{{ resultado()?.fallidos }}</span>
            <span class="stat-label">Fallidos</span>
          </div>
        </div>

        @if (resultado()!.errores.length > 0) {
          <div class="errores-section mt-4">
            <h4 class="section-subtitle">Errores por fila</h4>
            <div class="errores-list">
              @for (err of resultado()!.errores; track err.fila) {
                <div class="error-row">
                  <span class="error-fila">Fila {{ err.fila }}</span>
                  <span class="error-msg">{{ err.error }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header h2 { font-size: 1.4rem; color: var(--text); }
    .text-muted { color: var(--text-muted); }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .form-section { display: flex; flex-direction: column; gap: 8px; }
    .form-label { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
    .tipo-selector { display: flex; gap: 10px; }
    .tipo-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 10px; border: 1px solid var(--border);
      background: var(--surface); color: var(--text); font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all .15s;
    }
    .tipo-btn:hover { background: var(--gray-100); }
    .tipo-btn.active { background: var(--blue); color: #fff; border-color: var(--blue); }
    .drop-zone {
      border: 2px dashed var(--border); border-radius: 12px; padding: 32px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      text-align: center; transition: all .2s; background: var(--bg);
    }
    .drop-zone.dragover { border-color: var(--blue); background: rgba(59,130,246,.06); }
    .drop-text { font-size: 14px; color: var(--text); margin: 0; }
    .hint-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: var(--text); }
    .hint-box p { margin: 0; }
    .hint-box p + p { margin-top: 4px; }
    .btn-row { display: flex; justify-content: flex-end; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: opacity .15s; }
    .btn-blue { background: var(--blue); color: #fff; }
    .btn-outline { background: transparent; border-color: var(--border); color: var(--text); }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .resultado-card { border-top: 3px solid var(--blue); }
    .card-title { font-size: 1.1rem; font-weight: 700; color: var(--text); margin: 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .stat-box { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px; text-align: center; }
    .stat-value { display: block; font-size: 28px; font-weight: 800; color: var(--text); }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; }
    .stat-box.exito { border-color: #86efac; background: #f0fdf4; }
    .stat-box.exito .stat-value { color: #16a34a; }
    .stat-box.fallo { border-color: #fecaca; background: #fef2f2; }
    .stat-box.fallo .stat-value { color: #dc2626; }
    .errores-section { max-height: 320px; overflow-y: auto; }
    .section-subtitle { font-size: 13px; font-weight: 700; color: var(--text); margin: 0 0 8px; }
    .errores-list { display: flex; flex-direction: column; gap: 6px; }
    .error-row { display: flex; gap: 12px; align-items: center; padding: 8px 12px; background: #fef2f2; border-radius: 6px; border: 1px solid #fecaca; }
    .error-fila { font-size: 12px; font-weight: 700; color: #991b1b; white-space: nowrap; min-width: 60px; }
    .error-msg { font-size: 12px; color: #7f1d1d; }
  `],
})
export class AdminRegistroMasivoComponent {
  tipo = signal<'aprendices' | 'instructores'>('aprendices');
  archivo = signal<File | null>(null);
  dragOver = signal(false);
  procesando = signal(false);
  resultado = signal<RegistroResultado | null>(null);

  constructor(private http: HttpClient, private toast: ToastService) {}

  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validarArchivo(files[0]);
    }
  }

  onFileSelect(e: Event) {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      this.validarArchivo(files[0]);
    }
  }

  private validarArchivo(file: File) {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!allowed.includes(ext)) {
      this.toast.error('Formato no válido', 'Solo se permiten archivos .xlsx, .xls o .csv');
      return;
    }
    this.archivo.set(file);
    this.resultado.set(null);
  }

  procesar() {
    const file = this.archivo();
    if (!file) return;
    this.procesando.set(true);
    this.resultado.set(null);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<RegistroResultado>(
      `http://127.0.0.1:3001/api/admin/registro-masivo?tipo=${this.tipo()}`,
      formData,
    ).subscribe({
      next: (res) => {
        this.procesando.set(false);
        this.resultado.set(res);
        if (res.exitosos > 0) {
          this.toast.success(`${res.exitosos} registros exitosos de ${res.total}`);
        }
        if (res.fallidos > 0) {
          this.toast.warning(`${res.fallidos} registros fallaron`);
        }
      },
      error: (err) => {
        this.procesando.set(false);
        this.toast.error(err.error?.message || 'Error al procesar el archivo');
      },
    });
  }
}
