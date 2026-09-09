import { Component, OnInit, inject } from '@angular/core';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexPlotOptions, ApexDataLabels, ApexStroke, ApexLegend, ApexYAxis, ApexGrid, ApexFill, ApexTooltip } from 'ng-apexcharts';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { AdminService } from '../../../../core/services/admin.service';
import { OrderResponse } from '../../../../core/interfaces/order-response.interface';

@Component({
  selector: 'app-monthly-sales-chart',
  standalone: true,
  imports: [
    NgApexchartsModule,
    DropdownComponent,
    DropdownItemComponent
  ],
  templateUrl: './monthly-sales-chart.component.html'
})
export class MonthlySalesChartComponent implements OnInit {

  private adminService = inject(AdminService);

  public series: ApexAxisChartSeries = [
    {
      name: 'Ventes',
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  ];
  public chart: ApexChart = {
    fontFamily: 'Outfit, sans-serif',
    type: 'bar',
    height: 180,
    toolbar: { show: false },
  };
  public xaxis: ApexXAxis = {
    categories: [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
    ],
    axisBorder: { show: false },
    axisTicks: { show: false },
  };
  public plotOptions: ApexPlotOptions = {
    bar: {
      horizontal: false,
      columnWidth: '39%',
      borderRadius: 5,
      borderRadiusApplication: 'end',
    },
  };
  public dataLabels: ApexDataLabels = { enabled: false };
  public stroke: ApexStroke = {
    show: true,
    width: 4,
    colors: ['transparent'],
  };
  public legend: ApexLegend = {
    show: true,
    position: 'top',
    horizontalAlign: 'left',
    fontFamily: 'Outfit',
  };
  public yaxis: ApexYAxis = { title: { text: undefined } };
  public grid: ApexGrid = { yaxis: { lines: { show: true } } };
  public fill: ApexFill = { opacity: 1 };
  public tooltip: ApexTooltip = {
    x: { show: false },
    y: { formatter: (val: number) => `${val.toLocaleString('fr-FR')} FCFA` },
  };
  public colors: string[] = ['#465fff'];

  isOpen = false;

  ngOnInit(): void {
    this.loadMonthlySales();
  }

  loadMonthlySales(): void {

    this.adminService.getOrders().subscribe({

      next: (orders: OrderResponse[]) => {

        const currentYear = new Date().getFullYear();
        const monthlyTotals = new Array(12).fill(0);

        orders.forEach((order) => {

          if (!order.createdAt) {
            return;
          }

          const date = new Date(order.createdAt);

          if (date.getFullYear() === currentYear) {
            monthlyTotals[date.getMonth()] += Number(order.totalAmount || 0);
          }

        });

        this.series = [{ name: 'Ventes', data: monthlyTotals }];

      },

      error: (error) => {
        console.error('Erreur lors du chargement des ventes mensuelles:', error);
      }

    });

  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }
}