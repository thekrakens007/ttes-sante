import { AfterViewInit, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';

import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

import {
  parsePhoneNumberFromString,
  PhoneNumber
} from 'libphonenumber-js';

import {
  PHONE_COUNTRIES,
  PhoneCountry
} from '../../../utils/phone-countries';

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

  /**
   * Numéro saisi par l'utilisateur.
   *
   * Exemple :
   * 699123456
   */
  phone = '';

  /**
   * Liste des pays disponibles.
   */
  countries = PHONE_COUNTRIES;

  /**
   * Pays sélectionné par défaut.
   *
   * Cameroun = premier élément de PHONE_COUNTRIES.
   */
  selectedCountry: PhoneCountry = PHONE_COUNTRIES[0];

  /**
   * Message spécifique concernant le téléphone.
   */
  phoneError = '';

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
      private authService: AuthService,
      private router: Router,
      private route: ActivatedRoute
  ) {}

  /**
   * Initialisation du bouton Google.
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
   * Afficher / cacher le mot de passe.
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Changement de pays.
   */
  onCountryChange(event: Event): void {

    const select =
        event.target as HTMLSelectElement;

    const country =
        this.countries.find(
            c => c.code === select.value
        );

    if (country) {

      this.selectedCountry = country;

      /*
       * On efface l'ancien message d'erreur
       * lorsque l'utilisateur change de pays.
       */
      this.phoneError = '';

      /*
       * On revalide si un numéro est déjà saisi.
       */
      if (this.phone.trim()) {
        this.validatePhone();
      }
    }
  }

  /**
   * Validation du numéro de téléphone.
   *
   * La bibliothèque libphonenumber-js utilise
   * les règles téléphoniques du pays sélectionné.
   */
  validatePhone(): PhoneNumber | null {

    this.phoneError = '';

    const value = this.phone.trim();

    if (!value) {

      this.phoneError =
          'Le numéro de téléphone est obligatoire.';

      return null;
    }

    /*
     * On permet à libphonenumber-js de déterminer
     * correctement le numéro à partir du pays sélectionné.
     *
     * Exemple :
     *
     * pays = CM
     * numéro = 699123456
     *
     * devient :
     *
     * +237699123456
     */
    const phoneNumber =
        parsePhoneNumberFromString(
            value,
            this.selectedCountry.code as any
        );

    if (!phoneNumber) {

      this.phoneError =
          `Le numéro saisi n'est pas reconnu pour ${this.selectedCountry.name}.`;

      return null;
    }

    /*
     * Vérification réelle du numéro
     * selon les règles du pays.
     */
    if (!phoneNumber.isValid()) {

      this.phoneError =
          `Le numéro de téléphone n'est pas valide pour ${this.selectedCountry.name}.`;

      return null;
    }

    return phoneNumber;
  }

  /**
   * Inscription classique.
   */
  onSignUp(): void {

    this.errorMessage = '';
    this.successMessage = '';
    this.phoneError = '';

    /*
     * Vérification des champs obligatoires.
     */
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

    /*
     * Conditions générales.
     */
    if (!this.isChecked) {

      this.errorMessage =
          'Vous devez accepter les conditions générales et la politique de confidentialité.';

      return;
    }

    /*
     * Validation email.
     */
    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(this.email.trim())) {

      this.errorMessage =
          'Veuillez renseigner une adresse email valide.';

      return;
    }

    /*
     * Validation du téléphone.
     */
    const phoneNumber =
        this.validatePhone();

    if (!phoneNumber) {

      return;
    }

    /*
     * Mot de passe.
     */
    if (this.password.length < 6) {

      this.errorMessage =
          'Le mot de passe doit contenir au moins 6 caractères.';

      return;
    }

    if (this.loading) {

      return;
    }

    this.loading = true;

    /*
     * Format international E.164.
     *
     * Exemple :
     *
     * 699123456
     *
     * devient :
     *
     * +237699123456
     */
    const internationalPhone =
        phoneNumber.number;

    console.log(
        'Numéro téléphone:',
        internationalPhone
    );

    const request = {

      firstName:
          this.fname.trim(),

      lastName:
          this.lname.trim(),

      email:
          this.email.trim(),

      phone:
      internationalPhone,

      password:
      this.password
    };

    this.authService.register(request).subscribe({

      next: (response) => {

        this.loading = false;

        console.log(
            'Inscription réussie:',
            response
        );

        /*
         * On ne va plus vers /signin.
         *
         * On affiche la page indiquant
         * à l'utilisateur de vérifier
         * son adresse email.
         */
        this.router.navigate(
            ['/signup-success'],
            {
              queryParams: {
                email: this.email.trim()
              }
            }
        );
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
   * Inscription avec Google.
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