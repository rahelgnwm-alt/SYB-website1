import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Guard ensuring only users with Admin roles can access /admin routes */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  // If not admin, open login modal with intended return url and navigate to home
  authService.openLoginModal(state.url);
  router.navigate(['/']);
  return false;
};

/** Guard ensuring user is authenticated (either customer or admin) to access /profile */
export const customerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  authService.openLoginModal(state.url);
  router.navigate(['/']);
  return false;
};
