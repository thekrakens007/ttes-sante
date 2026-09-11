import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-reset-password',
    imports: [
        AuthPageLayoutComponent,
        LabelComponent,
        InputFieldComponent,
        ButtonComponent,
        RouterModule,
        FormsModule
    ],
    templateUrl: './reset-password.component.html',
    styles: ``
})
export class ResetPasswordComponent implements OnInit {

    token = '';
    newPassword = '';
    confirmPassword = '';
    showPassword = false;

    tokenMissing = false;
    loading = false;
    errorMessage = '';
    successMessage = '';

    constructor(
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {

        this.token = this.route.snapshot.queryParamMap.get('token') || '';

        if (!this.token) {
            this.tokenMissing = true;
        }
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    onSubmit(): void {

        this.errorMessage = '';
        this.successMessage = '';

        if (!this.newPassword || !this.confirmPassword) {
            this.errorMessage = 'Veuillez renseigner et confirmer votre nouveau mot de passe.';
            return;
        }

        if (this.newPassword.length < 6) {
            this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.errorMessage = 'Les mots de passe ne correspondent pas.';
            return;
        }

        this.loading = true;

        this.authService.resetPassword(this.token, this.newPassword).subscribe({

            next: () => {

                this.loading = false;
                this.successMessage =
                    'Votre mot de passe a été réinitialisé. Redirection vers la connexion...';

                setTimeout(() => {
                    this.router.navigate(['/signin']);
                }, 1500);
            },

            error: (error) => {

                this.loading = false;

                if (error.status === 0) {
                    this.errorMessage =
                        'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';
                    return;
                }

                this.errorMessage =
                    error.error?.message || 'Ce lien de réinitialisation est invalide ou a expiré.';
            }
        });
    }
}