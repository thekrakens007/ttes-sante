import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {

    const authService = inject(AuthService);
    const router = inject(Router);

    // Utilisateur déjà connecté
    if (authService.isLoggedIn()) {

        // On l'envoie directement vers son profil
        return router.createUrlTree(['/profile']);
    }

    // Utilisateur non connecté
    return true;
};