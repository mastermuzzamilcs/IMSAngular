import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { RoleService } from '../services/role.service';
import { from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserRolesResolver implements Resolve<any> {
  constructor(private roleService: RoleService) {}

  resolve(): Observable<any> {
    return from(this.roleService.getRoles()); // return data before route activation
  }
}
