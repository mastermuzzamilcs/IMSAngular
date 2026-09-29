import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  salesChart: any;
  inventoryChart: any;
  transferChart: any;

  kpiData = {
    totalStock: 0,
    outOfStock: 0,
    lowStock: 0,
    totalSales: 0,
    pendingTransfers: 0,
  };

  constructor() {}

  ngOnInit(): void {
    this.loadKpiData();
    this.initCharts();
  }

  loadKpiData(): void {
    // Load KPI data from service
  }

  initCharts(): void {
    this.initSalesChart();
    this.initInventoryChart();
    this.initTransferChart();
  }

  initSalesChart(): void {
    const ctx = document.getElementById('salesChart') as HTMLCanvasElement;
    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Sales',
            data: [12, 19, 3, 5, 2, 3],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      },
    });
  }

  initInventoryChart(): void {
    const ctx = document.getElementById('inventoryChart') as HTMLCanvasElement;
    this.inventoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['In Stock', 'Low Stock', 'Out of Stock'],
        datasets: [
          {
            data: [300, 50, 100],
            backgroundColor: ['rgb(54, 162, 235)', 'rgb(255, 205, 86)', 'rgb(255, 99, 132)'],
          },
        ],
      },
    });
  }

  initTransferChart(): void {
    const ctx = document.getElementById('transferChart') as HTMLCanvasElement;
    this.transferChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Branch A', 'Branch B', 'Branch C', 'Branch D'],
        datasets: [
          {
            label: 'Transfers',
            data: [12, 19, 3, 5],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1,
          },
        ],
      },
    });
  }
}
