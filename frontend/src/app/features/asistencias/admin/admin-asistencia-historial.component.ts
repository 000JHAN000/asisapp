import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsistenciaService } from '../../../core/services/asistencia/asistencia.service';
import { ApiService } from '../../../core/services/api.service';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-asistencia-historial',
  imports: [FormsModule, LucideAngularModule, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h2>Historial de Asistencias</h2>
        <p class="text-muted text-sm">Consulta y revisa todas las sesiones de asistencia registradas</p>
      </div>
    </div>

    <div class="filters-bar mt-4">
      <div class="form-group">
        <label class="form-label">Fecha</label>
        <input type="date" class="form-control" [(ngModel)]="filtro.fecha" (change)="cargarHistorial()">
      </div>
      <div class="form-group">
        <label class="form-label">Ficha</label>
        <select class="form-control" [(ngModel)]="filtro.fichaId" (change)="cargarHistorial()">
          <option value="">Todas</option>
          @for (f of fichas(); track f.id) {
            <option [value]="f.id">{{ f.codigo }} — {{ f.programa }}</option>
          }
        </select>
      </div>
      <button class="btn btn-outline btn-sm" style="align-self:flex-end;" (click)="limpiarFiltros()">
        <lucide-icon name="x" [size]="14"></lucide-icon> Limpiar
      </button>
    </div>

    <div class="table-wrap mt-4">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Ficha</th>
            <th>Instructor</th>
            <th>Ambiente</th>
            <th>Horario</th>
            <th>Presentes</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (s of sesiones(); track s.id) {
            <tr>
              <td>{{ s.fecha }}</td>
              <td>{{ s.ficha?.codigo }} — {{ s.ficha?.programa }}</td>
              <td>{{ s.instructor?.nombre }} {{ s.instructor?.apellido }}</td>
              <td>{{ s.ambiente?.nombre ?? '—' }}</td>
              <td>{{ s.horaInicio }} — {{ s.horaFin }}</td>
              <td>
                <span class="badge presentes">
                  {{ (s.registros ?? []).filter(r => r.estado === 'presente').length }} / {{ (s.registros ?? []).length }}
                </span>
              </td>
              <td>
                <button class="btn-icon-sm" (click)="verDetalle(s)">
                  <lucide-icon name="eye" [size]="14"></lucide-icon>
                </button>
              </td>
            </tr>
          }
          @if (sesiones().length === 0) {
            <tr><td colspan="7" class="empty-cell">No hay sesiones registradas con los filtros seleccionados</td></tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Modal detalle -->
    @if (detalle()) {
      <div class="modal-overlay" (click)="detalle.set(null)">
        <div class="modal modal-wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Detalle de Asistencia</h3>
              <p class="text-muted text-sm">{{ detalle()?.ficha?.codigo }} — {{ detalle()?.fecha }}</p>
            </div>
            <button class="btn-icon" (click)="detalle.set(null)"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>

          <div class="table-wrap mt-3" style="max-height:60vh;overflow:auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Aprendiz</th>
                  <th>Documento</th>
                  <th>Hora Registro</th>
                  <th>IP</th>
                  <th>Estado</th>
                  <th>Firma</th>
                </tr>
              </thead>
              <tbody>
                @for (r of detalle()?.registros ?? []; track r.id; let i = $index) {
                  <tr>
                    <td>{{ i+1 }}</td>
                    <td>{{ r.aprendiz?.apellido }}, {{ r.aprendiz?.nombre }}</td>
                    <td>{{ r.aprendiz?.numDoc }}</td>
                    <td>{{ r.horaRegistro | date:'HH:mm' }}</td>
                    <td>
                      @if (r.ipAddress) {
                        <span class="ip-badge" title="IP desde donde se registró">{{ r.ipAddress }}</span>
                      } @else { — }
                    </td>
                    <td>
                      <span class="badge" [class.presente]="r.estado==='presente'" [class.falla]="r.estado==='falla_justificada'">
                        {{ r.estado==='presente' ? 'Presente' : 'Falla Just.' }}
                      </span>
                    </td>
                    <td>
                      @if (r.firmaImagen) {
                        <img [src]="r.firmaImagen" class="firma-thumb" (click)="verFirma(r.firmaImagen)">
                      } @else { — }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }

    <!-- Modal firma -->
    @if (firmaUrl()) {
      <div class="modal-overlay" (click)="firmaUrl.set(null)">
        <div class="modal" style="max-width:480px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Firma Digital</h3>
            <button class="btn-icon" (click)="firmaUrl.set(null)"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>
          <img [src]="firmaUrl()" style="width:100%;border:1px solid var(--border);border-radius:8px;margin-top:8px;">
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header h2 { font-size: 1.4rem; color: var(--text); }
    .text-muted { color: var(--text-muted); }
    .text-sm { font-size: 13px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
    .filters-bar { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
    .form-label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
    .form-control { padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; background: var(--surface); color: var(--text); outline: none; }
    .form-control:focus { border-color: var(--blue); }
    .table-wrap { overflow: auto; border: 1px solid var(--border); border-radius: 10px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { background: var(--surface2); padding: 10px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .data-table td { padding: 10px; border-bottom: 1px solid var(--border); color: var(--text); }
    .data-table tr:hover { background: var(--gray-100); }
    .empty-cell { text-align: center; color: var(--text-muted); padding: 24px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .badge.presentes { background: #dcfce7; color: #166534; }
    .badge.falla { background: #fee2e2; color: #991b1b; }
    .ip-badge { font-size: 11px; font-family: monospace; background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 4px; border: 1px solid #bfdbfe; cursor: default; }
    .firma-thumb { width: 60px; height: 30px; object-fit: contain; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; background: #fff; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .btn-outline { background: transparent; border-color: var(--border); color: var(--text); }
    .btn-sm { padding: 6px 10px; font-size: 12px; }
    .btn-icon { background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; }
    .btn-icon-sm { width: 28px; height: 28px; border-radius: 6px; background: none; border: 1px solid var(--border); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: var(--text-muted); }
    .btn-icon-sm:hover { background: var(--gray-100); color: var(--text); }
    .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal { background: var(--surface); border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-lg); width: 100%; max-width: 720px; padding: 20px; max-height: 90vh; overflow: auto; }
    .modal-wide { max-width: 900px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  `],
})
export class AdminAsistenciaHistorialComponent implements OnInit {
  sesiones = signal<any[]>([]);
  fichas = signal<any[]>([]);
  detalle = signal<any>(null);
  firmaUrl = signal<string | null>(null);
  filtro = { fecha: '', fichaId: '' };

  constructor(private asistencia: AsistenciaService, private api: ApiService) {}

  ngOnInit() {
    this.cargarFichas();
    this.cargarHistorial();
  }

  cargarFichas() {
    this.api.getFichas().subscribe((list: any[]) => this.fichas.set(list));
  }

  cargarHistorial() {
    this.asistencia.getHistorial(
      this.filtro.fecha || undefined,
      this.filtro.fichaId ? +this.filtro.fichaId : undefined,
    ).subscribe((list: any) => this.sesiones.set(list));
  }

  limpiarFiltros() {
    this.filtro = { fecha: '', fichaId: '' };
    this.cargarHistorial();
  }

  verDetalle(s: any) {
    this.asistencia.getSesion(s.id).subscribe((full: any) => this.detalle.set(full));
  }

  verFirma(url: string) {
    this.firmaUrl.set(url);
  }
}
