import { Component, OnInit, signal } from '@angular/core';
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
            <lucide-icon name="shield" [size]="22" class="brand-icon"></lucide-icon>
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
        <!-- FORMULARIO -->
        <div class="card">
          <div class="card-header">
            <lucide-icon name="plus-circle" [size]="20" class="card-icon"></lucide-icon>
            <h2>Crear nueva sede</h2>
          </div>

          <form (ngSubmit)="createTenant()" class="form-grid">
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

          <div class="admin-section">
            <h3>Administrador inicial</h3>
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
              class="btn-submit"
            >
              @if (creating()) {
                <span class="spinner"></span> Creando...
              } @else {
                <lucide-icon name="plus" [size]="16"></lucide-icon>
                Crear sede
              }
            </button>
          </div>
        </form>

          @if (formError()) {
            <div class="alert alert-error">{{ formError() }}</div>
          }
          @if (formSuccess()) {
            <div class="alert alert-success">{{ formSuccess() }}</div>
          }
        </div>

        <!-- TABLA -->
        <div class="card">
          <div class="card-header">
            <lucide-icon name="building-2" [size]="20" class="card-icon"></lucide-icon>
            <h2>Sedes registradas</h2>
          </div>

          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (t of tenants(); track t.slug) {
                  <tr>
                    <td class="font-medium">{{ t.nombre }}</td>
                    <td><code class="slug">{{ t.slug }}</code></td>
                    <td>
                      <span class="badge" [class.active]="t.activo" [class.inactive]="!t.activo">
                        {{ t.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="text-right">
                      <button class="btn-action" (click)="toggle(t)">
                        {{ t.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                    </td>
                  </tr>
                }
                @if (tenants().length === 0) {
                  <tr>
                    <td colspan="4" class="empty">No hay sedes registradas.</td>
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
    .page { min-height: 100vh; background: #f3f4f6; }

    .header {
      background: #1e3a5f; color: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
    }
    .header-inner {
      max-width: 1200px; margin: 0 auto;
      padding: 16px 24px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon { color: #fff; }
    .header h1 { font-size: 18px; font-weight: 800; margin: 0; }
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
      display: flex; flex-direction: column; gap: 24px;
    }

    .card {
      background: #fff; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
      overflow: hidden;
    }
    .card-header {
      display: flex; align-items: center; gap: 10px;
      padding: 18px 22px;
      border-bottom: 1px solid #e5e7eb;
    }
    .card-icon { color: #1e3a5f; }
    .card-header h2 {
      font-size: 16px; font-weight: 700; color: #111827; margin: 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      padding: 22px;
      align-items: end;
    }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label {
      font-size: 13px; font-weight: 600; color: #374151;
    }
    .form-control {
      padding: 11px 14px; border: 1.5px solid #d1d5db;
      border-radius: 10px; font-size: 14px; color: #111827;
      background: #fff;
    }
    .form-control:focus { outline: none; border-color: #1e3a5f; }
    .form-action { display: flex; padding: 0 22px 22px; }
    .admin-section {
      border-top: 1px solid #e5e7eb;
      padding: 18px 22px;
    }
    .admin-section h3 {
      font-size: 14px; font-weight: 700; color: #374151;
      margin: 0 0 14px;
    }
    .btn-submit {
      width: 100%; padding: 12px 16px;
      background: #1e3a5f; color: #fff; border: none;
      border-radius: 10px; font-size: 14px; font-weight: 700;
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      transition: background .15s;
    }
    .btn-submit:hover { background: #2a4d7a; }
    .btn-submit:disabled { opacity: .6; cursor: not-allowed; }

    .alert {
      margin: 0 22px 22px; padding: 11px 15px;
      border-radius: 8px; font-size: 13px;
    }
    .alert-error { background: #fee2e2; color: #991b1b; }
    .alert-success { background: #dcfce7; color: #166534; }

    .table-wrap { overflow-x: auto; }
    .table {
      width: 100%; border-collapse: collapse; font-size: 14px;
    }
    .table thead {
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    .table th {
      padding: 14px 22px; text-align: left;
      font-size: 12px; font-weight: 700; color: #374151;
      text-transform: uppercase; letter-spacing: .4px;
    }
    .table td {
      padding: 14px 22px; border-bottom: 1px solid #f3f4f6;
      color: #374151;
    }
    .table tr:last-child td { border-bottom: none; }
    .font-medium { font-weight: 600; color: #111827; }
    .text-right { text-align: right; }
    .slug {
      background: #f3f4f6; color: #4b5563;
      padding: 3px 8px; border-radius: 6px;
      font-size: 12px; font-family: ui-monospace, monospace;
    }
    .badge {
      display: inline-block; padding: 4px 10px;
      border-radius: 9999px; font-size: 12px; font-weight: 600;
    }
    .badge.active { background: #dcfce7; color: #166534; }
    .badge.inactive { background: #fee2e2; color: #991b1b; }
    .btn-action {
      background: transparent; color: #2563eb; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer;
      padding: 0;
    }
    .btn-action:hover { text-decoration: underline; }
    .empty {
      text-align: center; color: #6b7280; padding: 32px !important;
    }
    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 640px) {
      .header-inner { flex-direction: column; gap: 12px; align-items: flex-start; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class SuperAdminTenantsComponent implements OnInit {
  tenants = signal<SuperAdminTenant[]>([]);
  newTenant: CreateTenantInput = {
    slug: '', nombre: '', dbName: '',
    adminDocumento: '', adminNombre: '', adminApellido: '', adminCorreo: '', adminPassword: '',
  };
  creating = signal(false);
  formError = signal('');
  formSuccess = signal('');

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
