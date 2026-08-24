import { Component, OnInit } from '@angular/core';

import { EcommerceMetricsComponent } from '../../../shared/components/ecommerce/ecommerce-metrics/ecommerce-metrics.component';
import { MonthlySalesChartComponent } from '../../../shared/components/ecommerce/monthly-sales-chart/monthly-sales-chart.component';
import { MonthlyTargetComponent } from '../../../shared/components/ecommerce/monthly-target/monthly-target.component';
import { StatisticsChartComponent } from '../../../shared/components/ecommerce/statics-chart/statics-chart.component';
import { DemographicCardComponent } from '../../../shared/components/ecommerce/demographic-card/demographic-card.component';
import { RecentOrdersComponent } from '../../../shared/components/ecommerce/recent-orders/recent-orders.component';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-ecommerce',

  imports: [
    EcommerceMetricsComponent,
    MonthlySalesChartComponent,
    MonthlyTargetComponent,
    StatisticsChartComponent,
    DemographicCardComponent,
    RecentOrdersComponent,
  ],

  templateUrl: './ecommerce.component.html',
})
export class EcommerceComponent implements OnInit {

  isAdmin = false;

  userEmail: string | null = null;

  userRoles: string[] = [];

  constructor(
      private authService: AuthService
  ) {}

  ngOnInit(): void {

    this.userEmail =
        this.authService.getUserEmail();

    this.userRoles =
        this.authService.getRoles();

    this.isAdmin =
        this.authService.isAdmin();

    console.log(
        'Dashboard utilisateur:',
        this.userEmail
    );

    console.log(
        'Dashboard rôles:',
        this.userRoles
    );

    console.log(
        'Dashboard ADMIN:',
        this.isAdmin
    );
  }
}