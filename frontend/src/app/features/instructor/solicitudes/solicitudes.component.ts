import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DIAS_LABELS } from '../../../core/models/user.model';
import { LucideAngularModule } from 'lucide-angular';
import { SearchableSelectComponent, SSOption } from '../../../shared/components/searchable-select.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-instructor-solicitudes',
  imports: [FormsModule, DatePipe, UpperCasePipe, LucideAngularModule, SearchableSelectComponent],
  template: `
    <div><h2>Solicitudes de Cambio</h2><p class="text-muted text-sm">Proponer modificaciones de horario al administrador</p></div>

    <!-- PASO 1: Seleccionar horario del área -->
    <div class="section-block mt-4">
      <div class="section-title">
        <div class="step-badge">1</div>
        <span>Selecciona el horario a modificar</span>
        @if (esLider()) {
          <span class="lider-badge"><lucide-icon name="shield-check" [size]="12"></lucide-icon> Mostrando horarios de tu área</span>
        }
      </div>

      <!-- Filtros de búsqueda -->
      <div class="filtros-row mt-3">
        <div class="search-input-wrap">
          <lucide-icon name="search" [size]="14" class="search-icon"></lucide-icon>
          <input class="search-input" [(ngModel)]="filtroInstructor" placeholder="Buscar por instructor...">
        </div>
        <div class="search-input-wrap">
          <lucide-icon name="book-open" [size]="14" class="search-icon"></lucide-icon>
          <input class="search-input" [(ngModel)]="filtroFicha" placeholder="Buscar por ficha...">
        </div>
        <div class="search-input-wrap">
          <lucide-icon name="building-2" [size]="14" class="search-icon"></lucide-icon>
          <input class="search-input" [(ngModel)]="filtroAmbiente" placeholder="Buscar por ambiente...">
        </div>
        @if (filtroInstructor || filtroFicha || filtroAmbiente) {
          <button class="btn-clear" (click)="limpiarFiltros()">
            <lucide-icon name="x" [size]="13"></lucide-icon> Limpiar
          </button>
        }
      </div>

      <div class="horarios-grid mt-3">
        @for (h of horariosFiltrados(); track h.id) {
        <div class="sel-card" [class.selected]="selectedId() === h.id" (click)="selectHorario(h)">
          <div class="sel-time">{{ h.horaInicio?.slice(0,5) }} — {{ h.horaFin?.slice(0,5) }}</div>
          <div class="sel-dia">{{ LABELS[h.diaSemana] }}</div>
          <div class="sel-instructor" style="font-size:11px;font-weight:600;margin-top:3px;">
            <lucide-icon name="user" [size]="10"></lucide-icon>
            {{ h.instructor?.nombre }} {{ h.instructor?.apellido }}
          </div>
          <div class="sel-info" style="margin-top:2px; font-size:11px; color:var(--text-muted);">{{ h.ficha?.codigo }}</div>
          <div class="sel-amb" style="display:flex;align-items:center;gap:4px; margin-top:2px;">
            <lucide-icon name="building-2" [size]="10"></lucide-icon>
            {{ h.ambiente?.nombre }}
          </div>
          <div class="sel-jornada">{{ h.jornada | uppercase }}</div>
        </div>
        }
        @if (!horariosFiltrados().length && todosHorarios().length) {
          <div class="no-results-msg">Sin resultados para los filtros aplicados.</div>
        }
        @if (!todosHorarios().length) {
          <p class="text-muted text-sm">No hay horarios disponibles.</p>
        }
      </div>
    </div>

    <!-- PASO 2: Formulario de propuesta -->
    @if (selectedId()) {
    <div class="section-block mt-4">
      <div class="section-title">
        <div class="step-badge">2</div>
        <span>Define el nuevo horario</span>
        <span class="horario-actual-tag">
          Actual: <strong>{{ LABELS[horarioSeleccionado()?.diaSemana] }}</strong>
          {{ horarioSeleccionado()?.horaInicio?.slice(0,5) }} — {{ horarioSeleccionado()?.horaFin?.slice(0,5) }}
          · {{ horarioSeleccionado()?.ambiente?.nombre }}
        </span>
      </div>

      <div class="form-propuesta mt-3">
        <!-- Horas: Inicio y Fin -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              <lucide-icon name="clock" [size]="13"></lucide-icon> Hora Inicio *
            </label>
            <input type="time" class="form-control" [(ngModel)]="form.horaInicio" (ngModelChange)="calcJornada()">
          </div>
          <div class="form-group">
            <label class="form-label">
              <lucide-icon name="clock" [size]="13"></lucide-icon> Hora Fin *
            </label>
            <input type="time" class="form-control" [(ngModel)]="form.horaFin">
          </div>
          <!-- Jornada auto-detectada -->
          <div class="form-group">
            <label class="form-label">Jornada (auto)</label>
            <div class="jornada-display" [class]="'jornada-' + (form.jornada || 'none')">
              <lucide-icon [name]="jornadaIcon()" [size]="14"></lucide-icon>
              {{ form.jornada ? (form.jornada | uppercase) : '— Automática —' }}
            </div>
          </div>
        </div>

        <!-- Ambiente -->
        <div class="form-group mt-3">
          <label class="form-label">
            <lucide-icon name="building-2" [size]="13"></lucide-icon> Ambiente (Aula)
          </label>
          <div style="min-width: 200px">
             <app-ss [options]="ambienteOpts()" placeholder="(Sin ambiente específico)" [(ngModel)]="form.ambienteId"></app-ss>
          </div>
        </div>

        <!-- Motivo -->
        <div class="form-group mt-3">
          <label class="form-label">
            <lucide-icon name="message-square" [size]="13"></lucide-icon> Motivo del cambio *
          </label>
          <textarea class="form-control" [(ngModel)]="form.razon" rows="3"
                    placeholder="Describe el motivo justificado del cambio..."></textarea>
        </div>

        <div class="form-group mt-3">
          <label class="form-label">Adjunto de soporte (opcional)</label>
          <input type="file" class="form-control" (change)="onFile($event)">
        </div>

        @if (conflicto()) {
          <div class="alert-warn mt-3">
            <lucide-icon name="alert-triangle" [size]="15"></lucide-icon>
            {{ conflicto() }}
          </div>
        }
        @if (error()) { <div class="alert-error mt-3">{{ error() }}</div> }
        @if (success()) { <div class="alert-ok mt-3"><lucide-icon name="check-circle" [size]="14"></lucide-icon> {{ success() }}</div> }

        <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
          <button class="btn btn-blue" (click)="enviarSolicitud()"
                  [disabled]="!form.razon || !form.horaInicio || !form.horaFin || saving()">
            @if (saving()) { <lucide-icon name="loader" [size]="14"></lucide-icon> }
            @else { <lucide-icon name="send" [size]="14"></lucide-icon> }
            {{ saving() ? 'Enviando...' : 'Enviar Solicitud' }}
          </button>
          <button class="btn-ghost" (click)="cancelarForm()">Cancelar</button>
        </div>
      </div>
    </div>
    }

    <!-- Mis Solicitudes Enviadas -->
    <div class="section-block mt-6">
      <div class="section-title">
        <lucide-icon name="list" [size]="16"></lucide-icon>
        <span>Mis Solicitudes Enviadas</span>
      </div>
      <div class="card table-wrap mt-3" style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Horario Original</th>
              <th>Propuesta</th>
              <th>Estado</th>
              <th>Respuesta Admin</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (s of misSolicitudes(); track s.id) {
            <tr>
              <td style="white-space:nowrap;">{{ s.fecha | date:'dd/MM/yy HH:mm' }}</td>
              <td>{{ s.horarioActual ? (LABELS[s.horarioActual.diaSemana] + ' ' + s.horarioActual.horaInicio?.slice(0,5)) : '—' }}</td>
              <td style="font-size:12px;">
                @if (s.horarioPropuesto) {
                  <div>{{ s.horarioPropuesto.horaInicio }} — {{ s.horarioPropuesto.horaFin }}</div>
                  @if (s.horarioPropuesto.jornada) {
                    <div class="sel-jornada" style="display:inline-block;">{{ s.horarioPropuesto.jornada | uppercase }}</div>
                  }
                } @else { — }
              </td>
              <td>
                <span class="badge" [class]="s.estado">{{ s.estado }}</span>
              </td>
              <td style="font-size:12px;max-width:180px;">{{ s.respuestaAdmin ?? '—' }}</td>
              <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  @if (s.estado === 'pendiente') {
                    <button class="btn-accion btn-cancelar" (click)="cancelarSolicitud(s)" title="Cancelar solicitud">
                      <lucide-icon name="ban" [size]="13"></lucide-icon> Cancelar
                    </button>
                  }
                  <button class="btn-accion btn-eliminar" (click)="eliminarSolicitud(s)" title="Eliminar registro">
                    <lucide-icon name="trash-2" [size]="13"></lucide-icon> Eliminar
                  </button>
                </div>
              </td>
            </tr>
            }
            @if (!misSolicitudes().length) {
              <tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px;">Sin solicitudes enviadas</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .section-block { background: var(--surface); border-radius: 12px; padding: 20px; border: 1px solid var(--border); box-shadow: var(--shadow); }
    .section-title { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14px; color: var(--text); flex-wrap: wrap; }
    .step-badge { background: var(--navy); color: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
    .lider-badge { background: #eff6ff; color: var(--blue); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 10px; border: 1px solid #bfdbfe; display:flex;align-items:center;gap:4px; }
    .horario-actual-tag { font-size: 12px; color: var(--text-muted); background: var(--surface2); padding: 4px 10px; border-radius: 8px; font-weight: 500; margin-left: auto; }

    /* Filtros */
    .filtros-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .search-input-wrap { position: relative; flex: 1; min-width: 160px; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
    .search-input { width: 100%; padding: 8px 10px 8px 32px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; background: var(--surface2); color: var(--text); outline: none; box-sizing: border-box; }
    .search-input:focus { border-color: var(--blue); }
    .btn-clear { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px; }

    /* Grid horarios */
    .horarios-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 10px; }
    .sel-card { background: var(--surface2); border: 1.5px solid var(--border); border-radius: 10px; padding: 12px; cursor: pointer; transition: all .15s; }
    .sel-card:hover { border-color: var(--blue); box-shadow: 0 2px 8px rgba(59,130,246,.15); }
    .sel-card.selected { border-color: var(--navy); background: #eff6ff; }
    .sel-time { font-weight: 800; color: var(--navy); font-size: 13px; }
    .sel-dia { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-top: 2px; }
    .sel-instructor { font-size:11px; color:var(--text); display:flex; align-items:center; gap:3px; }
    .sel-amb { font-size: 11px; color: var(--text-muted); }
    .sel-jornada { font-size: 10px; color: var(--blue); font-weight: 700; text-transform: uppercase; margin-top: 4px; }
    .no-results-msg { grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px; }

    /* Formulario propuesta */
    .form-propuesta { max-width: 600px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr 1fr; } }

    .jornada-display { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; border: 1px solid var(--border); min-height: 38px; }
    .jornada-manana { background: #fef9c3; color: #92400e; border-color: #fde68a; }
    .jornada-tarde { background: #fed7aa; color: #c2410c; border-color: #fdba74; }
    .jornada-noche { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
    .jornada-none { background: var(--surface2); color: var(--text-muted); }

    /* Alertas */
    .alert-warn { background:#fef3c7;color:#92400e;border-radius:8px;padding:10px 14px;font-size:13px;display:flex;align-items:center;gap:8px;border:1px solid #fde68a; }
    .alert-error { background:#fee2e2;color:#991b1b;border-radius:8px;padding:10px 14px;font-size:13px; }
    .alert-ok { background:#dcfce7;color:#166534;border-radius:8px;padding:10px 14px;font-size:13px;display:flex;align-items:center;gap:8px; }

    /* Botones tabla */
    .btn-accion { display:flex;align-items:center;gap:4px;padding:5px 9px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700;border:1px solid; }
    .btn-cancelar { background:#fef3c7;color:#92400e;border-color:#fde68a; }
    .btn-cancelar:hover { background:#fde68a; }
    .btn-eliminar { background:#fee2e2;color:#991b1b;border-color:#fca5a5; }
    .btn-eliminar:hover { background:#fecaca; }

    /* Misc */
    .btn-ghost { background:transparent;border:1px solid var(--border);color:var(--text-muted);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px; }
    .btn-ghost:hover { background:var(--surface2); }
    .badge.pendiente { background:#fef9c3;color:#854d0e; }
    .badge.aprobado { background:#dcfce7;color:#166534; }
    .badge.rechazado { background:#fee2e2;color:#991b1b; }
    .badge.cancelada { background:#f1f5f9;color:#64748b; }
  `],
})
export class InstructorSolicitudesComponent implements OnInit {
  readonly LABELS = DIAS_LABELS;

