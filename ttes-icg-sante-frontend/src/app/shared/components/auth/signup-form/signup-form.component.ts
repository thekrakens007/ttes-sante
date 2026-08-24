import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-signup-form',
  imports: [
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule
  ],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent {

  showPassword = false;
  isChecked = false;

  fname = '';
  lname = '';
  email = '';
  password = '';
  phone = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
      private authService: AuthService,
      private router: Router
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSignUp(): void {

    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (
        !this.fname.trim() ||
        !this.lname.trim() ||
        !this.email.trim() ||
        !this.phone.trim() ||
        !this.password.trim()
    ) {
      this.errorMessage =
          'Veuillez renseigner tous les champs obligatoires.';

      return;
    }

    // Vérification des conditions
    if (!this.isChecked) {

      this.errorMessage =
          'Vous devez accepter les conditions générales et la politique de confidentialité.';

      return;
    }

    // Validation email
    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(this.email)) {

      this.errorMessage =
          'Veuillez renseigner une adresse email valide.';

      return;
    }

    // Validation téléphone
    const phoneRegex = /^[0-9+\s()-]{8,20}$/;

    if (!phoneRegex.test(this.phone.trim())) {

      this.errorMessage =
          'Veuillez renseigner un numéro de téléphone valide.';

      return;
    }

    // Validation mot de passe
    if (this.password.length < 6) {

      this.errorMessage =
          'Le mot de passe doit contenir au moins 6 caractères.';

      return;
    }

    this.loading = true;

    const request = {
      firstName: this.fname.trim(),
      lastName: this.lname.trim(),
      email: this.email.trim(),
      phone: this.phone.trim(),
      password: this.password
    };

    console.log('Inscription:', request);

    this.authService.register(request).subscribe({

      next: (response) => {

        this.loading = false;

        console.log('Inscription réussie:', response);

        this.successMessage =
            'Votre compte a été créé avec succès. Redirection vers la connexion...';

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },

      error: (error) => {

        this.loading = false;

        console.error(
            'Erreur inscription:',
            error
        );

        if (error.status === 409) {

          this.errorMessage =
              'Cette adresse email est déjà utilisée.';

          return;
        }

        if (error.status === 400) {

          if (error.error?.message) {

            this.errorMessage =
                error.error.message;

          } else {

            this.errorMessage =
                'Les informations fournies sont invalides.';
          }

          return;
        }

        if (error.status === 0) {

          this.errorMessage =
              'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';

          return;
        }

        this.errorMessage =
            'Une erreur est survenue lors de la création du compte.';
      }
    });
  }
}