import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import {RouterModule, Router, ActivatedRoute} from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-signin-form',
  imports: [
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  showPassword = false;
  isChecked = false;

  email = '';
  password = '';

  loading = false;
  errorMessage = '';


  constructor(
      private authService: AuthService,
      private router: Router,
      private route: ActivatedRoute
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSignIn(): void {

    // Réinitialiser le message d'erreur
    this.errorMessage = '';

    // Vérification des champs
    if (!this.email || !this.password) {

      this.errorMessage =
          'Veuillez renseigner votre email et votre mot de passe.';

      return;
    }

    this.loading = true;

    this.authService
        .login(this.email, this.password)
        .subscribe({

          next: (response) => {

            this.loading = false;

            console.log('Connexion réussie');
            console.log('JWT:', response.token);

            console.log(
                'Email:',
                this.authService.getUserEmail()
            );

            console.log(
                'Roles:',
                this.authService.getRoles()
            );

            console.log(
                'Administrateur:',
                this.authService.isAdmin()
            );

            // Redirection selon le rôle
            const returnUrl =
                this.route.snapshot.queryParamMap.get('returnUrl');

            if (returnUrl && returnUrl.startsWith('/')) {
              this.router.navigateByUrl(returnUrl);
            } else if (this.authService.isAdmin()) {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate(['/']);
            }
          },

          error: (error) => {

            this.loading = false;

            console.error(
                'Erreur de connexion:',
                error
            );

            // Erreur réseau / backend inaccessible
            if (error.status === 0) {

              this.errorMessage =
                  'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';

              return;
            }

            // Identifiants incorrects
            if (error.status === 401) {

              this.errorMessage =
                  'Email ou mot de passe incorrect.';

              return;
            }

            // Accès refusé
            if (error.status === 403) {

              this.errorMessage =
                  'Accès refusé. Ce compte ne possède pas les droits administrateur.';

              return;
            }

            // Autre erreur
            this.errorMessage =
                'Une erreur est survenue lors de la connexion.';

          }

        });
  }
}