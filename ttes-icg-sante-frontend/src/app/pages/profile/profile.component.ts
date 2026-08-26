import { Component, OnInit } from '@angular/core';

import { RouterLink } from '@angular/router';

import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';

import { UserInfoCardComponent } from '../../shared/components/user-profile/user-info-card/user-info-card.component';

import { UserAddressCardComponent } from '../../shared/components/user-profile/user-address-card/user-address-card.component';

import { ClientNavbarComponent } from '../../shared/components/client/client-navbar/client-navbar.component';

import { UserService } from '../../core/services/user.service';

import { User } from '../../core/models/user.model';


@Component({
  selector: 'app-profile',

  standalone: true,

  imports: [
    RouterLink,
    ClientNavbarComponent,
    PageBreadcrumbComponent,
    UserMetaCardComponent,
    UserInfoCardComponent,
    UserAddressCardComponent
  ],

  templateUrl: './profile.component.html',

  styles: ``
})
export class ProfileComponent implements OnInit {

  user: User | null = null;

  loading = true;

  errorMessage = '';


  constructor(
      private userService: UserService
  ) {}


  ngOnInit(): void {

    this.loadProfile();

  }


  loadProfile(): void {

    this.loading = true;

    this.errorMessage = '';

    this.userService
        .getMyProfile()
        .subscribe({

          next: (data) => {

            console.log(
                'Profil récupéré :',
                data
            );

            this.user = data;

            this.loading = false;

          },

          error: (error) => {

            console.error(
                'Erreur récupération profil :',
                error
            );

            this.loading = false;

            if (error.status === 401) {

              this.errorMessage =
                  'Votre session a expiré. Veuillez vous reconnecter.';

            }

            else if (error.status === 403) {

              this.errorMessage =
                  'Vous n’avez pas accès à votre profil.';

            }

            else if (error.status === 0) {

              this.errorMessage =
                  'Impossible de contacter le serveur.';

            }

            else {

              this.errorMessage =
                  'Impossible de récupérer votre profil.';

            }

          }

        });

  }

}