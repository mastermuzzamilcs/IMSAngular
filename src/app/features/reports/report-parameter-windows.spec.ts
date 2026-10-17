import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AuthService } from '../../core/services/auth.service';
import { BranchService } from '../../core/services/branchservice.service';
import { BrandService } from '../../core/services/brand.service';
import { CustomerService } from '../../core/services/customer.service';
import { ProductService } from '../../core/services/product.service';
import { UsersService } from '../../core/services/users.service';
import { VendorService } from '../../core/services/vendor.service';
import { ToastService } from '../../core/services/toast.service';
import {
  AnalyticsReportParametersComponent,
  CashFlowReportParametersComponent,
} from './report-parameter-windows';

describe('report parameter windows', () => {
  const auth = {
    currentSession: () => ({ branches: [{ branchid: 'b1', name: 'Main' }] }),
    currentBranchId: () => 'b1',
  };
  const emptyList = () => Promise.resolve([]);

  it('reuses one Date instance for a date string', () => {
    const component = new CashFlowReportParametersComponent(
      auth as unknown as AuthService,
      { getBranches: emptyList } as unknown as BranchService,
      { getCustomers: emptyList } as unknown as CustomerService,
      { getVendors: emptyList } as unknown as VendorService,
      { error() {} } as unknown as ToastService,
    );

    const first = component.dateValue('2026-10-01');

    expect(first).toEqual(new Date(2026, 9, 1));
    expect(component.dateValue('2026-10-01')).toBe(first);
  });

  it('does not republish filters when the parent echoes the current values', () => {
    const component = new AnalyticsReportParametersComponent(
      auth as unknown as AuthService,
      { getBranches: emptyList } as unknown as BranchService,
      { getProducts: emptyList } as unknown as ProductService,
      { getBrands: emptyList } as unknown as BrandService,
      { getCustomers: emptyList } as unknown as CustomerService,
      { getVendors: emptyList } as unknown as VendorService,
      { getUsers: emptyList } as unknown as UsersService,
      { error() {} } as unknown as ToastService,
    );
    component.branches = [{ id: 'b1', label: 'Main' }];
    component.initialValues = {
      reportId: 'low-stock',
      branchId: 'b1',
      fromDate: '',
      toDate: '',
    };
    const emissions: Record<string, unknown>[] = [];
    component.filtersChange.subscribe((filters) => emissions.push(filters));

    component.ngOnChanges();

    expect(emissions).toEqual([]);
    expect(component.optionsFor(component.fields[0])).toBe(
      component.optionsFor(component.fields[0]),
    );
  });

  it('renders date filters without scheduling another change detection pass', async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsReportParametersComponent],
      providers: [
        provideNativeDateAdapter(),
        { provide: AuthService, useValue: auth },
        { provide: BranchService, useValue: { getBranches: emptyList } },
        { provide: ProductService, useValue: { getProducts: emptyList } },
        { provide: BrandService, useValue: { getBrands: emptyList } },
        { provide: CustomerService, useValue: { getCustomers: emptyList } },
        { provide: VendorService, useValue: { getVendors: emptyList } },
        { provide: UsersService, useValue: { getUsers: emptyList } },
        { provide: ToastService, useValue: { error() {} } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AnalyticsReportParametersComponent);
    fixture.componentInstance.initialValues = {
      reportId: 'sales-summary',
      branchId: 'b1',
      fromDate: '2026-10-01',
      toDate: '2026-10-17',
    };

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('input').length).toBeGreaterThan(0);
    expect(fixture.componentInstance.dateValue('2026-10-01')).toBe(
      fixture.componentInstance.dateValue('2026-10-01'),
    );
  });
});
