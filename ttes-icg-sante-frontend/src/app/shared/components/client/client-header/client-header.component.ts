import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-client-header',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule
    ],
    templateUrl: './client-header.component.html',
})
export class ClientHeaderComponent {

    mobileMenuOpen = false;

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

}