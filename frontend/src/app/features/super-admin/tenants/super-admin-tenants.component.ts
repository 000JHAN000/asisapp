import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { SuperAdminTenantService, SuperAdminTenant, CreateTenantInput } from '../../../core/services/super-admin-tenant.service';

@Component({
  selector: 'app-super-admin-tenants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="page">
      <!-- HEADER -->
      <header class="header">
        <div class="header-inner">
          <div class="brand">
            <div class="brand-icon-wrap">
              <lucide-icon name="shield" [size]="22" class="brand-icon"></lucide-icon>
            </div>
            <div>
              <h1>Super Admin — Sedes</h1>
              <p>Gestión de tenants / sedes</p>
            </div>
          </div>
          <button class="btn-logout" (click)="logout()">
            <lucide-icon name="log-out" [size]="16"></lucide-icon>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main class="main">
        <!-- STATS -->
        <div class="grid-3">
          <div class="stat-card">
            <div class="stat-icon" style="background:#dbeafe;color:#1d4ed8">
              <lucide-icon name="building-2" [size]="24"></lucide-icon>
            </div>
            <div>
              <div class="stat-value">{{ tenants().length }}</div>
              <div class="stat-label">Sedes totales</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#dcfce7;color:#166534">
              <lucide-icon name="check-circle" [size]="24"></lucide-icon>
            </div>
            <div>
              <div class="stat-value">{{ activeTenantsCount() }}</div>
              <div class="stat-label">Activas</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fee2e2;color:#991b1b">
              <lucide-icon name="x-circle" [size]="24"></lucide-icon>
            </div>
            <div>
              <div class="stat-value">{{ tenants().length - activeTenantsCount() }}</div>
              <div class="stat-label">Inactivas</div>
            </div>
          </div>
        </div>

        <!-- FORMULARIO -->
        <div class="card mt-6">
          <div class="card-header">
            <lucide-icon name="plus-circle" [size]="20" class="card-icon"></lucide-icon>
            <h2>Crear nueva sede</h2>
          </div>

          <form (ngSubmit)="createTenant()" class="tenant-form">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Slug</label>
                <input
                  type="text"
                  [(ngModel)]="newTenant.slug"
                  name="slug"
                  required
                  class="form-control"
                  placeholder="nueva-sede"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input
                  type="text"
                  [(ngModel)]="newTenant.nombre"
                  name="nombre"
                  required
                  class="form-control"
                  placeholder="Nombre visible"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Base de datos</label>
                <input
                  type="text"
                  [(ngModel)]="newTenant.dbName"
                  name="dbName"
                  required
                  class="form-control"
                  placeholder="sena_db_nueva_sede"
                />
              </div>
            </div>

            <div class="admin-section">
              <h3>
                <lucide-icon name="user-cog" [size]="15"></lucide-icon>
                Administrador inicial
              </h3>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Documento</label>
                  <input
                    type="text"
                    [(ngModel)]="newTenant.adminDocumento"
                    name="adminDocumento"
                    required
                    class="form-control"
                    placeholder="12345678"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Nombre</label>
                  <input
                    type="text"
                    [(ngModel)]="newTenant.adminNombre"
                    name="adminNombre"
                    required
                    class="form-control"
                    placeholder="Nombre"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Apellido</label>
                  <input
                    type="text"
                    [(ngModel)]="newTenant.adminApellido"
                    name="adminApellido"
                    class="form-control"
                    placeholder="Apellido"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Correo</label>
                  <input
                    type="email"
                    [(ngModel)]="newTenant.adminCorreo"
                    name="adminCorreo"
                    required
                    class="form-control"
                    placeholder="admin@nueva-sede.com"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Contraseña</label>
                  <input
                    type="password"
                    [(ngModel)]="newTenant.adminPassword"
                    name="adminPassword"
                    required
                    class="form-control"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div class="form-action">
              <button
                type="submit"
                [disabled]="creating()"
                class="btn btn-primary"
              >
                @if (creating()) {
                  <span class="spinner"></span> Creando...
                } @else {
                  <lucide-icon name="plus" [size]="16"></lucide-icon>
                  Crear sede
                }
              </button>
            </div>

            @if (formError()) {
              <div class="alert alert-error">
                <lucide-icon name="alert-triangle" [size]="15"></lucide-icon>
                {{ formError() }}
              </div>
            }
            @if (formSuccess()) {
              <div class="alert alert-success">
                <lucide-icon name="check-circle" [size]="15"></lucide-icon>
                {{ formSuccess() }}
              </div>
            }
          </form>
        </div>

        <!-- TABLA -->
        <div class="card mt-6">
          <div class="card-header">
            <lucide-icon name="building-2" [size]="20" class="card-icon"></lucide-icon>
            <h2>Sedes registradas</h2>
          </div>

          <div class="table-search-bar">
            <div class="tbl-search-wrap">
              <lucide-icon name="search" [size]="14" class="tbl-search-icon"></lucide-icon>
              <input
                class="tbl-search-input"
                type="text"
                placeholder="Buscar por nombre o slug..."
                [(ngModel)]="searchText"
                [ngModelOptions]="{ standalone: true }"
              />
              @if (searchText) {
                <button class="tbl-search-clear" (click)="searchText = ''">
                  <lucide-icon name="x" [size]="12"></lucide-icon>
                </button>
              }
            </div>
            <span class="tbl-results-count">
              {{ filteredTenants().length }} sede{{ filteredTenants().length !== 1 ? 's' : '' }}
            </span>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Sede</th>
                  <th>Slug</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (t of filteredTenants(); track t.slug) {
                  <tr>
                    <td>
                      <div class="flex items-center gap-2">
                        <div class="mini-avatar">
                          <lucide-icon name="building-2" [size]="15"></lucide-icon>
                        </div>
                        <span class="font-medium">{{ t.nombre }}</span>
                      </div>
                    </td>
                    <td><code class="slug">{{ t.slug }}</code></td>
                    <td>
                      <div class="flex items-center gap-2">
                        <label class="toggle-switch" title="Activo / Inactivo">
                          <input type="checkbox" [checked]="t.activo" (change)="toggle(t)">
                          <span class="slider"></span>
                        </label>
                        <span class="badge" [class.active]="t.activo" [class.inactive]="!t.activo">
                          {{ t.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                      </div>
                    </td>
                  </tr>
                }
                @if (filteredTenants().length === 0 && tenants().length > 0) {
                  <tr>
                    <td colspan="3" class="empty">
                      <lucide-icon name="search" [size]="28"></lucide-icon>
                      <p>Ninguna sede coincide con "{{ searchText }}".</p>
                    </td>
                  </tr>
                }
                @if (tenants().length === 0) {
                  <tr>
                    <td colspan="3" class="empty">
                      <lucide-icon name="inbox" [size]="28"></lucide-icon>
                      <p>No hay sedes registradas.</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: var(--bg); }

    .header {
      background: var(--navy); color: #fff;
      box-shadow: var(--shadow);
    }
    .header-inner {
      max-width: 1200px; margin: 0 auto;
      padding: 16px 24px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon-wrap {
      width: 38px; height: 38px; border-radius: 10px;
      background: rgba(255,255,255,.12);
      display: flex; align-items: center; justify-content: center;
    }
    .brand-icon { color: #fff; }
    .header h1 { font-size: 18px; font-weight: 800; margin: 0; color: #fff; }
    .header p { font-size: 12px; color: rgba(255,255,255,.7); margin: 2px 0 0; }
    .btn-logout {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,.12); color: #fff;
      border: 1px solid rgba(255,255,255,.25);
      border-radius: 8px; padding: 8px 14px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: background .15s;
    }
    .btn-logout:hover { background: rgba(255,255,255,.2); }

    .main {
      max-width: 1200px; margin: 0 auto;
      padding: 28px 24px;
    }

    .card-header {
      display: flex; align-items: center; gap: 10px;
      padding: 18px 22px;
      border-bottom: 1px solid var(--border);
    }
    .card-icon { color: var(--navy); }
    .card-header h2 {
      font-size: 16px; font-weight: 700; color: var(--text); margin: 0;
    }

    .tenant-form { display: flex; flex-direction: column; }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      padding: 22px;
    }
    .form-action { display: flex; padding: 0 22px 22px; }
    .admin-section {
      border-top: 1px solid var(--border);
      padding: 4px 0 0;
    }
    .admin-section h3 {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; font-weight: 700; color: var(--text-muted);
      margin: 18px 22px 0;
    }

    .alert {
      display: flex; align-items: center; gap: 8px;
      margin: 0 22px 22px; padding: 11px 15px;
      border-radius: 8px; font-size: 13px;
    }
    .alert-error { background: #fee2e2; color: #991b1b; }
    .alert-success { background: #dcfce7; color: #166534; }

    /* ── Search bar (mismo patrón que otras listas admin) ─────── */
    .table-search-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 22px;
      border-bottom: 1px solid var(--border);
      gap: 12px;
    }
    .tbl-search-wrap {
      display: flex; align-items: center; gap: 8px;
      background: var(--bg); border: 1.5px solid var(--border);
      border-radius: 8px; padding: 7px 12px;
      flex: 1; max-width: 360px; transition: border-color .15s;
    }
    .tbl-search-wrap:focus-within { border-color: var(--navy); }
    .tbl-search-icon { color: var(--text-muted); flex-shrink: 0; }
    .tbl-search-input {
      border: none; outline: none; background: transparent;
      font-size: 13px; color: var(--text); flex: 1; min-width: 0;
    }
    .tbl-search-input::placeholder { color: var(--text-muted); }
    .tbl-search-clear {
      background: none; border: none; cursor: pointer;
      color: var(--text-muted); display: flex; align-items: center;
      padding: 2px; border-radius: 4px;
    }
    .tbl-search-clear:hover { color: var(--text); }
    .tbl-results-count { font-size: 12px; color: var(--text-muted); white-space: nowrap; }

    .font-medium { font-weight: 600; color: var(--text); }
    .mini-avatar {
      width: 30px; height: 30px; border-radius: 8px; background: var(--navy);
      display: flex; align-items: center; justify-content: center;
      color: #fff; flex-shrink: 0;
    }
    .slug {
      background: var(--surface2); color: var(--text-muted);
      padding: 3px 8px; border-radius: 6px;
      font-size: 12px; font-family: ui-monospace, monospace;
    }
    .toggle-switch { position: relative; display: inline-block; width: 36px; height: 20px; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; inset: 0; background: #d1d5db;
      border-radius: 20px; transition: .15s;
    }
    .slider::before {
      content: ''; position: absolute; height: 14px; width: 14px;
      left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .15s;
    }
    input:checked + .slider { background: var(--green); }
    input:checked + .slider::before { transform: translateX(16px); }

    .empty {
      text-align: center; color: var(--text-muted); padding: 40px !important;
    }
    .empty lucide-icon { display: block; margin: 0 auto 8px; opacity: .5; }
    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 640px) {
      .header-inner { flex-direction: column; gap: 12px; align-items: flex-start; }
      .form-grid { grid-template-columns: 1fr; }
      .table-search-bar { flex-direction: column; align-items: stretch; }
      .tbl-search-wrap { max-width: none; }
    }
  `],
})
export class SuperAdminTenantsComponent implements OnInit {
  tenants = signal<SuperAdminTenant[]>([]);
  searchText = '';
  newTenant: CreateTenantInput = {
    slug: '', nombre: '', dbName: '',
    adminDocumento: '', adminNombre: '', adminApellido: '', adminCorreo: '', adminPassword: '',
  };
  creating = signal(false);
  formError = signal('');
  formSuccess = signal('');

  activeTenantsCount = computed(() => this.tenants().filter((t) => t.activo).length);

  filteredTenants = computed(() => {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.tenants();
    return this.tenants().filter(
      (t) => t.nombre.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
    );
  });

  constructor(
    private readonly auth: AuthService,
    private readonly tenantService: SuperAdminTenantService,
  ) {}

  ngOnInit() {
    this.loadTenants();
  }

  loadTenants() {
    this.formError.set('');
    this.tenantService.getTenants().subscribe({
      next: (data) => this.tenants.set(data),
      error: () => this.formError.set('No se pudo cargar el listado de sedes'),
    });
  }

  createTenant() {
    this.formError.set('');
    this.formSuccess.set('');
    this.creating.set(true);

    this.tenantService.createTenant(this.newTenant).subscribe({
      next: () => {
        this.creating.set(false);
        this.formSuccess.set('Sede creada correctamente');
        this.newTenant = {
          slug: '', nombre: '', dbName: '',
          adminDocumento: '', adminNombre: '', adminApellido: '', adminCorreo: '', adminPassword: '',
        };
        this.loadTenants();
      },
      error: (err) => {
        this.creating.set(false);
        this.formError.set(err.error?.message || 'Error al crear la sede');
      },
    });
  }

  toggle(tenant: SuperAdminTenant) {
    this.tenantService.toggleStatus(tenant.slug, !tenant.activo).subscribe({
      next: () => this.loadTenants(),
      error: () => this.formError.set('No se pudo cambiar el estado de la sede'),
    });
  }

  logout() {
    this.auth.logout();
  }
}
