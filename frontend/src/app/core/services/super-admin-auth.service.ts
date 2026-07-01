import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

interface SuperAdminLoginResponse {
  access_token: string;
}

@Injectable({ providedIn: 'root' })
export class SuperAdminAuthService {
  private readonly API = 'http://127.0.0.1:3001/api/super-admin/auth';
  private readonly TOKEN_KEY = 'cg_sa_token';

  private readonly _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  getToken(): string | null {
    return this._token();
  }

  get isAuthenticated(): boolean {
    return !!this._token();
  }

  login(identifier: string, password: string) {
    return this.http
      .post<SuperAdminLoginResponse>(`${this.API}/login`, { identifier, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.access_token);
          this._token.set(res.access_token);
        }),
      );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this._token.set(null);
    this.router.navigate(['/super-admin/login']);
  }
}
