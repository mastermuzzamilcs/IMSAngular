import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { RoleService } from '../services/role.service';
import { from, Observable } from 'rxjs';
import { Role } from '../Models/RoleModel';

@Injectable({ providedIn: 'root' })
export class UserRolesResolver implements Resolve<Role[]> {
  constructor(private roleService: RoleService) {}

  resolve(): Observable<Role[]> {
    return from(this.roleService.getRoles()); // return data before route activation
  }
}
