import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

import { BadgeComponent } from '../../ui/badge/badge.component';

import { AdminService } from '../../../../core/services/admin.service';
import { UserAdminResponse } from '../../../../core/interfaces/user-admin-response.interface';
import { RoleResponse } from '../../../../core/interfaces/role-response.interface';

import { RouterModule } from '@angular/router';

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

    roles: RoleResponse[] = [];

    loading = false;

    loadingRoles = false;

    errorMessage = '';

    ngOnInit(): void {

        this.loadUsers();

        this.loadRoles();
    }

    /**
     * Charger les utilisateurs
     */
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

    /**
     * Charger les rôles disponibles
     */
    loadRoles(): void {

        this.loadingRoles = true;

        this.adminService.getRoles().subscribe({

            next: (roles) => {

                this.roles = roles;

                this.loadingRoles = false;

                console.log(
                    'Rôles chargés :',
                    roles
                );
            },

            error: (error) => {

                console.error(
                    'Erreur chargement rôles :',
                    error
                );

                this.loadingRoles = false;

                this.errorMessage =
                    'Impossible de charger les rôles.';
            }
        });
    }

    /**
     * Modifier le rôle d'un utilisateur
     */
    changeRole(
        user: UserAdminResponse,
        roleId: number
    ): void {

        const request = {

            firstName: user.firstName,

            lastName: user.lastName,

            email: user.email,

            phone: user.phone,

            enabled: user.enabled,

            roleIds: [roleId]
        };

        this.adminService
            .updateUser(user.id, request)
            .subscribe({

                next: (updatedUser) => {

                    user.roles = updatedUser.roles;

                    user.roleIds = updatedUser.roleIds;

                    console.log(
                        'Rôle modifié :',
                        updatedUser
                    );
                },

                error: (error) => {

                    console.error(
                        'Erreur modification rôle :',
                        error
                    );

                    this.errorMessage =
                        error?.error?.message ??
                        'Impossible de modifier le rôle.';
                }
            });
    }

    /**
     * Modifier le statut
     */
    toggleStatus(
        user: UserAdminResponse
    ): void {

        const newStatus = !user.enabled;

        this.adminService
            .updateUserStatus(
                user.id,
                newStatus
            )
            .subscribe({

                next: (updatedUser) => {

                    user.enabled =
                        updatedUser.enabled;
                },

                error: (error) => {

                    console.error(
                        'Erreur modification statut :',
                        error
                    );
                }
            });
    }

    /**
     * Supprimer un utilisateur
     */
    deleteUser(
        user: UserAdminResponse
    ): void {

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

    /**
     * Affichage des rôles
     */
    getRoles(
        user: UserAdminResponse
    ): string {

        if (
            !user.roles ||
            user.roles.length === 0
        ) {
            return 'USER';
        }

        return user.roles
            .map(role =>
                role.replace('ROLE_', '')
            )
            .join(', ');
    }

    /**
     * Couleur du badge
     */
    getRoleBadgeColor(
        user: UserAdminResponse
    ): 'primary' | 'success' | 'warning' | 'error' {

        if (
            user.roles?.includes('ROLE_ADMIN')
        ) {
            return 'error';
        }

        if (
            user.roles?.includes('ROLE_MANAGER')
        ) {
            return 'warning';
        }

        return 'primary';
    }

    /**
     * Rafraîchir
     */
    refresh(): void {

        this.loadUsers();

        this.loadRoles();
    }
}