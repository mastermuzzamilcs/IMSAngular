import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserGroupAssociationService } from '../services/user-group-association.service';

export const groupGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const associations = inject(UserGroupAssociationService);
  const router = inject(Router);
  const required = (route.data['groups'] as string[] | undefined) || [];
  if (auth.hasAnyGroup(['Admin', ...required])) {
    return true;
  }
  if (!(await associations.hasAny())) {
    return true;
  }
  return router.createUrlTree(['/unauthorized']);
};
