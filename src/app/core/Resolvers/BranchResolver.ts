import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { from, Observable } from 'rxjs';
import { BranchService } from '../services/branchservice.service';

@Injectable({ providedIn: 'root' })
export class BranchResolver implements Resolve<any> {
  constructor(private _branchService: BranchService) {}

  resolve(): Observable<any> {
    return from(this._branchService.getBranches()); // return data before route activation
  }
}
