import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const registerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Solo administradores autenticados pueden usar el registro unitario desde el panel.
  // Los usuarios no autenticados deben pasar por /login.
  if (auth.isAuthenticated && auth.role === 'admin') return true;

  router.navigate(['/login']);
  return false;
};
