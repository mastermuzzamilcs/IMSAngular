import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { from, Observable } from 'rxjs';
import { BranchService } from '../services/branchservice.service';
import { Branch } from '../Models/BranchModel';

@Injectable({ providedIn: 'root' })
export class BranchResolver implements Resolve<Branch[]> {
  constructor(private _branchService: BranchService) {}

  resolve(): Observable<Branch[]> {
    return from(this._branchService.getBranches()); // return data before route activation
  }
}
