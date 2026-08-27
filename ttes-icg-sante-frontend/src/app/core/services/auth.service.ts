import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {Router} from "@angular/router";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private readonly API_URL = 'http://10.141.71.113:8080/api/auth';

  //private readonly API_URL = 'http://localhost:8080/api/auth';

  private readonly TOKEN_KEY = 'ttes_icg_sante_token';

  constructor(
      private router: Router
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {

    const request: LoginRequest = {
      email,
      password
    };

    return this.http
        .post<LoginResponse>(
            `${this.API_URL}/login`,
            request
        )
        .pipe(
            tap(response => {

              if (response.token) {
                localStorage.setItem(
                    this.TOKEN_KEY,
                    response.token
                );
              }

            })
        );
  }

  logout(): void {

    localStorage.removeItem(
        this.TOKEN_KEY
    );
    this.router.navigate(['/']);
  }
  register(request: {
    firstName: string;
    lastName: string;
    email: string;
    phone:string;
    password: string;
  }) {
    return this.http.post<LoginResponse>(
        `${this.API_URL}/register`,
        request
    ).pipe(
        tap(response => {

          if (response.token) {
            localStorage.setItem(
                this.TOKEN_KEY,
                response.token
            );
          }

        })
    );
  }

  getToken(): string | null {

    return localStorage.getItem(
        this.TOKEN_KEY
    );

  }
  getUserId(): number | null {

    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {

      const payload = JSON.parse(
          atob(token.split('.')[1])
      );

      return payload.userId ?? null;

    } catch (error) {

      console.error(
          'Impossible de lire le userId du JWT',
          error
      );

      return null;
    }
  }
  isLoggedIn(): boolean {
    return !!this.getToken();

  }

  getUserEmail(): string | null {

    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {

      const payload = JSON.parse(
          atob(token.split('.')[1])
      );

      return payload.sub ?? null;

    } catch (error) {

      console.error(
          'Impossible de lire le JWT',
          error
      );

      return null;
    }
  }


  getRoles(): string[] {

    const token = this.getToken();

    if (!token) {
      return [];
    }

    try {

      const payload = JSON.parse(
          atob(token.split('.')[1])
      );

      return payload.roles ?? [];

    } catch (error) {

      console.error(
          'Impossible de lire les rôles du JWT',
          error
      );

      return [];
    }
  }


  hasRole(role: string): boolean {

    return this.getRoles().includes(role);

  }


  isAdmin(): boolean {

    return this.hasRole('ROLE_ADMIN');

  }

}