  todosHorarios = signal<any[]>([]);
  ambientes = signal<any[]>([]);
  misSolicitudes = signal<any[]>([]);
  selectedId = signal<number | null>(null);
  horarioSeleccionado = signal<any>(null);

  // Filtros
  filtroInstructor = '';
  filtroFicha = '';
  filtroAmbiente = '';

  saving = signal(false);
  error = signal('');
  success = signal('');
  conflicto = signal('');

  form: any = {};

  esLider = computed(() => !!this.auth.currentUser()?.areaLiderada);

  horariosFiltrados = computed(() => {
    let lista = this.todosHorarios();
    if (this.filtroInstructor) {
      const f = this.filtroInstructor.toLowerCase();
      lista = lista.filter(h =>
        `${h.instructor?.nombre} ${h.instructor?.apellido}`.toLowerCase().includes(f)
      );
    }
    if (this.filtroFicha) {
      const f = this.filtroFicha.toLowerCase();
      lista = lista.filter(h => h.ficha?.codigo?.toLowerCase().includes(f) || h.ficha?.programa?.toLowerCase().includes(f));
    }
    if (this.filtroAmbiente) {
      const f = this.filtroAmbiente.toLowerCase();
      lista = lista.filter(h => h.ambiente?.nombre?.toLowerCase().includes(f));
    }
    return lista;
  });

