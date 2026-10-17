import { AfterViewInit, Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AppCurrencyPipe } from '../../../core/pipes/app-currency.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MxCardComponent, MxPageHeaderComponent } from '@mesix/custom-control';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../../core/services/auth.service';
import { BranchService } from '../../../core/services/branchservice.service';
import { StockService } from '../../../core/services/stock.service';
import { UsersService } from '../../../core/services/users.service';
import { WorkflowService } from '../../../core/services/Workflow.service';
import { RequestStatus, RequestType, WorkflowRequest } from '../../../core/Models/WorkflowModel';
import { Stock } from '../../../core/Models/StockModel';

Chart.register(...registerables);

interface ActivityItem {
  icon: string;
  title: string;
  detail: string;
  when: string;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    AppCurrencyPipe,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MxCardComponent,
    MxPageHeaderComponent,
  ],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, AfterViewInit, OnDestroy {
  totalInventory = 0;
  lowStockItems = 0;
  pendingTransfers = 0;
  todaysSales = 0;
  recentActivity: ActivityItem[] = [];

  private watchedBranch = '';
  private viewReady = false;
  private pendingSalesTrend: { labels: string[]; data: number[] } = { labels: [], data: [] };
  private pendingInventoryByBranch: { label: string; value: number }[] = [];
  private salesChart?: Chart;
  private inventoryChart?: Chart;
  private branchNames = new Map<string, string>();
  private userNames = new Map<string, string>();

  constructor(
    private auth: AuthService,
    private stockService: StockService,
    private workflowService: WorkflowService,
    private branchService: BranchService,
    private usersService: UsersService,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.auth.session$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((session) => {
      const next = session?.branchid || '';
      if (next === this.watchedBranch) {
        return;
      }
      this.watchedBranch = next;
      void this.loadDashboard();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts(this.pendingSalesTrend, this.pendingInventoryByBranch);
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private async loadDashboard(): Promise<void> {
    const branchId = this.auth.currentBranchId();
    if (!branchId) {
      this.resetKpis();
      this.recentActivity = [];
      this.renderCharts({ labels: [], data: [] }, []);
      return;
    }

    try {
      const salesSince = new Date();
      salesSince.setMonth(salesSince.getMonth() - 5, 1);
      salesSince.setHours(0, 0, 0, 0);
      const [
        overview,
        recentRequests,
        pendingTransferCount,
        approvedSales,
        branches,
        users,
        allBranchTotals,
      ] = await Promise.all([
        this.stockService.getStockOverviewByBranch(branchId),
        this.workflowService.getRecentForBranch(branchId, 8),
        this.workflowService.getPendingTransferCount(branchId),
        this.workflowService.getApprovedSalesSince(branchId, salesSince),
        this.branchService.getBranches(),
        this.usersService.getUsers(),
        this.loadInventoryByBranch(),
      ]);

      this.branchNames = new Map(
        branches.map((branch) => [branch.branchid || '', branch.name || '']),
      );
      this.userNames = new Map(users.map((user) => [user.userid || '', user.name || '']));

      this.totalInventory = overview.reduce(
        (sum, item) => sum + (Number(item.balanceQuantity ?? item.quantity) || 0),
        0,
      );
      this.lowStockItems = overview.filter((item) => {
        const onHand = Number(item.balanceQuantity ?? item.quantity) || 0;
        return onHand < 5;
      }).length;

      this.pendingTransfers = pendingTransferCount;

      const saleModuleIds = new Set(
        approvedSales
          .filter((request) => this.isSameDay(request.requestedOn, new Date()))
          .map((request) => request.moduleId),
      );
      const stocks = await this.stockService.getStockByBranch(branchId);
      this.todaysSales = stocks
        .filter((stock) => stock.stockid && saleModuleIds.has(stock.stockid))
        .reduce((sum, stock) => sum + (Number(stock.NetTotal) || 0), 0);

      this.recentActivity = this.buildRecentActivity(recentRequests);
      this.renderCharts(this.buildSalesTrend(approvedSales, stocks), allBranchTotals);
    } catch (error) {
      console.error('Error loading dashboard', error);
      this.resetKpis();
      this.recentActivity = [];
      this.renderCharts({ labels: [], data: [] }, []);
    }
  }

  private resetKpis(): void {
    this.totalInventory = 0;
    this.lowStockItems = 0;
    this.pendingTransfers = 0;
    this.todaysSales = 0;
  }

  private async loadInventoryByBranch(): Promise<{ label: string; value: number }[]> {
    const sessionBranches = this.auth.currentSession()?.branches || [];
    const targets =
      sessionBranches.length > 0
        ? sessionBranches.map((branch) => ({
            id: branch.branchid,
            name: branch.name || branch.branchid,
          }))
        : (await this.branchService.getBranches()).map((branch) => ({
            id: branch.branchid || '',
            name: branch.name || branch.branchid || '',
          }));

    const rows = await Promise.all(
      targets
        .filter((branch) => !!branch.id)
        .map(async (branch) => {
          const overview = await this.stockService.getStockOverviewByBranch(branch.id);
          const value = overview.reduce(
            (sum, item) => sum + (Number(item.balanceQuantity ?? item.quantity) || 0),
            0,
          );
          return { label: branch.name, value };
        }),
    );
    return rows;
  }

  private buildSalesTrend(
    requests: WorkflowRequest[],
    stocks: Stock[],
  ): { labels: string[]; data: number[] } {
    const stockById = new Map(
      stocks.filter((stock) => !!stock.stockid).map((stock) => [stock.stockid as string, stock]),
    );
    const now = new Date();
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleString(undefined, { month: 'short' }),
        total: 0,
      });
    }
    const index = new Map(months.map((month) => [month.key, month]));

    for (const request of requests) {
      if (
        request.requestType !== RequestType.Sales ||
        request.status !== RequestStatus.Approved ||
        !request.requestedOn
      ) {
        continue;
      }
      const when = new Date(request.requestedOn);
      const key = `${when.getFullYear()}-${when.getMonth()}`;
      const bucket = index.get(key);
      if (!bucket) {
        continue;
      }
      bucket.total += Number(stockById.get(request.moduleId)?.NetTotal) || 0;
    }

    return {
      labels: months.map((month) => month.label),
      data: months.map((month) => month.total),
    };
  }

  private buildRecentActivity(requests: WorkflowRequest[]): ActivityItem[] {
    return [...requests]
      .sort((a, b) => +new Date(b.requestedOn) - +new Date(a.requestedOn))
      .slice(0, 8)
      .map((request) => {
        const who = this.userNames.get(request.requestedBy) || request.requestedBy || 'System';
        const type = request.requestType;
        return {
          icon: this.activityIcon(type),
          title: `${type} · ${request.status}`,
          detail: `${this.branchLabel(request)} · by ${who}`,
          when: this.relativeTime(request.requestedOn),
        };
      });
  }

  private branchLabel(request: WorkflowRequest): string {
    const from = this.branchNames.get(request.branchId || '') || request.branchId || '';
    const to = this.branchNames.get(request.toBranchId || '') || request.toBranchId || '';
    if (request.requestType === RequestType.Transfer) {
      if (from && to && from !== to) {
        return `${from} → ${to}`;
      }
      return from || to || '—';
    }
    return from || '—';
  }

  private activityIcon(type: RequestType): string {
    switch (type) {
      case RequestType.Transfer:
        return 'swap_horiz';
      case RequestType.Sales:
        return 'point_of_sale';
      case RequestType.SalesReturn:
        return 'assignment_return';
      case RequestType.StockIn:
        return 'move_to_inbox';
      case RequestType.StockOut:
        return 'outbox';
      default:
        return 'history';
    }
  }

  private relativeTime(value: Date | string | undefined): string {
    if (!value) {
      return '';
    }
    const then = new Date(value).getTime();
    const diffMs = Date.now() - then;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) {
      return 'Just now';
    }
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  private isSameDay(value: Date | string | undefined, other: Date): boolean {
    if (!value) {
      return false;
    }
    const date = new Date(value);
    return (
      date.getFullYear() === other.getFullYear() &&
      date.getMonth() === other.getMonth() &&
      date.getDate() === other.getDate()
    );
  }

  private renderCharts(
    salesTrend: { labels: string[]; data: number[] },
    inventoryByBranch: { label: string; value: number }[],
  ): void {
    this.pendingSalesTrend = salesTrend;
    this.pendingInventoryByBranch = inventoryByBranch;
    if (!this.viewReady) {
      return;
    }
    this.destroyCharts();
    this.initCharts(salesTrend, inventoryByBranch);
  }

  private destroyCharts(): void {
    this.salesChart?.destroy();
    this.inventoryChart?.destroy();
    this.salesChart = undefined;
    this.inventoryChart = undefined;
  }

  private initCharts(
    salesTrend: { labels: string[]; data: number[] },
    inventoryByBranch: { label: string; value: number }[],
  ): void {
    const salesCtx = document.getElementById('salesChart') as HTMLCanvasElement | null;
    if (salesCtx) {
      this.salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
          labels: salesTrend.labels.length
            ? salesTrend.labels
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Sales',
              data: salesTrend.data.length ? salesTrend.data : [0, 0, 0, 0, 0, 0],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            },
          ],
        },
      });
    }

    const inventoryCtx = document.getElementById('inventoryChart') as HTMLCanvasElement | null;
    if (inventoryCtx) {
      const labels = inventoryByBranch.map((row) => row.label);
      const data = inventoryByBranch.map((row) => row.value);
      this.inventoryChart = new Chart(inventoryCtx, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['No data'],
          datasets: [
            {
              data: data.length ? data : [1],
              backgroundColor: [
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)',
                'rgb(255, 99, 132)',
                'rgb(75, 192, 192)',
                'rgb(153, 102, 255)',
                'rgb(255, 159, 64)',
              ],
            },
          ],
        },
      });
    }
  }
}
