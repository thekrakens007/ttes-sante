import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    Router,
    RouterLink,
    RouterLinkActive
} from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-client-navbar',
    standalone: true,

    imports: [
        CommonModule,
        RouterLink,
        RouterLinkActive,
        FormsModule
    ],

    templateUrl: './client-navbar.component.html'
})
export class ClientNavbarComponent {

    private authService = inject(AuthService);
    private router = inject(Router);


    // ==========================================
    // RECHERCHE
    // ==========================================

    searchTerm = '';


    // ==========================================
    // UTILISATEUR CONNECTÉ ?
    // ==========================================

    isLoggedIn(): boolean {

        return this.authService.isLoggedIn();

    }


    // ==========================================
    // UTILISATEUR ADMIN ?
    // ==========================================

    isAdmin(): boolean {

        return this.authService.hasRole('ROLE_ADMIN');

    }


    // ==========================================
    // PAGE PROFILE ?
    // ==========================================

    isProfilePage(): boolean {

        return this.router.url === '/profile';

    }


    // ==========================================
    // RECHERCHE
    // ==========================================

    search(): void {

        console.log(
            'Recherche :',
            this.searchTerm
        );

    }


    // ==========================================
    // DECONNEXION
    // ==========================================

    logout(): void {

        console.log('Déconnexion...');

        this.authService.logout();

        this.router.navigate(['/']);

    }

}