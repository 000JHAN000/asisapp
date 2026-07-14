import { Component, OnInit, OnDestroy, signal, computed, viewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AsistenciaService } from '../../../core/services/asistencia/asistencia.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-instructor-asistencia',
  imports: [FormsModule, LucideAngularModule, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h2>Gestión de Asistencia</h2>
        <p class="text-muted text-sm">Control de firmas en tiempo real</p>
      </div>
      <button class="btn btn-white btn-sm" (click)="abrirReporteMensual()">
        <lucide-icon name="calendar" [size]="14"></lucide-icon> Reporte Mensual
      </button>
    </div>

    @if (!sesionActiva()) {
      <!-- Selección de horario para iniciar -->
      <div class="card mt-4">
        <h3 class="card-title">Iniciar Sesión de Asistencia</h3>
        <p class="text-muted text-sm">Selecciona una clase de tu horario de hoy para comenzar.</p>

        @if (horariosHoy().length === 0) {
          <div class="empty-state mt-3">
            <lucide-icon name="calendar-x" [size]="32" style="opacity:.4"></lucide-icon>
            <p>No tienes clases programadas para hoy</p>
          </div>
        } @else {
          <div class="horario-list mt-3">
            @for (h of horariosHoy(); track h.id) {
              <div class="horario-row" [class.selected]="horarioSeleccionado()?.id === h.id" (click)="seleccionarHorario(h)">
                <div class="horario-info">
                  <span class="horario-ficha">{{ h.ficha?.codigo }}</span>
                  <span class="horario-prog">{{ h.ficha?.programa }}</span>
                  <span class="horario-time">{{ h.horaInicio }} — {{ h.horaFin }}</span>
                </div>
                <lucide-icon name="chevron-right" [size]="16" style="color:var(--text-muted)"></lucide-icon>
              </div>
            }
          </div>
        }

        @if (horarioSeleccionado()) {
          <div class="form-section mt-4">
            <h4 class="section-subtitle">Configurar Sesión</h4>
            <div class="grid-3 gap-3 mt-2">
              <div class="form-group">
                <label class="form-label">Fecha</label>
                <input type="date" class="form-control" [(ngModel)]="sesionForm.fecha" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Hora Inicio</label>
                <input type="time" class="form-control" [(ngModel)]="sesionForm.horaInicio">
              </div>
              <div class="form-group">
                <label class="form-label">Hora Fin</label>
                <input type="time" class="form-control" [(ngModel)]="sesionForm.horaFin">
              </div>
            </div>

            <div class="btn-row mt-3">
              <button class="btn btn-white" (click)="verPrevisualizacion()">
                <lucide-icon name="users" [size]="14"></lucide-icon> Ver Aprendices
              </button>
              <button class="btn btn-blue" (click)="iniciarSesion()">
                <lucide-icon name="play" [size]="14"></lucide-icon> Comenzar Asistencia
              </button>
            </div>
          </div>
        }
      </div>
    } @else {
      <!-- Panel en tiempo real -->
      <div class="dashboard-live mt-4">
        <!-- Header de sesión -->
        <div class="session-card">
          <div class="session-info-main">
            <div class="session-badge">EN CURSO</div>
            <h3>{{ sesionActiva()?.ficha?.codigo }} — {{ sesionActiva()?.ficha?.programa }}</h3>
            <p class="text-muted text-sm">
              <lucide-icon name="calendar" [size]="14"></lucide-icon> {{ sesionActiva()?.fecha }} &nbsp;
              <lucide-icon name="clock" [size]="14"></lucide-icon> {{ sesionActiva()?.horaInicio }} — {{ sesionActiva()?.horaFin }}
            </p>
          </div>
          <div class="session-actions">
            <button class="btn btn-white btn-sm" (click)="abrirReporte()">
              <lucide-icon name="file-text" [size]="14"></lucide-icon> Ver Reporte
            </button>
            <button class="btn btn-danger btn-sm" (click)="cerrarSesion()">
              <lucide-icon name="square" [size]="14"></lucide-icon> Cerrar Sesión
            </button>
          </div>
        </div>

        <!-- Stats cards -->
        <div class="stats-grid mt-3">
          <div class="stat-card presentes">
            <div class="stat-icon"><lucide-icon name="user-check" [size]="20"></lucide-icon></div>
            <div class="stat-body">
              <span class="stat-number">{{ presentes() }}</span>
              <span class="stat-label">Presentes</span>
            </div>
          </div>
          <div class="stat-card pendientes">
            <div class="stat-icon"><lucide-icon name="user-x" [size]="20"></lucide-icon></div>
            <div class="stat-body">
              <span class="stat-number">{{ pendientesCount() }}</span>
              <span class="stat-label">Pendientes</span>
            </div>
          </div>
          <div class="stat-card total">
            <div class="stat-icon"><lucide-icon name="users" [size]="20"></lucide-icon></div>
            <div class="stat-body">
              <span class="stat-number">{{ totalAprendices() }}</span>
              <span class="stat-label">Total Aprendices</span>
            </div>
          </div>
          <div class="stat-card porcentaje">
            <div class="stat-icon"><lucide-icon name="percent" [size]="20"></lucide-icon></div>
            <div class="stat-body">
              <span class="stat-number">{{ porcentajeAsistencia() }}%</span>
              <span class="stat-label">Asistencia</span>
            </div>
          </div>
        </div>

        <!-- Gráficas -->
        <div class="charts-grid mt-3">
          <!-- Donut: Presentes vs Pendientes -->
          <div class="chart-card">
            <h4 class="chart-title">Distribución de Asistencia</h4>
            <div class="donut-wrap">
              <div class="donut-chart" [style.--presentes]="presentesPorcentaje()" [style.--pendientes]="pendientesPorcentaje()">
                <div class="donut-hole">
                  <span class="donut-total">{{ presentes() }}/{{ totalAprendices() }}</span>
                  <span class="donut-label">Presentes</span>
                </div>
              </div>
              <div class="donut-legend">
                <div class="legend-item">
                  <span class="legend-dot" style="background:#16a34a"></span>
                  <span>Presentes ({{ presentes() }})</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot" style="background:#cbd5e1"></span>
                  <span>Pendientes ({{ pendientesCount() }})</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Barra de progreso -->
          <div class="chart-card">
            <h4 class="chart-title">Progreso de Asistencia</h4>
            <div class="progress-section">
              <div class="progress-header">
                <span class="progress-label">Completado</span>
                <span class="progress-value">{{ porcentajeAsistencia() }}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="porcentajeAsistencia()"></div>
              </div>
              <div class="progress-meta">
                <span class="meta-presentes">{{ presentes() }} confirmaron</span>
                <span class="meta-pendientes">{{ pendientesCount() }} faltan</span>
              </div>
            </div>

              @if (ipsDuplicadas().length > 0) {
                <div class="alerta-ip mt-3">
                  <lucide-icon name="alert-triangle" [size]="16" style="color:#b45309;flex-shrink:0"></lucide-icon>
                  <div>
                    <strong>Atención:</strong> Se detectaron {{ ipsDuplicadas().length }} IP(s) compartida(s):
                    <span class="ip-list">{{ ipsDuplicadas().join(', ') }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

        <!-- Tabla completa: todos los aprendices -->
        <div class="table-card mt-3">
          <div class="table-header">
            <h4 class="table-title">
              <lucide-icon name="list" [size]="16"></lucide-icon>
              Listado Completo de Aprendices
            </h4>
            <div class="table-filters">
              <span class="filter-badge active">Todos ({{ todosAprendices().length }})</span>
              <span class="filter-badge presentes">Presentes ({{ presentes() }})</span>
              <span class="filter-badge pendientes">Pendientes ({{ pendientesCount() }})</span>
            </div>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Foto</th>
                  <th>Aprendiz</th>
                  <th>Documento</th>
                  <th>Hora</th>
                  <th>IP</th>
                  <th>Estado</th>
                  <th>Firma</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (a of todosAprendices(); track a.id || a.aprendizId; let i = $index) {
                  <tr [class.ip-duplicada]="a.ipAddress && ipsDuplicadas().includes(a.ipAddress)"
                      [class.fila-pendiente]="!a.horaRegistro">
                    <td>{{ i + 1 }}</td>
                    <td>
                      @if (a.lastAttendancePhoto) {
                        <img [src]="a.lastAttendancePhoto" class="face-thumb" (click)="verFirma(a.lastAttendancePhoto)" title="Foto de confirmación">
                      } @else if (a.facePhoto) {
                        <img [src]="a.facePhoto" class="face-thumb" (click)="verFirma(a.facePhoto)" title="Foto registrada">
                      } @else {
                        <div class="face-placeholder">
                          <lucide-icon name="user" [size]="16"></lucide-icon>
                        </div>
                      }
                    </td>
                    <td>
                      <div class="aprendiz-name">{{ a.apellido }}, {{ a.nombre }}</div>
                      @if (!a.horaRegistro) {
                        <span class="pendiente-tag">Sin confirmar</span>
                      }
                    </td>
                    <td>{{ a.numDoc }}</td>
                    <td>
                      @if (a.horaRegistro) {
                        {{ a.horaRegistro | date:'HH:mm' }}
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    <td>
                      @if (a.ipAddress) {
                        <span class="ip-badge" title="IP de registro">{{ a.ipAddress }}</span>
                        @if (ipsDuplicadas().includes(a.ipAddress)) {
                          <lucide-icon name="alert-triangle" [size]="12" style="color:#d97706;margin-left:4px"></lucide-icon>
                        }
                      } @else { <span class="text-muted">—</span> }
                    </td>
                    <td>
                      @if (a.estado === 'presente') {
                        <span class="badge presente">Presente</span>
                      } @else if (a.estado === 'falla_justificada') {
                        <span class="badge falla">Falla Just.</span>
                      } @else if (a.estado === 'justificacion_pendiente') {
                        <span class="badge pendiente">Justif. pendiente</span>
                      } @else if (a.estado === 'falla_injustificada') {
                        <span class="badge falla-injustificada">Falla No Just.</span>
                      } @else {
                        <span class="badge pendiente">Pendiente</span>
                      }
                    </td>
                    <td>
                      @if (a.firmaImagen) {
                        <img [src]="a.firmaImagen" class="firma-thumb" (click)="verFirma(a.firmaImagen)">
                      } @else { <span class="text-muted">—</span> }
                    </td>
                    <td>
                      @if (a.estado === 'presente') {
                        <div style="display:flex; gap:4px;">
                          <button class="btn-icon-sm" title="Marcar falla justificada" (click)="marcarFalla(a.aprendizId)">
                            <lucide-icon name="file-minus" [size]="14"></lucide-icon>
                          </button>
                          <button class="btn-icon-sm" title="Quitar asistencia (no asistió realmente)" (click)="quitarAsistencia(a.id)">
                            <lucide-icon name="user-x" [size]="14"></lucide-icon>
                          </button>
                        </div>
                      } @else if (a.estado === 'justificacion_pendiente') {
                        <div style="display:flex; gap:4px;">
                          <button class="btn-icon-sm" title="Ver nota" (click)="verNotaJustificacion(a)">
                            <lucide-icon name="file-text" [size]="14"></lucide-icon>
                          </button>
                          <button class="btn-icon-sm btn-aprobar" title="Aprobar justificación" (click)="resolverJustificacion(a.id, true)">
                            <lucide-icon name="check" [size]="14"></lucide-icon>
                          </button>
                          <button class="btn-icon-sm btn-rechazar" title="Rechazar justificación" (click)="resolverJustificacion(a.id, false)">
                            <lucide-icon name="x" [size]="14"></lucide-icon>
                          </button>
                        </div>
                      } @else if (a.estado === 'falla_injustificada' || !a.estado) {
                        <button class="btn-icon-sm" title="Subir justificación / soporte" (click)="marcarFalla(a.aprendizId)">
                          <lucide-icon name="file-minus" [size]="14"></lucide-icon>
                        </button>
                      } @else {
                        <span class="text-muted text-sm">—</span>
                      }
                    </td>
                  </tr>
                }
                @if (todosAprendices().length === 0) {
                  <tr>
                    <td colspan="9" class="empty-cell">No hay aprendices registrados en esta ficha</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }

    <!-- Modal previsualización aprendices -->
    @if (previewOpen()) {
      <div class="modal-overlay" (click)="previewOpen.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Aprendices Matriculados</h3>
            <button class="btn-icon" (click)="previewOpen.set(false)"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>
          <div class="table-wrap mt-2" style="max-height:400px;overflow:auto;">
            <table class="data-table">
              <thead>
                <tr><th>#</th><th>Nombre</th><th>Documento</th></tr>
              </thead>
              <tbody>
                @for (a of aprendicesPreview(); track a.id; let i = $index) {
                  <tr><td>{{ i+1 }}</td><td>{{ a.apellido }}, {{ a.nombre }}</td><td>{{ a.numDoc }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }

    <!-- Modal ver firma/foto -->
    @if (firmaModalUrl()) {
      <div class="modal-overlay" (click)="firmaModalUrl.set(null)">
        <div class="modal" style="max-width:480px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Vista Previa</h3>
            <button class="btn-icon" (click)="firmaModalUrl.set(null)"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>
          <img [src]="firmaModalUrl()" style="width:100%;border:1px solid var(--border);border-radius:8px;margin-top:8px;">
        </div>
      </div>
    }

    <!-- Modal ver nota de justificación pendiente -->
    @if (notaJustificacionModal()) {
      <div class="modal-overlay" (click)="notaJustificacionModal.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Justificación de {{ notaJustificacionModal()?.apellido }}, {{ notaJustificacionModal()?.nombre }}</h3>
            <button class="btn-icon" (click)="notaJustificacionModal.set(null)"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>
          <p class="mt-2">{{ notaJustificacionModal()?.nota || 'Sin nota.' }}</p>
          @if (notaJustificacionModal()?.soporteUrl) {
            <a [href]="notaJustificacionModal()?.soporteUrl" target="_blank" class="btn btn-outline btn-sm mt-2">
              <lucide-icon name="paperclip" [size]="14"></lucide-icon> Ver soporte adjunto
            </a>
          }
          <div class="btn-row mt-4">
            <button class="btn btn-red" (click)="resolverJustificacion(notaJustificacionModal()!.id, false); notaJustificacionModal.set(null)">Rechazar</button>
            <button class="btn btn-blue" (click)="resolverJustificacion(notaJustificacionModal()!.id, true); notaJustificacionModal.set(null)">Aprobar</button>
          </div>
        </div>
      </div>
    }

    <!-- Modal falla justificada -->
    @if (fallaModalOpen()) {
      <div class="modal-overlay" (click)="fallaModalOpen.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Falla Justificada</h3>
            <button class="btn-icon" (click)="fallaModalOpen.set(false)"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>
          <div class="form-group mt-3">
            <label class="form-label">Nota / Justificación</label>
            <textarea class="form-control" rows="3" [(ngModel)]="fallaNota"></textarea>
          </div>
          <div class="form-group mt-3">
            <label class="form-label">Soporte (imagen)</label>
            <input type="file" accept="image/*" (change)="onSoporteChange($event)">
            @if (fallaSoporteUrl) {
              <p class="text-sm text-muted mt-1">Soporte seleccionado: {{ fallaSoporteUrl }}</p>
            }
          </div>
          <div class="btn-row mt-4">
            <button class="btn btn-outline" (click)="fallaModalOpen.set(false)">Cancelar</button>
            <button class="btn btn-blue" (click)="confirmarFalla()">Guardar</button>
          </div>
        </div>
      </div>
    }

    <!-- Modal de Reporte / Vista previa -->
    @if (reporteModalOpen()) {
      <div class="modal-overlay" style="z-index:300; overflow:auto; align-items:flex-start; padding:24px;">
        <div class="modal reporte-modal" style="max-width:900px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Vista Previa del Reporte</h3>
            <button class="btn-icon" (click)="cerrarReporte()"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>

          <div id="reporte-content" class="reporte-content">
            <!-- Encabezado -->
            <div class="rep-header">
              <div class="rep-logo">SENA</div>
              <div class="rep-info">
                <h2>REGISTRO DE ASISTENCIA</h2>
                <p><strong>Ficha:</strong> {{ sesionActiva()?.ficha?.codigo }} — {{ sesionActiva()?.ficha?.programa }}</p>
                <p><strong>Fecha de sesión:</strong> {{ sesionActiva()?.fecha }} | <strong>Horario:</strong> {{ sesionActiva()?.horaInicio }} — {{ sesionActiva()?.horaFin }}</p>
                <p><strong>Instructor:</strong> {{ user()?.nombre }} {{ user()?.apellido }}</p>
              </div>
            </div>

            <!-- Stats cards -->
            <div class="rep-stats">
              <div class="rep-stat" style="border-left:4px solid #16a34a">
                <div class="rep-stat-num" style="color:#16a34a">{{ presentes() }}</div>
                <div class="rep-stat-label">Presentes</div>
              </div>
              <div class="rep-stat" style="border-left:4px solid #f59e0b">
                <div class="rep-stat-num" style="color:#f59e0b">{{ pendientesCount() }}</div>
                <div class="rep-stat-label">Pendientes</div>
              </div>
              <div class="rep-stat" style="border-left:4px solid #2563eb">
                <div class="rep-stat-num" style="color:#2563eb">{{ totalAprendices() }}</div>
                <div class="rep-stat-label">Total</div>
              </div>
              <div class="rep-stat" style="border-left:4px solid #7c3aed">
                <div class="rep-stat-num" style="color:#7c3aed">{{ porcentajeAsistencia() }}%</div>
                <div class="rep-stat-label">% Asistencia</div>
              </div>
            </div>

            <!-- Gráficas -->
            <div class="rep-charts">
              <div class="rep-chart-box">
                <h4>Distribución</h4>
                <div class="rep-donut-wrap">
                  <div class="rep-donut" [style.--presentes]="presentesPorcentaje()" [style.--pendientes]="pendientesPorcentaje()">
                    <div class="rep-donut-hole">
                      <span class="rep-donut-num">{{ presentes() }}/{{ totalAprendices() }}</span>
                      <span class="rep-donut-lbl">Presentes</span>
                    </div>
                  </div>
                  <div class="rep-legend">
                    <div class="rep-legend-item"><span class="rep-dot" style="background:#16a34a"></span> Presentes ({{ presentes() }})</div>
                    <div class="rep-legend-item"><span class="rep-dot" style="background:#cbd5e1"></span> Pendientes ({{ pendientesCount() }})</div>
                  </div>
                </div>
              </div>
              <div class="rep-chart-box">
                <h4>Progreso</h4>
                <div class="rep-progress">
                  <div class="rep-progress-labels">
                    <span>Completado</span>
                    <span>{{ porcentajeAsistencia() }}%</span>
                  </div>
                  <div class="rep-progress-track">
                    <div class="rep-progress-fill" [style.width.%]="porcentajeAsistencia()"></div>
                  </div>
                  <div class="rep-progress-meta">
                    <span style="color:#16a34a">{{ presentes() }} confirmaron</span>
                    <span style="color:#f59e0b">{{ pendientesCount() }} faltan</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Alerta IPs duplicadas en reporte -->
            @if (ipsDuplicadas().length > 0) {
              <div class="rep-alerta-ip">
                <lucide-icon name="alert-triangle" [size]="16" style="color:#b45309;flex-shrink:0"></lucide-icon>
                <div>
                  <strong>Atención:</strong> Se detectaron {{ ipsDuplicadas().length }} IP(s) compartida(s) — posible falsificación:
                  <span class="rep-ip-list">{{ ipsDuplicadas().join(', ') }}</span>
                </div>
              </div>
            }

            <!-- Tabla -->
            <h4 class="rep-table-title">DETALLE DE APRENDICES</h4>
            <table class="rep-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Aprendiz</th>
                  <th>Documento</th>
                  <th>Hora</th>
                  <th>IP</th>
                  <th>Estado</th>
                  <th>Firma</th>
                </tr>
              </thead>
              <tbody>
                @for (a of todosAprendices(); track a.id || a.aprendizId; let i = $index) {
                  <tr [class.rep-ip-dup]="a.ipAddress && ipsDuplicadas().includes(a.ipAddress)">
                    <td>{{ i+1 }}</td>
                    <td>{{ a.apellido }}, {{ a.nombre }}</td>
                    <td>{{ a.numDoc }}</td>
                    <td>{{ a.horaRegistro ? (a.horaRegistro | date:'HH:mm') : '—' }}</td>
                    <td>
                      @if (a.ipAddress) {
                        <span class="rep-ip-badge">{{ a.ipAddress }}</span>
                        @if (ipsDuplicadas().includes(a.ipAddress)) {
                          <lucide-icon name="alert-triangle" [size]="12" style="color:#d97706;margin-left:4px;display:inline;vertical-align:middle"></lucide-icon>
                        }
                      } @else { <span style="color:#9ca3af">—</span> }
                    </td>
                    <td>
                      @if (a.estado === 'presente') {
                        <span class="rep-badge rep-b-presente">Presente</span>
                      } @else if (a.estado === 'falla_justificada') {
                        <span class="rep-badge rep-b-falla">Falla Just.</span>
                      } @else {
                        <span class="rep-badge rep-b-pendiente">Pendiente</span>
                      }
                    </td>
                    <td>
                      @if (a.firmaImagen) { <img [src]="a.firmaImagen" class="rep-firma"> }
                      @else { <span style="color:#9ca3af">—</span> }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            <div class="rep-footer">
              <p><strong>Reporte generado el:</strong> {{ hoy() | date:'dd/MM/yyyy HH:mm' }} | <strong>Servicio Nacional de Aprendizaje - SENA</strong></p>
            </div>
          </div>

          <div class="rep-actions">
            <button class="btn btn-outline" (click)="cerrarReporte()">Cerrar</button>
            <button class="btn btn-blue" [disabled]="reporteGenerando()" (click)="descargarPDF()">
              @if (reporteGenerando()) {
                <span class="spin">⟳</span> Generando...
              } @else {
                <lucide-icon name="download" [size]="14"></lucide-icon> Descargar PDF
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal de Reporte Mensual -->
    @if (reporteMensualOpen()) {
      <div class="modal-overlay" style="z-index:300; overflow:auto; align-items:flex-start; padding:24px;">
        <div class="modal reporte-modal" style="max-width:960px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Reporte Mensual de Asistencia</h3>
            <button class="btn-icon" (click)="cerrarReporteMensual()"><lucide-icon name="x" [size]="18"></lucide-icon></button>
          </div>

          <!-- Filtros -->
          <div class="rm-filtros">
            <div class="form-group">
              <label class="form-label">Ficha</label>
              <select class="form-control" [ngModel]="fichaSeleccionadaReporte()" (ngModelChange)="fichaSeleccionadaReporte.set($event)">
                <option value="">Selecciona una ficha...</option>
                @for (f of fichasInstructor(); track f.id) {
                  <option [value]="f.id">{{ f.codigo }} — {{ f.programa }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Mes</label>
              <input type="month" class="form-control" [ngModel]="mesReporte()" (ngModelChange)="mesReporte.set($event)">
            </div>
            <button class="btn btn-blue" [disabled]="cargandoReporteMensual() || !fichaSeleccionadaReporte() || !mesReporte()" (click)="generarReporteMensual()">
              @if (cargandoReporteMensual()) {
                <span class="spin">⟳</span> Buscando...
              } @else {
                <lucide-icon name="search" [size]="14"></lucide-icon> Buscar
              }
            </button>
          </div>

          @if (reporteMensualData()) {
            @if (reporteMensualData().totalSesiones === 0) {
              <div class="empty-state mt-3">
                <lucide-icon name="calendar-x" [size]="32" style="opacity:.4"></lucide-icon>
                <p>No hubo clases dictadas para esta ficha en el mes seleccionado</p>
              </div>
            } @else {
              <div id="reporte-mensual-content" class="reporte-content mt-3">
                <!-- Encabezado -->
                <div class="rep-header">
                  <div class="rep-logo">SENA</div>
                  <div class="rep-info">
                    <h2>REPORTE MENSUAL DE ASISTENCIA</h2>
                    <p><strong>Ficha:</strong> {{ fichaNombreReporte() }}</p>
                    <p><strong>Mes:</strong> {{ nombreMesReporte() }} | <strong>Instructor:</strong> {{ user()?.nombre }} {{ user()?.apellido }}</p>
                    <p><strong>Generado el:</strong> {{ hoy() | date:'dd/MM/yyyy' }}</p>
                  </div>
                </div>

                <!-- Resumen por aprendiz -->
                <h4 class="rep-table-title">RESUMEN DEL MES POR APRENDIZ</h4>
                <table class="rep-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Aprendiz</th>
                      <th>Documento</th>
                      <th>Clases</th>
                      <th>Presentes</th>
                      <th>Ausencias</th>
                      <th>Justificadas</th>
                      <th>% Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of reporteMensualData().resumenAprendices; track r.aprendizId; let i = $index) {
                      <tr>
                        <td>{{ i + 1 }}</td>
                        <td>{{ r.apellido }}, {{ r.nombre }}</td>
                        <td>{{ r.documento }}</td>
                        <td>{{ r.totalSesiones }}</td>
                        <td><span class="rep-badge rep-b-presente">{{ r.presentes }}</span></td>
                        <td>
                          @if (r.ausencias > 0) {
                            <span class="rep-badge" style="background:#fee2e2;color:#991b1b">{{ r.ausencias }}</span>
                          } @else { 0 }
                        </td>
                        <td>
                          @if (r.justificadas > 0) {
                            <span class="rep-badge rep-b-falla">{{ r.justificadas }}</span>
                          } @else { 0 }
                        </td>
                        <td>{{ r.porcentajeAsistencia }}%</td>
                      </tr>
                    }
                  </tbody>
                </table>

                <!-- Tablas semanales -->
                @for (semana of reporteMensualData().semanas; track semana.numero) {
                  <h4 class="rep-table-title">SEMANA {{ semana.numero }} ({{ formatFechaCorta(semana.fechaInicio) }} — {{ formatFechaCorta(semana.fechaFin) }})</h4>
                  <table class="rep-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Aprendiz</th>
                        <th>Documento</th>
                        <th>Hora</th>
                        <th>IP</th>
                        <th>Estado</th>
                        <th>Firma</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (fila of semana.filas; track fila.sesionId + '_' + fila.aprendizId; let i = $index) {
                        <tr>
                          <td>{{ i + 1 }}</td>
                          <td>{{ formatFechaCorta(fila.fecha) }}</td>
                          <td>{{ fila.apellido }}, {{ fila.nombre }}</td>
                          <td>{{ fila.documento }}</td>
                          <td>{{ fila.horaRegistro ? (fila.horaRegistro | date:'HH:mm') : '—' }}</td>
                          <td>
                            @if (fila.ipAddress) { <span class="rep-ip-badge">{{ fila.ipAddress }}</span> }
                            @else { <span style="color:#9ca3af">—</span> }
                          </td>
                          <td>
                            @if (fila.estado === 'presente') {
                              <span class="rep-badge rep-b-presente">Presente</span>
                            } @else if (fila.estado === 'falla_justificada') {
                              <span class="rep-badge rep-b-falla">Falla Just.</span>
                            } @else {
                              <span class="rep-badge" style="background:#fee2e2;color:#991b1b">Ausente</span>
                            }
                          </td>
                          <td>
                            @if (fila.firmaImagen) { <img [src]="fila.firmaImagen" class="rep-firma"> }
                            @else { <span style="color:#9ca3af">—</span> }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }

                <div class="rep-footer">
                  <p><strong>Reporte generado el:</strong> {{ hoy() | date:'dd/MM/yyyy HH:mm' }} | <strong>Servicio Nacional de Aprendizaje - SENA</strong></p>
                </div>
              </div>
            }
          }

          <div class="rep-actions">
            <button class="btn btn-outline" (click)="cerrarReporteMensual()">Cerrar</button>
            @if (reporteMensualData() && reporteMensualData().totalSesiones > 0) {
              <button class="btn btn-blue" [disabled]="reporteMensualGenerando()" (click)="descargarReporteMensualPDF()">
                @if (reporteMensualGenerando()) {
                  <span class="spin">⟳</span> Generando...
                } @else {
                  <lucide-icon name="download" [size]="14"></lucide-icon> Descargar PDF
                }
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Base ─────────────────────────────────────────── */
    .page-header h2 { font-size: 1.4rem; color: var(--text); }
    .text-muted { color: var(--text-muted); }
    .text-sm { font-size: 13px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }

    /* ── Cards ────────────────────────────────────────── */
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .card-title { font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 4px; }
    .section-subtitle { font-size: .95rem; font-weight: 700; color: var(--text); }

    /* ── Horarios ─────────────────────────────────────── */
    .horario-list { display: flex; flex-direction: column; gap: 8px; }
    .horario-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; transition: all .15s; background: var(--surface); }
    .horario-row:hover { border-color: var(--blue); background: #f8fafc; }
    .horario-row.selected { border-color: var(--blue); background: #eff6ff; }
    .horario-info { display: flex; flex-direction: column; gap: 2px; }
    .horario-ficha { font-weight: 700; font-size: 14px; color: var(--text); }
    .horario-prog { font-size: 12px; color: var(--text-muted); }
    .horario-time { font-size: 12px; color: var(--blue); font-weight: 600; }
    .empty-state { text-align: center; color: var(--text-muted); padding: 24px; }
    .form-section { background: var(--gray-100); border-radius: 10px; padding: 16px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
    .gap-3 { gap: 12px; }

    /* ── Botones ──────────────────────────────────────── */
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .btn-blue { background: #2563eb; color: #fff; }
    .btn-blue:hover { background: #1d4ed8; }
    .btn-outline { background: #fff; border-color: #d1d5db; color: #374151; }
    .btn-outline:hover { background: #f9fafb; border-color: #9ca3af; }
    .btn-red { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
    .btn-white { background: #fff; color: #1f2937; border: 1px solid #e5e7eb; }
    .btn-white:hover { background: #f3f4f6; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:hover { background: #b91c1c; }
    .btn-sm { padding: 6px 10px; font-size: 12px; }
    .btn-icon { background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; }
    .btn-icon-sm { width: 28px; height: 28px; border-radius: 6px; background: none; border: 1px solid var(--border); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: var(--text-muted); }
    .btn-icon-sm:hover { background: var(--gray-100); color: var(--text); }
    .btn-icon-sm.btn-aprobar { border-color: #86efac; color: #16a34a; }
    .btn-icon-sm.btn-aprobar:hover { background: #dcfce7; }
    .btn-icon-sm.btn-rechazar { border-color: #fca5a5; color: #dc2626; }
    .btn-icon-sm.btn-rechazar:hover { background: #fee2e2; }
    .btn-row { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
    .form-control { padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; background: var(--surface); color: var(--text); outline: none; }
    .form-control:focus { border-color: var(--blue); }

    /* ── Session Card ─────────────────────────────────── */
    .session-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 14px; padding: 20px 24px; color: #fff; }
    .session-card h3 { margin: 0; font-size: 1.15rem; font-weight: 700; }
    .session-card .text-muted { color: #94a3b8; }
    .session-badge { display: inline-block; background: #16a34a; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 20px; letter-spacing: .08em; margin-bottom: 8px; }
    .session-info-main { flex: 1; }
    .session-actions { display: flex; gap: 8px; }

    /* ── Stats Grid ───────────────────────────────────── */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); }
    .stat-card.presentes { border-left: 4px solid #16a34a; }
    .stat-card.pendientes { border-left: 4px solid #f59e0b; }
    .stat-card.total { border-left: 4px solid #3b82f6; }
    .stat-card.porcentaje { border-left: 4px solid #8b5cf6; }
    .stat-icon { width: 40px; height: 40px; border-radius: 10px; background: var(--gray-100); display: flex; align-items: center; justify-content: center; color: var(--text-muted); flex-shrink: 0; }
    .stat-body { display: flex; flex-direction: column; }
    .stat-number { font-size: 1.4rem; font-weight: 800; color: var(--text); line-height: 1; }
    .stat-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

    /* ── Charts Grid ──────────────────────────────────── */
    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
    .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .chart-title { font-size: 14px; font-weight: 700; color: var(--text); margin: 0 0 16px 0; }

    /* Donut Chart CSS */
    .donut-wrap { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; justify-content: center; }
    .donut-chart { width: 140px; height: 140px; border-radius: 50%; position: relative; background: conic-gradient(
      #16a34a calc(var(--presentes) * 1%),
      #cbd5e1 calc(var(--presentes) * 1%) calc((var(--presentes) + var(--pendientes)) * 1%),
      #cbd5e1 0
    ); }
    .donut-hole { position: absolute; inset: 18px; background: var(--surface); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .donut-total { font-size: 18px; font-weight: 800; color: var(--text); }
    .donut-label { font-size: 11px; color: var(--text-muted); }
    .donut-legend { display: flex; flex-direction: column; gap: 8px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text); }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }

    /* Progress Bar */
    .progress-section { display: flex; flex-direction: column; gap: 10px; }
    .progress-header { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; }
    .progress-label { color: var(--text-muted); }
    .progress-value { color: var(--text); }
    .progress-track { width: 100%; height: 10px; background: var(--gray-100); border-radius: 10px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #16a34a, #22c55e); border-radius: 10px; transition: width .6s ease; }
    .progress-meta { display: flex; justify-content: space-between; font-size: 12px; }
    .meta-presentes { color: #16a34a; font-weight: 600; }
    .meta-pendientes { color: #f59e0b; font-weight: 600; }

    /* Alerta IP */
    .alerta-ip { display: flex; gap: 10px; align-items: flex-start; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 12px 14px; color: #92400e; font-size: 13px; }
    .alerta-ip strong { color: #b45309; }
    .ip-list { font-family: monospace; font-size: 12px; background: #fef3c7; padding: 1px 6px; border-radius: 4px; margin: 0 4px; }

    /* ── Table Card ───────────────────────────────────── */
    .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .table-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 14px 18px; border-bottom: 1px solid var(--border); background: var(--surface2); }
    .table-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--text); margin: 0; }
    .table-filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; background: var(--gray-100); color: var(--text-muted); }
    .filter-badge.presentes { background: #dcfce7; color: #166534; }
    .filter-badge.pendientes { background: #fffbeb; color: #92400e; }
    .table-wrap { overflow: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { background: var(--surface2); padding: 10px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .data-table td { padding: 10px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
    .data-table tr:hover { background: var(--gray-100); }
    .data-table tr.fila-pendiente { background: #fffbeb; }
    .data-table tr.fila-pendiente td { color: #92400e; }
    .empty-cell { text-align: center; color: var(--text-muted); padding: 24px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .badge.presente { background: #dcfce7; color: #166534; }
    .badge.falla { background: #fee2e2; color: #991b1b; }
    .badge.pendiente { background: #fef3c7; color: #92400e; }
    .badge.falla-injustificada { background: #fecaca; color: #7f1d1d; }
    .ip-badge { font-size: 11px; font-family: monospace; background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 4px; border: 1px solid #bfdbfe; cursor: default; }
    .ip-duplicada { background: #fffbeb !important; }
    .ip-duplicada td { border-left: 3px solid #f59e0b; }
    .face-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 50%; border: 2px solid var(--border); cursor: pointer; background: #fff; }
    .face-placeholder { width: 40px; height: 40px; border-radius: 50%; background: var(--gray-100); display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
    .firma-thumb { width: 60px; height: 30px; object-fit: contain; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; background: #fff; }
    .aprendiz-name { font-weight: 600; }
    .pendiente-tag { font-size: 10px; color: #f59e0b; font-weight: 700; margin-top: 2px; display: block; }

    /* ── Modal ────────────────────────────────────────── */
    .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal { background: var(--surface); border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-lg); width: 100%; max-width: 640px; padding: 20px; max-height: 90vh; overflow: auto; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }

    /* PDF template oculto */
    .pdf-template { position: fixed; left: -9999px; top: 0; width: 210mm; background: #fff; padding: 24px; color: #000; font-family: 'Segoe UI', Arial, sans-serif; }
    .pdf-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; border-bottom: 3px solid #00324d; padding-bottom: 14px; }
    .pdf-logo { flex-shrink: 0; }
    .logo-box { width: 60px; height: 60px; background: #00324d; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; border-radius: 6px; }
    .pdf-header-info { flex: 1; }
    .pdf-header-info h2 { margin: 0 0 6px 0; font-size: 20px; color: #00324d; font-weight: 800; }
    .pdf-header-info p { margin: 2px 0; font-size: 12px; color: #374151; }

    .pdf-resumen { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .pdf-resumen-title { font-size: 13px; font-weight: 800; color: #00324d; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .pdf-stats-row { display: flex; gap: 16px; margin-bottom: 14px; }
    .pdf-stat { text-align: center; flex: 1; }
    .pdf-stat-number { font-size: 22px; font-weight: 800; }
    .pdf-stat-label { font-size: 11px; color: #64748b; font-weight: 600; }
    .pdf-chart { margin-top: 10px; }
    .pdf-bar-labels { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 3px; }
    .pdf-bar-track { width: 100%; height: 14px; background: #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 10px; }
    .pdf-bar-fill { height: 100%; background: linear-gradient(90deg, #16a34a, #22c55e); border-radius: 8px; }
    .pdf-bar-fill.pendientes { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

    .pdf-table-title { font-size: 13px; font-weight: 800; color: #00324d; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .pdf-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .pdf-table th { background: #00324d; color: #fff; border: 1px solid #00324d; padding: 7px 6px; text-align: left; font-weight: 700; font-size: 10px; }
    .pdf-table td { border: 1px solid #cbd5e1; padding: 6px; color: #1f2937; vertical-align: middle; }
    .pdf-table tr:nth-child(even) { background: #f8fafc; }
    .pdf-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; }
    .pdf-presente { background: #dcfce7; color: #166534; }
    .pdf-falla { background: #fee2e2; color: #991b1b; }
    .pdf-pendiente { background: #fef3c7; color: #92400e; }
    .pdf-firma { width: 60px; height: 30px; object-fit: contain; }
    .pdf-footer { margin-top: 20px; font-size: 10px; color: #64748b; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 10px; }

    /* ── Reporte Modal ────────────────────────────────── */
    /* Columna flex: header/filtros/acciones quedan fijos y solo .reporte-content
       (o el empty-state) hace scroll interno, así el botón de descarga siempre
       queda alcanzable sin importar qué tan largo sea el reporte. */
    .reporte-modal { background: #f1f5f9; padding: 0; overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; }
    .reporte-modal .modal-header { flex-shrink: 0; padding: 16px 24px 0; margin-bottom: 0; }
    .reporte-modal .empty-state { flex-shrink: 0; }
    .reporte-content { background: #fff; padding: 24px; margin: 0; overflow-y: auto; flex: 1 1 auto; min-height: 0; }
    .rm-filtros { display: flex; align-items: flex-end; gap: 12px; padding: 16px 24px; background: #fff; border-bottom: 1px solid var(--border); flex-wrap: wrap; flex-shrink: 0; }
    .rm-filtros .form-group { min-width: 200px; }
    .rep-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; border-bottom: 3px solid #00324d; padding-bottom: 14px; }
    .rep-logo { width: 60px; height: 60px; background: #00324d; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; border-radius: 6px; flex-shrink: 0; }
    .rep-info { flex: 1; }
    .rep-info h2 { margin: 0 0 6px 0; font-size: 20px; color: #00324d; font-weight: 800; }
    .rep-info p { margin: 2px 0; font-size: 12px; color: #374151; }
    .rep-stats { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .rep-stat { flex: 1; min-width: 110px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
    .rep-stat-num { font-size: 22px; font-weight: 800; }
    .rep-stat-label { font-size: 11px; color: #64748b; font-weight: 600; margin-top: 2px; }
    .rep-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .rep-chart-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
    .rep-chart-box h4 { margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #00324d; }
    .rep-donut-wrap { display: flex; align-items: center; gap: 16px; }
    .rep-donut { width: 100px; height: 100px; border-radius: 50%; position: relative; background: conic-gradient( #16a34a calc(var(--presentes) * 1%), #cbd5e1 calc(var(--presentes) * 1%) calc((var(--presentes) + var(--pendientes)) * 1%), #cbd5e1 0 ); }
    .rep-donut-hole { position: absolute; inset: 14px; background: #fff; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .rep-donut-num { font-size: 14px; font-weight: 800; color: #1f2937; }
    .rep-donut-lbl { font-size: 9px; color: #64748b; }
    .rep-legend { display: flex; flex-direction: column; gap: 6px; }
    .rep-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #374151; }
    .rep-dot { width: 10px; height: 10px; border-radius: 50%; }
    .rep-progress { display: flex; flex-direction: column; gap: 8px; }
    .rep-progress-labels { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; }
    .rep-progress-track { width: 100%; height: 12px; background: #e2e8f0; border-radius: 8px; overflow: hidden; }
    .rep-progress-fill { height: 100%; background: linear-gradient(90deg, #16a34a, #22c55e); border-radius: 8px; transition: width .6s ease; }
    .rep-progress-meta { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; }
    .rep-table-title { font-size: 13px; font-weight: 800; color: #00324d; margin: 16px 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .rep-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .rep-table th { background: #00324d; color: #fff; padding: 8px 6px; text-align: left; font-weight: 700; font-size: 10px; }
    .rep-table td { border: 1px solid #e2e8f0; padding: 6px; color: #1f2937; vertical-align: middle; }
    .rep-table tr:nth-child(even) { background: #f8fafc; }
    .rep-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }
    .rep-b-presente { background: #dcfce7; color: #166534; }
    .rep-b-falla { background: #fee2e2; color: #991b1b; }
    .rep-b-pendiente { background: #fef3c7; color: #92400e; }
    .rep-firma { width: 60px; height: 30px; object-fit: contain; }
    .rep-footer { margin-top: 16px; font-size: 10px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    .rep-actions { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 24px; background: #fff; border-top: 1px solid #e2e8f0; flex-shrink: 0; }
    .spin { display: inline-block; animation: spin 1s linear infinite; }
    .rep-alerta-ip { display: flex; gap: 10px; align-items: flex-start; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 12px 14px; color: #92400e; font-size: 13px; margin-bottom: 16px; }
    .rep-alerta-ip strong { color: #b45309; }
    .rep-ip-list { font-family: monospace; font-size: 12px; background: #fef3c7; padding: 1px 6px; border-radius: 4px; margin: 0 4px; }
    .rep-ip-badge { font-size: 10px; font-family: monospace; background: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 4px; border: 1px solid #bfdbfe; }
    .rep-table tr.rep-ip-dup { background: #fffbeb !important; }
    .rep-table tr.rep-ip-dup td { border-left: 3px solid #f59e0b; }

    /* ── Responsive: reporte mensual en pantallas pequeñas ─── */
    @media (max-width: 640px) {
      .modal-overlay { padding: 8px; }
      .reporte-modal { max-height: 96vh; }
      .reporte-modal .modal-header { padding: 12px 14px 0; }
      .rm-filtros { padding: 12px 14px; flex-direction: column; align-items: stretch; }
      .rm-filtros .form-group { min-width: 0; width: 100%; }
      .rm-filtros button { width: 100%; justify-content: center; }
      .reporte-content { padding: 14px; }
      .rep-table { font-size: 10px; }
      .rep-table th, .rep-table td { padding: 4px; }
      .rep-actions { padding: 12px 14px; }
    }
  `],
})
export class InstructorAsistenciaComponent implements OnInit, OnDestroy {
  user = computed(() => this.auth.currentUser());
  horariosHoy = signal<any[]>([]);
  horarioSeleccionado = signal<any>(null);
  sesionActiva = signal<any>(null);
  registros = signal<any[]>([]);
  pendientes = signal<any[]>([]);
  aprendicesPreview = signal<any[]>([]);
  previewOpen = signal(false);
  firmaModalUrl = signal<string | null>(null);
  fallaModalOpen = signal(false);
  fallaAprendizId = signal<number | null>(null);
  notaJustificacionModal = signal<any>(null);
  fallaNota = '';
  fallaSoporteFile: File | null = null;
  fallaSoporteUrl = '';
  pdfTemplateVisible = signal(false);
  reporteModalOpen = signal(false);
  reporteGenerando = signal(false);
  hoy = signal(new Date());

  // ── Reporte mensual ──────────────────────────────────────────────
  reporteMensualOpen = signal(false);
  reporteMensualGenerando = signal(false);
  cargandoReporteMensual = signal(false);
  fichasInstructor = signal<any[]>([]);
  fichaSeleccionadaReporte = signal<string>('');
  mesReporte = signal<string>('');
  reporteMensualData = signal<any>(null);

  fichaNombreReporte = computed(() => {
    const f = this.fichasInstructor().find((x: any) => x.id === this.fichaSeleccionadaReporte());
    return f ? `${f.codigo} — ${f.programa}` : '';
  });
  nombreMesReporte = computed(() => {
    const [anioStr, mesStr] = (this.mesReporte() || '').split('-');
    if (!anioStr || !mesStr) return '';
    const nombres = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${nombres[parseInt(mesStr, 10) - 1]} de ${anioStr}`;
  });

  sesionForm = { fecha: '', horaInicio: '', horaFin: '' };

  // ── Computed stats ────────────────────────────────────────────────
  presentes = computed(() => this.registros().filter((r: any) => r.estado === 'presente').length);
  pendientesCount = computed(() => this.pendientes().length);
  totalAprendices = computed(() => this.registros().length + this.pendientes().length);
  porcentajeAsistencia = computed(() => {
    const total = this.totalAprendices();
    if (total === 0) return 0;
    return Math.round((this.presentes() / total) * 100);
  });
  presentesPorcentaje = computed(() => {
    const total = this.totalAprendices();
    if (total === 0) return 0;
    return Math.round((this.presentes() / total) * 100);
  });
  pendientesPorcentaje = computed(() => {
    const total = this.totalAprendices();
    if (total === 0) return 0;
    return Math.round((this.pendientesCount() / total) * 100);
  });

  // Tabla combinada: registros + pendientes
  todosAprendices = computed(() => {
    const regs = this.registros().map((r: any) => ({
      ...r.aprendiz,
      ...r,
      aprendizId: r.aprendizId,
      horaRegistro: r.horaRegistro,
      estado: r.estado,
      firmaImagen: r.firmaImagen,
      ipAddress: r.ipAddress,
      lastAttendancePhoto: r.lastAttendancePhoto,
      facePhoto: r.aprendiz?.facePhoto,
    }));
    const pends = this.pendientes().map((p: any) => ({
      id: p.id,
      aprendizId: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      numDoc: p.documento || p.numDoc,
      facePhoto: p.facePhoto,
      horaRegistro: null,
      estado: null,
      firmaImagen: null,
      ipAddress: null,
      lastAttendancePhoto: null,
    }));
    return [...regs, ...pends];
  });

  ipsDuplicadas = computed(() => {
    const conteo: Record<string, number> = {};
    for (const r of this.registros()) {
      const ip = r.ipAddress;
      if (ip) conteo[ip] = (conteo[ip] || 0) + 1;
    }
    return Object.entries(conteo)
      .filter(([, count]) => count > 1)
      .map(([ip]) => ip);
  });

  private sse: EventSource | null = null;
  private refreshInterval: any;

  constructor(
    private api: ApiService,
    private asistencia: AsistenciaService,
    private auth: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.cargarHorariosHoy();
    this.cargarSesionActiva();
  }

  ngOnDestroy() {
    this.cerrarSSE();
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  cargarHorariosHoy() {
    const uid = this.user()?.perfilId;
    if (!uid) return;
    this.api.getHorariosByInstructor(uid).subscribe((list: any[]) => {
      const dias = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
      const hoy = new Date();
      const diaActual = dias[hoy.getDay()];
      const filtrados = list.filter((h: any) => h.diaSemana === diaActual);
      
      this.api.getHFichas().subscribe((fichas: any[]) => {
        const enriquecidos = filtrados.map(h => ({
          ...h,
          ficha: fichas.find(f => String(f.id) === String(h.fichaId))
        }));
        this.horariosHoy.set(enriquecidos);
      });
    });
  }

  async cargarSesionActiva() {
    const uid = this.user()?.perfilId;
    if (!uid) return;
    this.asistencia.getSesionesActivasInstructor(uid).subscribe({
      next: (sesiones: any) => {
        if (sesiones.length > 0) {
          this.sesionActiva.set(sesiones[0]);
          this.cargarDetalleSesion(sesiones[0].id);
        }
      },
      error: () => {},
    });
  }

  seleccionarHorario(h: any) {
    this.horarioSeleccionado.set(h);
    this.sesionForm.fecha = new Date().toISOString().split('T')[0];
    this.sesionForm.horaInicio = h.horaInicio;
    this.sesionForm.horaFin = h.horaFin;
  }

  verPrevisualizacion() {
    const h = this.horarioSeleccionado();
    if (!h) return;
    this.api.getHorariosByFicha(h.fichaId).subscribe(() => {
      this.api.getAprendices().subscribe((aprendices: any[]) => {
        this.aprendicesPreview.set(aprendices.filter((a: any) => a.fichaId === h.fichaId));
        this.previewOpen.set(true);
      });
    });
  }

  iniciarSesion() {
    const h = this.horarioSeleccionado();
    if (!h) return;
    this.asistencia.crearSesion({
      horarioId: h.id,
      fecha: this.sesionForm.fecha,
      horaInicio: this.sesionForm.horaInicio,
      horaFin: this.sesionForm.horaFin,
    }).subscribe({
      next: (sesion: any) => {
        this.sesionActiva.set(sesion);
        this.cargarDetalleSesion(sesion.id);
        this.toast.success('Sesión de asistencia iniciada');
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Error al iniciar sesión'),
    });
  }

  cargarDetalleSesion(sesionId: number) {
    this.asistencia.getSesion(sesionId).subscribe((sesion: any) => {
      this.sesionActiva.set(sesion);
      this.registros.set(sesion.registros ?? []);
      this.cargarPendientes(sesionId);
      this.conectarSSE(sesionId);
      this.cdr.detectChanges();
    });
  }

  cargarPendientes(sesionId: number) {
    this.asistencia.getPendientes(sesionId).subscribe((list: any) => {
      this.pendientes.set(list);
      this.cdr.detectChanges();
    });
  }

  conectarSSE(sesionId: number) {
    this.cerrarSSE();
    this.sse = this.asistencia.connectStream(sesionId);
    this.sse.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'firma') {
          this.registros.update((regs) => {
            const idx = regs.findIndex((r: any) => r.aprendizId === data.registro.aprendizId);
            if (idx >= 0) {
              const updated = [...regs];
              updated[idx] = { ...updated[idx], ...data.registro };
              return updated;
            }
            return [...regs, data.registro];
          });
          this.cargarPendientes(sesionId);
          this.cdr.detectChanges();
        }
      } catch (_) {}
    };
    this.sse.onerror = () => {};
  }

  cerrarSSE() {
    if (this.sse) { this.sse.close(); this.sse = null; }
  }

  marcarFalla(aprendizId: number) {
    this.fallaAprendizId.set(aprendizId);
    this.fallaNota = '';
    this.fallaSoporteFile = null;
    this.fallaSoporteUrl = '';
    this.fallaModalOpen.set(true);
  }

  onSoporteChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.fallaSoporteFile = file;
    if (file) {
      this.api.uploadAdjunto(file).subscribe({
        next: (res: any) => { this.fallaSoporteUrl = res.url; },
        error: () => { this.toast.error('Error al subir soporte'); },
      });
    }
  }

  confirmarFalla() {
    const sesionId = this.sesionActiva()?.id;
    const aprendizId = this.fallaAprendizId();
    if (!sesionId || !aprendizId) return;
    this.asistencia.marcarFallaJustificada({ sesionId, aprendizId, nota: this.fallaNota, soporte: this.fallaSoporteUrl || undefined }).subscribe({
      next: () => {
        this.fallaModalOpen.set(false);
        this.toast.success('Falla justificada registrada');
        this.cargarDetalleSesion(sesionId);
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Error'),
    });
  }

  verFirma(url: string) {
    this.firmaModalUrl.set(url);
  }

  verNotaJustificacion(registro: any) {
    this.notaJustificacionModal.set(registro);
  }

  quitarAsistencia(registroId: string) {
    if (!registroId) return;
    if (!confirm('¿Quitar la marca de asistencia? El aprendiz volverá a quedar como pendiente.')) return;
    const sesionId = this.sesionActiva()?.id;
    this.asistencia.quitarAsistencia(registroId).subscribe({
      next: () => {
        this.toast.success('Asistencia removida');
        if (sesionId) this.cargarDetalleSesion(sesionId);
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Error al quitar la asistencia'),
    });
  }

  resolverJustificacion(registroId: string, aprobar: boolean) {
    if (!registroId) return;
    const sesionId = this.sesionActiva()?.id;
    this.asistencia.resolverJustificacion(registroId, aprobar).subscribe({
      next: () => {
        this.toast.success(aprobar ? 'Justificación aprobada' : 'Justificación rechazada');
        if (sesionId) this.cargarDetalleSesion(sesionId);
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Error al resolver la justificación'),
    });
  }

  cerrarSesion() {
    const id = this.sesionActiva()?.id;
    if (!id) return;
    if (!confirm('¿Estás seguro de cerrar la sesión de asistencia?')) return;
    this.asistencia.cerrarSesion(id).subscribe({
      next: () => {
        this.sesionActiva.set(null);
        this.registros.set([]);
        this.pendientes.set([]);
        this.cerrarSSE();
        this.toast.success('Sesión cerrada correctamente');
        this.cargarHorariosHoy();
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Error al cerrar'),
    });
  }

  abrirReporte() {
    this.reporteModalOpen.set(true);
  }

  async descargarPDF() {
    const el = document.getElementById('reporte-content');
    if (!el) return;
    this.reporteGenerando.set(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fecha = this.sesionActiva()?.fecha || new Date().toISOString().split('T')[0];
      pdf.save(`Asistencia_${this.sesionActiva()?.ficha?.codigo}_${fecha}.pdf`);
      this.toast.success('Reporte descargado correctamente');
    } catch (e) {
      this.toast.error('Error al generar PDF');
    } finally {
      this.reporteGenerando.set(false);
    }
  }

  cerrarReporte() {
    this.reporteModalOpen.set(false);
  }

  // ── Reporte mensual ──────────────────────────────────────────────
  abrirReporteMensual() {
    this.reporteMensualData.set(null);
    if (!this.mesReporte()) {
      const hoy = new Date();
      this.mesReporte.set(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`);
    }
    this.reporteMensualOpen.set(true);
    this.cargarFichasInstructor();
  }

  cargarFichasInstructor() {
    const uid = this.user()?.perfilId;
    if (!uid) return;
    this.api.getHorariosByInstructor(uid).subscribe((list: any[]) => {
      const fichaIds = [...new Set(list.map((h: any) => h.fichaId).filter(Boolean))];
      this.api.getHFichas().subscribe((fichas: any[]) => {
        const propias = fichas.filter((f: any) => fichaIds.includes(f.id));
        this.fichasInstructor.set(propias);
        if (!this.fichaSeleccionadaReporte() && propias.length) {
          this.fichaSeleccionadaReporte.set(propias[0].id);
        }
        this.cdr.detectChanges();
      });
    });
  }

  generarReporteMensual() {
    const fichaId = this.fichaSeleccionadaReporte();
    const mes = this.mesReporte();
    if (!fichaId || !mes) return;
    const [anioStr, mesStr] = mes.split('-');
    this.cargandoReporteMensual.set(true);
    this.asistencia.getReporteMensual(fichaId, parseInt(anioStr, 10), parseInt(mesStr, 10)).subscribe({
      next: (data: any) => {
        this.reporteMensualData.set(data);
        this.cargandoReporteMensual.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Error al generar el reporte mensual');
        this.cargandoReporteMensual.set(false);
      },
    });
  }

  cerrarReporteMensual() {
    this.reporteMensualOpen.set(false);
  }

  formatFechaCorta(fecha: string): string {
    if (!fecha) return '—';
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  async descargarReporteMensualPDF() {
    const el = document.getElementById('reporte-mensual-content');
    if (!el) return;
    this.reporteMensualGenerando.set(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const ficha = this.fichasInstructor().find((f: any) => f.id === this.fichaSeleccionadaReporte());
      pdf.save(`ReporteMensual_${ficha?.codigo ?? 'ficha'}_${this.mesReporte()}.pdf`);
      this.toast.success('Reporte mensual descargado correctamente');
    } catch (e) {
      this.toast.error('Error al generar PDF');
    } finally {
      this.reporteMensualGenerando.set(false);
    }
  }
}
