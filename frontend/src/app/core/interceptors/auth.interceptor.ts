import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { SuperAdminAuthService } from '../services/super-admin-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const superAdminAuth = inject(SuperAdminAuthService);
  const token = auth.token ?? superAdminAuth.getToken();
  const tenantSlug = auth.tenantSlug;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantSlug) {
    headers['x-tenant-id'] = tenantSlug;
  }

  if (Object.keys(headers).length > 0) {
    req = req.clone({ setHeaders: headers });
  }

  return next(req);
};
