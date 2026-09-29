import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatListModule, MatDividerModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    this.initCharts();
  }

  initCharts(): void {
    // Sales chart
    const salesCtx = document.getElementById('salesChart') as HTMLCanvasElement;
    if (salesCtx) {
      new Chart(salesCtx, {
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

    // Inventory chart
    const inventoryCtx = document.getElementById('inventoryChart') as HTMLCanvasElement;
    if (inventoryCtx) {
      new Chart(inventoryCtx, {
        type: 'doughnut',
        data: {
          labels: ['Branch A', 'Branch B', 'Branch C', 'Branch D'],
          datasets: [
            {
              data: [300, 50, 100, 80],
              backgroundColor: [
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)',
                'rgb(255, 99, 132)',
                'rgb(75, 192, 192)',
              ],
            },
          ],
        },
      });
    }
  }
}
