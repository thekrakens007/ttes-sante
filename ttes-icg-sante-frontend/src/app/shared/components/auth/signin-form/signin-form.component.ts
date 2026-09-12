import { AfterViewInit, Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';

import {
  RouterModule,
  Router,
  ActivatedRoute
} from '@angular/router';

import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

declare const google: any;

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
export class SigninFormComponent implements AfterViewInit {

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

  ngAfterViewInit(): void {

    if (typeof google === 'undefined') {
      console.error(
          'Google Identity Services n\'est pas chargé.'
      );
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,

      callback: (response: any) => {
        this.handleGoogleLogin(response.credential);
      }
    });

    const googleButton =
        document.getElementById('google-signin-btn');

    if (googleButton) {

      google.accounts.id.renderButton(
          googleButton,
          {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 240
          }
      );

    } else {

      console.warn(
          'Élément #google-signin-btn introuvable.'
      );

    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSignIn(): void {

    this.errorMessage = '';

    if (this.loading) {
      return;
    }

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

            this.redirectAfterLogin();
          },

          error: (error) => {

            this.loading = false;

            console.error(
                'Erreur de connexion:',
                error
            );

            if (error.status === 0) {

              this.errorMessage =
                  'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';

              return;
            }

            if (error.status === 401) {

              this.errorMessage =
                  'Email ou mot de passe incorrect.';

              return;
            }

            if (error.status === 403) {

              this.errorMessage =
                  'Accès refusé. Ce compte ne possède pas les droits nécessaires.';

              return;
            }

            this.errorMessage =
                'Une erreur est survenue lors de la connexion.';
          }
        });
  }

  startGoogleLogin(): void {

    if (typeof google === 'undefined') {

      console.error(
          'Google Identity Services n\'est pas chargé.'
      );

      this.errorMessage =
          'Le service Google n\'est pas disponible.';

      return;
    }

    google.accounts.id.prompt();
  }

  handleGoogleLogin(idToken: string): void {

    if (!idToken || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    console.log(
        'Connexion Google en cours...'
    );

    this.authService
        .loginWithGoogle(idToken)
        .subscribe({

          next: (response) => {

            this.loading = false;

            console.log(
                'Connexion Google réussie'
            );

            console.log(
                'JWT:',
                response.token
            );

            console.log(
                'Email:',
                this.authService.getUserEmail()
            );

            console.log(
                'Roles:',
                this.authService.getRoles()
            );

            this.redirectAfterLogin();
          },

          error: (error) => {

            this.loading = false;

            console.error(
                'Erreur de connexion Google:',
                error
            );

            if (error.status === 0) {

              this.errorMessage =
                  'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';

              return;
            }

            if (error.status === 401) {

              this.errorMessage =
                  'La connexion avec Google a échoué.';

              return;
            }

            if (error.status === 403) {

              this.errorMessage =
                  'Votre compte Google n\'est pas autorisé à se connecter.';

              return;
            }

            this.errorMessage =
                'Une erreur est survenue lors de la connexion avec Google.';
          }
        });
  }

  private redirectAfterLogin(): void {

    const returnUrl =
        this.route.snapshot.queryParamMap.get(
            'returnUrl'
        );

    if (
        returnUrl &&
        returnUrl.startsWith('/')
    ) {

      this.router.navigateByUrl(
          returnUrl
      );

      return;
    }

    if (this.authService.isAdmin()) {

      this.router.navigate([
        '/admin'
      ]);

    } else {

      this.router.navigate([
        '/'
      ]);

    }
  }
}