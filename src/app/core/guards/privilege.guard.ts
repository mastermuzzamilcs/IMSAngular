import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PrivilegeRef } from '../auth/privilege-catalog';
import { AuthService } from '../services/auth.service';

export const privilegeGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required = route.data['privilege'] as PrivilegeRef | undefined;
  if (!required) {
    return true;
  }
  await auth.ensurePrivileges();
  if (auth.hasPrivilege(required.moduleId, required.functionId)) {
    return true;
  }
  return router.createUrlTree(['/unauthorized']);
};
