import { TestBed } from '@angular/core/testing';

import { BranchserviceService } from './branchservice.service';

describe('BranchserviceService', () => {
  let service: BranchserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BranchserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
