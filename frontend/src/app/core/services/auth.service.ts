import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { User, LoginResponse, Tenant } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://127.0.0.1:3001/api/auth';
  private readonly TOKEN_KEY = 'cg_token';
  private readonly USER_KEY = 'cg_user';
  private readonly TENANT_KEY = 'cg_tenant';

  currentUser = signal<User | null>(this.loadUser());
  currentTenant = signal<Tenant | null>(this.loadTenant());

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get tenantSlug(): string | null {
    return this.currentTenant()?.slug ?? null;
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  get role(): string {
    return this.currentUser()?.rol ?? '';
  }

  login(identifier: string, password: string) {
    return this.http.post<LoginResponse>(`${this.API}/login`, { identifier, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.access_token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
        if (res.user.tenantSlug && res.user.tenantNombre) {
          this.setTenant({ id: '', slug: res.user.tenantSlug, nombre: res.user.tenantNombre });
        } else {
          this.setTenant(null);
        }
      }),
    );
  }

  logout() {
    const token = this.token;

    const cleanupAndRedirect = () => {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TENANT_KEY);
      this.currentUser.set(null);
      this.currentTenant.set(null);
      this.router.navigate(['/landing']);
    };

    if (token) {
      // Fire backend call first, then clean UI and redirect to avoid request cancellation
      this.http.post(`${this.API}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: () => cleanupAndRedirect(),
        error: () => cleanupAndRedirect()
      });
    } else {
      cleanupAndRedirect();
    }
  }

  verifyPin(pin: string) {
    return this.http.post<{ valid: boolean }>(`${this.API}/verify-pin`, { pin });
  }

  register(data: any) {
    return this.http.post(`${this.API}/register`, data);
  }

  registerAdmin(data: any) {
    return this.http.post(`${this.API}/register-admin`, data);
  }

  forgotPassword(correo: string) {
    return this.http.post(`${this.API}/forgot-password`, { correo });
  }

  verifyResetCode(correo: string, code: string) {
    return this.http.post(`${this.API}/verify-reset-code`, { correo, code });
  }

  resetPassword(correo: string, code: string, newPassword: string) {
    return this.http.post(`${this.API}/reset-password`, { correo, code, newPassword });
  }

  me() {
    return this.http.get<User>(`${this.API}/me`).pipe(
      tap((user) => {
        this.currentUser.set({ ...this.currentUser()!, ...user });
        if (user.tenantSlug && user.tenantNombre) {
          this.setTenant({ id: '', slug: user.tenantSlug, nombre: user.tenantNombre });
        }
      }),
    );
  }

  setTenant(tenant: Tenant | null) {
    this.currentTenant.set(tenant);
    if (tenant) {
      localStorage.setItem(this.TENANT_KEY, JSON.stringify(tenant));
    } else {
      localStorage.removeItem(this.TENANT_KEY);
    }
  }

  updateCurrentUser(partial: Partial<User>) {
    const updated = { ...this.currentUser()!, ...partial };
    this.currentUser.set(updated);
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private loadTenant(): Tenant | null {
    try {
      const raw = localStorage.getItem(this.TENANT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
