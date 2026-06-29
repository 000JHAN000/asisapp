import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SuperAdminAuthService } from '../../../core/services/super-admin-auth.service';

@Component({
  selector: 'app-super-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="login-page">
      <!-- LEFT PANEL -->
      <div class="left-panel">
        <div class="lp-logo">
          <lucide-icon name="calendar" [size]="28" class="lp-logo-icon"></lucide-icon>
          <div>
            <div class="lp-logo-name">ChronoGest</div>
            <div class="lp-logo-sub">SENA — Gestión de Horarios</div>
          </div>
        </div>
        <img src="assets/logo-sena-blanco.png" alt="SENA" class="lp-sena"
             onerror="this.style.opacity='0'">
        <div class="lp-modules">
          @for (m of modules; track m.title) {
            <div class="lp-module-card">
              <lucide-icon [name]="m.icon" [size]="24" class="lp-module-icon"></lucide-icon>
              <span class="lp-module-name">{{ m.title }}</span>
            </div>
          }
        </div>
        <p class="lp-footer">Sistema de Gestión Académica — v2.1</p>
      </div>

      <!-- RIGHT PANEL -->
      <div class="right-panel">
        <div class="form-box">
          <a routerLink="/login" class="back-link">← Volver al login de sedes</a>
          <h2>Super Admin</h2>
          <p class="rp-sub">Panel de administración de sedes</p>

          <form (ngSubmit)="onSubmit()" class="mt-4">
            <div class="form-group mt-4">
              <label class="form-label">Correo o documento</label>
              <input
                type="text"
                [(ngModel)]="identifier"
                name="identifier"
                required
                class="form-control"
                placeholder="superadmin@platform.com"
              />
            </div>

            <div class="form-group mt-4" style="position:relative">
              <label class="form-label">Contraseña</label>
              <input
                [type]="showPass ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                required
                class="form-control"
                placeholder="••••••••"
              />
              <button type="button" class="toggle-pass" (click)="showPass = !showPass">
                @if (showPass) {
                  <lucide-icon name="eye-off" [size]="16"></lucide-icon>
                } @else {
                  <lucide-icon name="eye" [size]="16"></lucide-icon>
                }
              </button>
            </div>

            @if (error()) {
              <div class="error-msg">{{ error() }}</div>
            }

            <button
              type="submit"
              [disabled]="loading()"
              class="btn-submit"
            >
              @if (loading()) {
                <span class="spinner"></span>
              } @else {
                <lucide-icon name="lock" [size]="16"></lucide-icon>
              }
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { display: flex; min-height: 100vh; }

    .left-panel {
      width: 420px; min-width: 320px; background: #1e3a5f;
      display: flex; flex-direction: column; align-items: center;
      padding: 48px 32px; gap: 24px;
    }
    .lp-logo { display: flex; align-items: center; gap: 12px; color: #fff; }
    .lp-logo-icon { color: #fff; }
    .lp-logo-name { font-size: 20px; font-weight: 800; }
    .lp-logo-sub { font-size: 11px; color: rgba(255,255,255,.6); }
    .lp-sena {
      width: 90px; height: 90px; object-fit: contain;
      filter: brightness(0) invert(1);
    }
    .lp-modules {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%;
    }
    .lp-module-card {
      background: rgba(255,255,255,.1); border-radius: 12px;
      padding: 16px; display: flex; flex-direction: column; align-items: center;
      gap: 8px; color: #fff; border: 1px solid rgba(255,255,255,.15);
    }
    .lp-module-icon { color: #fff; }
    .lp-module-name { font-size: 12px; font-weight: 600; text-align: center; }
    .lp-footer { color: rgba(255,255,255,.4); font-size: 11px; margin-top: auto; }

    .right-panel {
      flex: 1; background: #fff; display: flex;
      align-items: center; justify-content: center; padding: 40px 24px;
      overflow-y: auto;
    }
    .form-box { width: 100%; max-width: 420px; }
    .back-link {
      display: inline-block; color: #6b7280; font-size: 13px;
      margin-bottom: 24px; cursor: pointer; text-decoration: none;
      background: none; border: none; padding: 0;
    }
    .back-link:hover { color: #1e3a5f; }
    .form-box h2 { font-size: 1.6rem; color: #111827; margin-bottom: 6px; }
    .rp-sub { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
    .form-label {
      display: block; font-size: 13px; font-weight: 600;
      color: #374151; margin-bottom: 6px;
    }
    .form-control {
      width: 100%; padding: 12px 14px; border: 1.5px solid #d1d5db;
      border-radius: 10px; font-size: 14px; color: #111827;
      background: #fff; box-sizing: border-box;
    }
    .form-control:focus {
      outline: none; border-color: #1e3a5f;
    }
    .toggle-pass {
      position: absolute; right: 12px; top: 34px;
      background: none; border: none; cursor: pointer;
      color: #6b7280; display: flex; align-items: center;
    }
    .btn-submit {
      width: 100%; margin-top: 20px; padding: 13px;
      background: #1e3a5f; color: #fff; border: none;
      border-radius: 10px; font-size: 15px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background .15s;
    }
    .btn-submit:hover { background: #2a4d7a; }
    .btn-submit:disabled { opacity: .6; cursor: not-allowed; }
    .error-msg {
      background: #fee2e2; color: #991b1b; border-radius: 8px;
      padding: 10px 14px; font-size: 13px; margin-top: 12px;
    }
    .spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .left-panel { display: none; }
      .right-panel { background: #f3f4f6; }
    }
  `],
})
export class SuperAdminLoginComponent {
  identifier = '';
  password = '';
  showPass = false;
  error = signal('');
  loading = signal(false);

  modules = [
    { icon: 'calendar', title: 'Horarios' },
    { icon: 'building-2', title: 'Ambientes' },
    { icon: 'graduation-cap', title: 'Instructores' },
    { icon: 'layout-dashboard', title: 'Fichas' },
  ];

  constructor(
    private readonly auth: SuperAdminAuthService,
    private readonly router: Router,
  ) {}

  onSubmit() {
    this.error.set('');
    this.loading.set(true);

    this.auth.login(this.identifier, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/super-admin/tenants']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Credenciales inválidas');
      },
    });
  }
}