  ambienteOpts = computed<SSOption[]>(() => {
    const actId = this.horarioSeleccionado()?.ambienteId;
    const actNombre = this.horarioSeleccionado()?.ambiente?.nombre;
    const list: SSOption[] = [{ value: '', label: '(Sin ambiente específico)' }];
    if (actId) {
      list.push({ value: actId, label: `${actNombre} (Actual)` });
    }
    this.ambientes().forEach((a: any) => {
      if (a.id !== actId) {
        list.push({ value: a.id, label: `${a.nombre}${a.area_nombre ? ' — ' + a.area_nombre : ''}` });
      }
    });
    return list;
  });

  private toast = inject(ToastService);

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.currentUser();

    // Si es lider: cargar todos los horarios y filtrar por área; si no: solo los suyos
    if (user?.esLider && user?.areaLiderada) {
      this.api.getHorarios().subscribe(todos => {
        // El área se matchea contra la ficha o el programa — aquí filtramos por cualquier horario del sistema
        // ya que el área del instructor corresponde al área de formación de sus fichas
        // Por ahora mostramos todos — el buscador permite filtrar fácilmente
        this.todosHorarios.set(todos);
      });
    } else if (user?.id) {
      this.api.getHorariosByInstructor(user.id).subscribe(h => this.todosHorarios.set(h));
    }

