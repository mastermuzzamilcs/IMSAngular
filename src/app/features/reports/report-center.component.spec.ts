import { of } from 'rxjs';
import { ReportDefinition, ReportParameterWindowId, ReportValue } from '@mesix/reporting';
import { AuthService } from '../../core/services/auth.service';
import { BranchService } from '../../core/services/branchservice.service';
import { CashTransactionService } from '../../core/reporting/cash-transaction.service';
import { ImsReportCatalogService } from '../../core/reporting/ims-report-catalog.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { ToastService } from '../../core/services/toast.service';
import { ReportCenterComponent } from './report-center.component';

describe('ReportCenterComponent', () => {
  let component: ReportCenterComponent;
  let loadPage: jasmine.Spy;
  let loadAll: jasmine.Spy;
  let loadAggregates: jasmine.Spy;
  let warnings: jasmine.Spy;
  let exportsStart: jasmine.Spy;
  let definition: ReportDefinition;

  beforeEach(() => {
    loadPage = jasmine.createSpy('loadPage').and.resolveTo({
      rows: [{ product: 'Laptop A', quantity: 4 }],
      total: 1,
    });
    loadAll = jasmine.createSpy('loadAll').and.resolveTo([{ product: 'Laptop A', quantity: 4 }]);
    loadAggregates = jasmine
      .createSpy('loadAggregates')
      .and.resolveTo([{ key: 'quantity', label: 'Units', value: 4 }]);
    warnings = jasmine.createSpy('warning');
    exportsStart = jasmine.createSpy('start').and.resolveTo(undefined);

    definition = {
      id: 'inventory-on-hand',
      title: 'Inventory on hand',
      description: 'Current stock by branch.',
      columns: [
        { key: 'product', label: 'Product' },
        { key: 'quantity', label: 'Quantity', format: 'number' },
      ],
      parameterWindowId: ReportParameterWindowId.Inventory,
      loadPage,
      loadAll,
      loadAggregates,
    };

    const registry = {
      register: jasmine.createSpy('register'),
      getAll: () => [definition],
    };
    component = new ReportCenterComponent(
      { definitions: [definition] } as unknown as ImsReportCatalogService,
      {
        currentSession: () => ({ branches: [] }),
        currentBranchId: () => 'branch-1',
      } as unknown as AuthService,
      { getBranches: jasmine.createSpy('getBranches').and.resolveTo([]) } as unknown as BranchService,
      { busy: false, start: exportsStart } as never,
      { record: jasmine.createSpy('record').and.resolveTo(undefined) } as unknown as CashTransactionService,
      {
        warning: warnings,
        error: jasmine.createSpy('error'),
        success: jasmine.createSpy('success'),
      } as unknown as ToastService,
      { data: of({ reportId: 'inventory-on-hand' }) } as never,
      registry as never,
      {
        currencyName: 'US Dollar',
        currencyCode: 'USD',
        formatCurrency: (value: number) => `$${value.toFixed(2)}`,
      } as unknown as AppSettingsService,
    );
    component.ngOnInit();
  });

  it('loads the requested page and aggregates together and exposes the result', async () => {
    await component.load(0);

    expect(loadPage).toHaveBeenCalledWith(
      jasmine.objectContaining({ pageIndex: 0, pageSize: 25, filters: jasmine.any(Object) }),
    );
    expect(loadAggregates).toHaveBeenCalled();
    expect(component.rows).toEqual([{ product: 'Laptop A', quantity: 4 }]);
    expect(component.total).toBe(1);
    expect(component.aggregates[0].value).toBe(4);
    expect(component.loaded).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('does not query when the selected date range is invalid', async () => {
    component.filters = {
      branchId: 'branch-1',
      fromDate: '2026-10-20',
      toDate: '2026-10-01',
      search: '',
    };

    await component.load();

    expect(warnings).toHaveBeenCalled();
    expect(loadPage).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('clears loading state and displays a useful error when report loading fails', async () => {
    loadPage.and.rejectWith(new Error('Report query failed'));

    await component.load();

    expect(component.error).toBe('Report query failed');
    expect(component.rows).toEqual([]);
    expect(component.aggregates).toEqual([]);
    expect(component.loading).toBeFalse();
    expect(component.loaded).toBeFalse();
  });

  it('uses the report currency formatter for currency values', () => {
    expect(component.display(12.5 as ReportValue, 'currency')).toBe('$12.50');
  });

  it('keeps filter inputs stable when derived labels change', () => {
    component.filters = {
      branchId: 'branch-1',
      fromDate: '2026-10-01',
      toDate: '2026-10-17',
      search: '',
      customValues: {
        brandId: 'brand-1',
        brandIdLabel: 'Acer',
        branchLabel: 'Main',
        appliedFilters: 'Brand: Acer',
      },
    };

    const values = component.parameterValues;

    expect(values['brandId']).toBe('brand-1');
    expect(values['brandIdLabel']).toBeUndefined();
    expect(values['appliedFilters']).toBeUndefined();
    expect(component.parameterValues).toBe(values);
  });

  it('starts an export using the selected report and filters', async () => {
    await component.export('xlsx');

    expect(exportsStart).toHaveBeenCalled();
    expect(exportsStart.calls.mostRecent().args[0]).toBe(definition.title);
    expect(exportsStart.calls.mostRecent().args[2]).toBe('xlsx');
    expect(loadAll).not.toHaveBeenCalled();
  });
});
