import { AfterViewInit, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';

import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

declare const google: any;

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
export class SignupFormComponent implements AfterViewInit {

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
      private router: Router,
      private route: ActivatedRoute
  ) {}

  /**
   * Initialisation du bouton Google
   */
  ngAfterViewInit(): void {

    if (typeof google === 'undefined') {
      console.error(
          "Google Identity Services n'est pas chargé."
      );
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,

      callback: (response: any) => {
        this.handleGoogleSignup(response.credential);
      }
    });

    const googleButton =
        document.getElementById('google-signup-btn');

    if (googleButton) {

      google.accounts.id.renderButton(
          googleButton,
          {
            theme: 'outline',
            size: 'large',
            text: 'signup_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 240
          }
      );

    } else {
      console.warn(
          "Élément #google-signup-btn introuvable."
      );
    }
  }

  /**
   * Afficher / cacher le mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Inscription classique
   */
  onSignUp(): void {

    this.errorMessage = '';
    this.successMessage = '';

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

    if (!this.isChecked) {
      this.errorMessage =
          'Vous devez accepter les conditions générales et la politique de confidentialité.';
      return;
    }

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage =
          'Veuillez renseigner une adresse email valide.';
      return;
    }

    const phoneRegex =
        /^[0-9+\s()-]{8,20}$/;

    if (!phoneRegex.test(this.phone.trim())) {
      this.errorMessage =
          'Veuillez renseigner un numéro de téléphone valide.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage =
          'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    if (this.loading) {
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

    this.authService.register(request).subscribe({

      next: (response) => {

        this.loading = false;

        console.log(
            'Inscription réussie:',
            response
        );

        // IMPORTANT :
        // On ne va plus vers /signin.
        // On affiche la page indiquant à l'utilisateur
        // de vérifier son adresse email.

        this.router.navigate(['/signup-success'], {
          queryParams: {
            email: this.email.trim()
          }
        });
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

          this.errorMessage =
              error.error?.message ||
              'Les informations fournies sont invalides.';

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

  /**
   * Inscription avec Google
   *
   * Cette méthode reçoit le vrai ID Token
   * fourni par Google Identity Services.
   */
  handleGoogleSignup(idToken: string): void {

    if (!idToken || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log(
        'Inscription Google en cours...'
    );

    this.authService.loginWithGoogle(idToken).subscribe({

      next: (response) => {

        this.loading = false;

        console.log(
            'Inscription Google réussie:',
            response
        );

        /*
         * loginWithGoogle() enregistre le JWT
         * dans localStorage.
         */
        this.router.navigate(['/']);
      },

      error: (error) => {

        this.loading = false;

        console.error(
            'Erreur inscription Google:',
            error
        );

        if (error.status === 409) {

          this.errorMessage =
              'Un compte existe déjà avec cette adresse Google.';

          return;
        }

        if (error.status === 400) {

          this.errorMessage =
              error.error?.message ||
              'Les informations Google sont invalides.';

          return;
        }

        if (error.status === 0) {

          this.errorMessage =
              'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';

          return;
        }

        this.errorMessage =
            error.error?.message ||
            "L'inscription avec Google a échoué.";
      }
    });
  }

  /**
   * Déclenche la fenêtre Google si nécessaire.
   */
  startGoogleSignup(): void {

    if (typeof google === 'undefined') {

      console.error(
          "Google Identity Services n'est pas chargé."
      );

      this.errorMessage =
          'Le service Google n’est pas disponible.';

      return;
    }

    google.accounts.id.prompt();
  }
}