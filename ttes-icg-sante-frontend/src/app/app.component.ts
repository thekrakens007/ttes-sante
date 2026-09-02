import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GlobalThemeToggleComponent } from './shared/components/common/global-theme-toggle/global-theme-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    GlobalThemeToggleComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Angular Ecommerce Dashboard | TailAdmin';
}