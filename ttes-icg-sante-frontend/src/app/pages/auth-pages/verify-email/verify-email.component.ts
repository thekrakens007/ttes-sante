import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-verify-email',
    imports: [
        AuthPageLayoutComponent,
        ButtonComponent
    ],
    templateUrl: './verify-email.component.html',
    styles: ``
})
export class VerifyEmailComponent implements OnInit {

    status: 'loading' | 'success' | 'error' = 'loading';
    message = '';

    constructor(
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {

        const token = this.route.snapshot.queryParamMap.get('token');

        if (!token) {
            this.status = 'error';
            this.message = 'Aucun jeton de vérification trouvé dans le lien.';
            return;
        }

        this.authService.verifyEmail(token).subscribe({

            next: (response: any) => {
                this.status = 'success';
                this.message = response?.message || 'Votre email a été vérifié avec succès.';
            },

            error: (error) => {
                this.status = 'error';
                this.message =
                    error.error?.message || 'Ce lien de vérification est invalide ou a expiré.';
            }
        });
    }

    goToSignIn(): void {
        this.router.navigate(['/signin']);
    }
}