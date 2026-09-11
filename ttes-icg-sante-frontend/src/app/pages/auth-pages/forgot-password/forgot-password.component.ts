import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-forgot-password',
    imports: [
        AuthPageLayoutComponent,
        LabelComponent,
        InputFieldComponent,
        ButtonComponent,
        RouterModule,
        FormsModule
    ],
    templateUrl: './forgot-password.component.html',
    styles: ``
})
export class ForgotPasswordComponent {

    email = '';

    loading = false;
    errorMessage = '';
    successMessage = '';

    constructor(private authService: AuthService) {}

    onSubmit(): void {

        this.errorMessage = '';
        this.successMessage = '';

        if (!this.email.trim()) {
            this.errorMessage = 'Veuillez renseigner votre adresse email.';
            return;
        }

        this.loading = true;

        this.authService.forgotPassword(this.email.trim()).subscribe({

            next: () => {
                this.loading = false;
                this.successMessage =
                    'Un email de réinitialisation vient de vous être envoyé.';
            },

            error: (error) => {

                this.loading = false;

                if (error.status === 0) {
                    this.errorMessage =
                        'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';
                    return;
                }

                this.errorMessage =
                    error.error?.message || 'Une erreur est survenue.';
            }
        });
    }
}