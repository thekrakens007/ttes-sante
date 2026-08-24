import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

import { BadgeComponent } from '../../ui/badge/badge.component';

import { AdminService } from '../../../../core/services/admin.service';
import { UserAdminResponse } from '../../../../core/interfaces/user-admin-response.interface';
import {RouterLink, RouterModule} from "@angular/router";

@Component({
    selector: 'app-users-table',
    imports: [
        BadgeComponent,
        DatePipe,
        RouterModule
    ],
    templateUrl: './users-table.component.html',
    styles: ``
})
export class UsersTableComponent implements OnInit {

    private adminService = inject(AdminService);

    users: UserAdminResponse[] = [];

    loading = false;

    errorMessage = '';

    ngOnInit(): void {
        this.loadUsers();
    }

    // ==========================================
    // CHARGER LES UTILISATEURS
    // ==========================================

    loadUsers(): void {

        this.loading = true;
        this.errorMessage = '';

        this.adminService.getUsers().subscribe({

            next: (users) => {

                this.users = users;

                this.loading = false;

                console.log(
                    'Utilisateurs chargés :',
                    users
                );
            },

            error: (error) => {

                console.error(
                    'Erreur chargement utilisateurs :',
                    error
                );

                this.errorMessage =
                    'Impossible de charger les utilisateurs.';

                this.loading = false;
            }

        });
    }


    // ==========================================
    // ACTIVER / DESACTIVER
    // ==========================================

    toggleStatus(user: UserAdminResponse): void {

        const newStatus = !user.enabled;

        this.adminService
            .updateUserStatus(
                user.id,
                newStatus
            )
            .subscribe({

                next: (updatedUser) => {

                    user.enabled = updatedUser.enabled;

                },

                error: (error) => {

                    console.error(
                        'Erreur modification statut :',
                        error
                    );

                }

            });
    }


    // ==========================================
    // SUPPRIMER
    // ==========================================

    deleteUser(user: UserAdminResponse): void {

        const confirmed = confirm(
            `Voulez-vous vraiment supprimer ${user.firstName} ${user.lastName} ?`
        );

        if (!confirmed) {
            return;
        }

        this.adminService
            .deleteUser(user.id)
            .subscribe({

                next: () => {

                    this.users =
                        this.users.filter(
                            item => item.id !== user.id
                        );

                },

                error: (error) => {

                    console.error(
                        'Erreur suppression utilisateur :',
                        error
                    );

                }

            });
    }


    // ==========================================
    // AFFICHER LES ROLES
    // ==========================================

    getRoles(user: UserAdminResponse): string {

        if (
            !user.roles ||
            user.roles.length === 0
        ) {

            return 'USER';

        }

        return user.roles
            .map(
                role =>
                    role.replace(
                        'ROLE_',
                        ''
                    )
            )
            .join(', ');
    }


    // ==========================================
    // COULEUR DU ROLE
    // ==========================================

    getRoleBadgeColor(
        user: UserAdminResponse
    ): 'primary' | 'success' | 'warning' | 'error' {

        if (user.roles?.includes('ROLE_ADMIN')) {
            return 'error';
        }

        if (user.roles?.includes('ROLE_MANAGER')) {
            return 'warning';
        }

        return 'primary';
    }


    // ==========================================
    // RAFRAICHIR
    // ==========================================

    refresh(): void {

        this.loadUsers();

    }

}