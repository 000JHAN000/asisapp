import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated || auth.currentUser()?.rol !== 'super_admin') {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
