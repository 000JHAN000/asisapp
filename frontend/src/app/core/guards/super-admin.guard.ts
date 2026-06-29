import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SuperAdminAuthService } from '../services/super-admin-auth.service';

export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(SuperAdminAuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) {
    router.navigate(['/super-admin/login']);
    return false;
  }

  return true;
};
