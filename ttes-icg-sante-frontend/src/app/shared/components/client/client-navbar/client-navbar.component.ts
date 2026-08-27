import {
    Component,
    inject
} from '@angular/core';

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


    // ==========================================
    // SERVICES
    // ==========================================

    private authService = inject(AuthService);

    private router = inject(Router);


    // ==========================================
    // RECHERCHE
    // ==========================================

    searchTerm = '';


    // ==========================================
    // MENU MOBILE
    // ==========================================

    mobileMenuOpen = false;


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

        return this.authService.hasRole(
            'ROLE_ADMIN'
        );

    }


    // ==========================================
    // PAGE PROFILE ?
    // ==========================================

    isProfilePage(): boolean {

        return this.router.url === '/profile';

    }


    // ==========================================
    // OUVRIR / FERMER MENU MOBILE
    // ==========================================

    toggleMobileMenu(): void {

        this.mobileMenuOpen =
            !this.mobileMenuOpen;

    }


    // ==========================================
    // FERMER MENU MOBILE
    // ==========================================

    closeMobileMenu(): void {

        this.mobileMenuOpen = false;

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
    // DÉCONNEXION
    // ==========================================

    logout(): void {

        console.log(
            'Déconnexion...'
        );

        this.mobileMenuOpen = false;

        this.authService.logout();

        this.router.navigate([
            '/'
        ]);

    }

}