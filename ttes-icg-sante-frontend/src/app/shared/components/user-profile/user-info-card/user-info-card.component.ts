import { Component, Input } from '@angular/core';

import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { ModalComponent } from '../../ui/modal/modal.component';

import { User } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import {FormsModule} from "@angular/forms";


@Component({
  selector: 'app-user-info-card',

  imports: [
    FormsModule,
    InputFieldComponent,
    ButtonComponent,
    LabelComponent,
    ModalComponent
  ],

  templateUrl: './user-info-card.component.html',

  styles: ``
})
export class UserInfoCardComponent {

  @Input() user!: User;


  // =========================
  // VARIABLES DE MODIFICATION
  // =========================

  editFirstName = '';
  editLastName = '';
  editEmail = '';
  editPhone = '';


  // =========================
  // ETAT
  // =========================

  isOpen = false;

  saving = false;

  errorMessage = '';

  successMessage = '';


  constructor(
      private userService: UserService
  ) {}


  // =========================
  // OUVRIR LE MODAL
  // =========================

  openModal(): void {

    // Copier les données actuelles
    // dans les variables de modification

    this.editFirstName =
        this.user.firstName || '';

    this.editLastName =
        this.user.lastName || '';

    this.editEmail =
        this.user.email || '';

    this.editPhone =
        this.user.phone || '';


    // Réinitialiser les messages

    this.errorMessage = '';

    this.successMessage = '';


    // Ouvrir le modal

    this.isOpen = true;
  }


  // =========================
  // FERMER LE MODAL
  // =========================

  closeModal(): void {

    if (this.saving) {
      return;
    }

    this.isOpen = false;

  }


  // =========================
  // ENREGISTRER
  // =========================

  handleSave(): void {
    console.log('🔥🔥🔥 HANDLE SAVE APPELÉ');

    console.log('Prénom:', this.editFirstName);
    console.log('Nom:', this.editLastName);
    console.log('Email:', this.editEmail);
    console.log('Téléphone:', this.editPhone);
console.log('yyyyoooooooooooooooooooooooooooooooo');
    // Empêcher plusieurs clics

    if (this.saving) {
      return;
    }


    // Nettoyer les valeurs

    const firstName =
        this.editFirstName.trim();

    const lastName =
        this.editLastName.trim();

    const phone =
        this.editPhone.trim();


    // =========================
    // VALIDATION
    // =========================

    if (!firstName || !lastName) {

      this.errorMessage =
          'Le prénom et le nom sont obligatoires.';

      return;
    }


    // =========================
    // LOADING
    // =========================

    this.saving = true;

    this.errorMessage = '';

    this.successMessage = '';


    // =========================
    // REQUEST
    // =========================

    const request = {

      firstName,

      lastName,

      phone

    };


    console.log(
        'Modification du profil :',
        request
    );


    // =========================
    // APPEL BACKEND
    // =========================

    this.userService
        .updateProfile(request)
        .subscribe({

          // =====================
          // SUCCÈS
          // =====================

          next: (updatedUser) => {

            console.log(
                'Profil modifié :',
                updatedUser
            );


            // Mettre à jour immédiatement
            // les données affichées

            this.user.firstName =
                updatedUser.firstName;

            this.user.lastName =
                updatedUser.lastName;

            this.user.phone =
                updatedUser.phone;


            this.saving = false;


            this.successMessage =
                'Vos informations ont été modifiées avec succès.';


            // Fermer après un court délai

            setTimeout(() => {

              this.isOpen = false;

              this.successMessage = '';

            }, 1000);

          },


          // =====================
          // ERREUR
          // =====================

          error: (error) => {

            console.error(
                'Erreur modification profil :',
                error
            );


            this.saving = false;


            if (error.status === 400) {

              this.errorMessage =
                  error.error?.message ||
                  'Les informations fournies sont invalides.';

              return;
            }


            if (error.status === 401) {

              this.errorMessage =
                  'Votre session a expiré. Veuillez vous reconnecter.';

              return;
            }


            if (error.status === 403) {

              this.errorMessage =
                  'Vous n’avez pas l’autorisation de modifier ce profil.';

              return;
            }


            if (error.status === 0) {

              this.errorMessage =
                  'Impossible de contacter le serveur.';

              return;
            }


            this.errorMessage =
                'Une erreur est survenue lors de la modification du profil.';

          }

        });

  }

}