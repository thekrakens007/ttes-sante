import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private http = inject(HttpClient);

    private readonly API_URL = '/api/user';



    /**
     * Récupérer le profil de l'utilisateur connecté
     */
    getMyProfile(): Observable<User> {

        return this.http.get<User>(
            `${this.API_URL}/me`
        );

    }
    updateProfile(data: {
        firstName: string;
        lastName: string;
        phone: string;
    }): Observable<User> {
        return this.http.put<User>(
            `${this.API_URL}/profile`,
            data
        );
    }

}