    if (user?.id) {
      this.api.getSolicitudesByInstructor(user.id).subscribe(s => this.misSolicitudes.set(s));
    }
    this.api.getHAmbientes().subscribe(a => this.ambientes.set(a));
  }

  limpiarFiltros() {
    this.filtroInstructor = '';
    this.filtroFicha = '';
    this.filtroAmbiente = '';
  }

  selectHorario(h: any) {
    this.selectedId.set(h.id);
    this.horarioSeleccionado.set(h);
    this.conflicto.set('');
    this.error.set('');
    this.success.set('');
    this.form = {
      horaInicio: h.horaInicio?.slice(0, 5),
      horaFin: h.horaFin?.slice(0, 5),
      jornada: h.jornada,
      ambienteId: h.ambienteId,
      razon: '',
    };
  }

  calcJornada() {
    if (!this.form.horaInicio) return;
    const [h] = this.form.horaInicio.split(':').map(Number);
    if (h >= 6 && h < 13) {
      this.form.jornada = 'manana';
    } else if (h >= 13 && h < 19) {
      this.form.jornada = 'tarde';
    } else {
      this.form.jornada = 'noche';
    }
  }

  jornadaIcon(): string {
    switch (this.form.jornada) {
      case 'manana': return 'sunrise';
      case 'tarde': return 'sun';
      case 'noche': return 'moon';
      default: return 'clock';
    }
  }

  cancelarForm() {
    this.selectedId.set(null);
    this.horarioSeleccionado.set(null);
    this.form = {};
    this.conflicto.set('');
    this.error.set('');
    this.success.set('');
  }

  onFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.api.uploadAdjunto(file).subscribe(res => {
      this.form.archivoAdjuntoUrl = res.url;
    });
  }

  enviarSolicitud() {
    this.saving.set(true);
    this.conflicto.set('');
    this.error.set('');

    const payload = {
      instructorId: this.auth.currentUser()!.id,
      horarioIdActual: this.selectedId(),
      razon: this.form.razon,
      archivoAdjuntoUrl: this.form.archivoAdjuntoUrl,
      horarioPropuesto: {
        diaSemana: this.horarioSeleccionado()?.diaSemana, // Día no cambia
        horaInicio: this.form.horaInicio,
        horaFin: this.form.horaFin,
        jornada: this.form.jornada,
        ambienteId: this.form.ambienteId ? +this.form.ambienteId : undefined,
      },
    };

    this.api.createSolicitud(payload).subscribe({
      next: () => {
        this.saving.set(false);
        const id = this.auth.currentUser()?.id;
        if (id) this.api.getSolicitudesByInstructor(id).subscribe(s => this.misSolicitudes.set(s));
        this.cancelarForm();
        this.toast.success('Solicitud enviada', 'Tu solicitud fue enviada al administrador. Recibirás respuesta pronto.');
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message;
        if (err?.status === 409) {
          this.conflicto.set(msg || 'El ambiente propuesto ya está ocupado en ese horario.');
          this.toast.warning('Conflicto de horario', msg || 'El ambiente propuesto ya está ocupado en ese horario.');
        } else {
          this.toast.error('Error al enviar solicitud', msg || 'No se pudo enviar la solicitud. Verifica los datos e intenta de nuevo.');
        }
      },
    });
  }

  cancelarSolicitud(s: any) {
    if (!confirm(`¿Cancelar la solicitud del ${this.LABELS[s.horarioActual?.diaSemana] || ''}?`)) return;
    this.api.cancelarSolicitud(s.id).subscribe({
      next: () => {
        const id = this.auth.currentUser()?.id;
        if (id) this.api.getSolicitudesByInstructor(id).subscribe(sol => this.misSolicitudes.set(sol));
        this.toast.info('Solicitud cancelada', 'La solicitud fue cancelada exitosamente.');
      },
      error: (e) => this.toast.error('Error al cancelar', e?.error?.message ?? 'No se pudo cancelar la solicitud.'),
    });
  }

  eliminarSolicitud(s: any) {
    if (!confirm('¿Eliminar este registro de solicitud permanentemente?')) return;
    this.api.deleteSolicitud(s.id).subscribe({
      next: () => {
        this.misSolicitudes.set(this.misSolicitudes().filter(x => x.id !== s.id));
        this.toast.success('Solicitud eliminada', 'El registro fue eliminado correctamente.');
      },
      error: (e) => this.toast.error('Error al eliminar', e?.error?.message ?? 'No se pudo eliminar la solicitud.'),
    });
  }
}
