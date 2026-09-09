import { Component, OnInit, inject } from '@angular/core';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexFill,
  ApexStroke,
  ApexOptions,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { AdminService } from '../../../../core/services/admin.service';
import { OrderResponse } from '../../../../core/interfaces/order-response.interface';

@Component({
  selector: 'app-monthly-target',
  imports: [
    NgApexchartsModule,
    DropdownComponent,
    DropdownItemComponent
  ],
  templateUrl: './monthly-target.component.html',
})
export class MonthlyTargetComponent implements OnInit {

  private adminService = inject(AdminService);

  public series: ApexNonAxisChartSeries = [0];
  public chart: ApexChart = {
    fontFamily: 'Outfit, sans-serif',
    type: 'radialBar',
    height: 330,
    sparkline: { enabled: true },
  };
  public plotOptions: ApexPlotOptions = {
    radialBar: {
      startAngle: -85,
      endAngle: 85,
      hollow: { size: '80%' },
      track: {
        background: '#E4E7EC',
        strokeWidth: '100%',
        margin: 5,
      },
      dataLabels: {
        name: { show: false },
        value: {
          fontSize: '36px',
          fontWeight: '600',
          offsetY: -40,
          color: '#1D2939',
          formatter: (val: number) => `${val}%`,
        },
      },
    },
  };
  public fill: ApexFill = {
    type: 'solid',
    colors: ['#465FFF'],
  };
  public stroke: ApexStroke = {
    lineCap: 'round',
  };
  public labels: string[] = ['Progress'];
  public colors: string[] = ['#465FFF'];

  isOpen = false;

  // =========================
  // STATISTIQUES RÉELLES
  // =========================

  revenueThisMonth = 0;
  revenueLastMonth = 0;
  revenueToday = 0;
  growthPercent = 0;
  isGrowthPositive = true;

  ngOnInit(): void {
    this.loadMonthlyPerformance();
  }

  loadMonthlyPerformance(): void {

    this.adminService.getOrders().subscribe({

      next: (orders: OrderResponse[]) => {

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        let thisMonthTotal = 0;
        let lastMonthTotal = 0;
        let todayTotal = 0;

        orders.forEach((order) => {

          if (!order.createdAt) {
            return;
          }

          const date = new Date(order.createdAt);
          const amount = Number(order.totalAmount || 0);

          if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
            thisMonthTotal += amount;

            if (date.toDateString() === now.toDateString()) {
              todayTotal += amount;
            }
          }

          if (date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth) {
            lastMonthTotal += amount;
          }

        });

        this.revenueThisMonth = thisMonthTotal;
        this.revenueLastMonth = lastMonthTotal;
        this.revenueToday = todayTotal;

        if (lastMonthTotal > 0) {
          this.growthPercent = Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
        } else {
          this.growthPercent = thisMonthTotal > 0 ? 100 : 0;
        }

        this.isGrowthPositive = this.growthPercent >= 0;

        // La jauge affiche la progression par rapport au mois dernier, plafonnée à 100%
        const gaugeValue = Math.max(0, Math.min(100, this.growthPercent + 50));
        this.series = [gaugeValue];

      },

      error: (error) => {
        console.error('Erreur lors du chargement de la performance mensuelle:', error);
      }

    });

  }

  formatCurrency(value: number): string {

    return new Intl.NumberFormat(
        'fr-FR',
        {
          style: 'currency',
          currency: 'XAF',
          maximumFractionDigits: 0
        }
    ).format(value);

  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }
}