
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GlobalThemeToggleComponent } from './shared/components/common/global-theme-toggle/global-theme-toggle.component';
import { ChatWidgetComponent } from './shared/components/chat-widget/chat-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    GlobalThemeToggleComponent,
    ChatWidgetComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'TTES-ICG-ACADEMY VENTE DES PRODUITS';
}
