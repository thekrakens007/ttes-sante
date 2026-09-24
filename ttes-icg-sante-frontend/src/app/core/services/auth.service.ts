import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private readonly API_URL = '/api/auth';

  private readonly TOKEN_KEY = 'ttes_icg_sante_token';

  constructor(
      private router: Router
  ) {}

  // =========================================================
  // GOOGLE LOGIN
  // =========================================================

  loginWithGoogle(idToken: string): Observable<any> {

    return this.http
        .post<any>(
            `${this.API_URL}/google`,
            {
              idToken: idToken
            }
        )
        .pipe(
            tap((response) => {

              if (response && response.token) {

                localStorage.setItem(
                    this.TOKEN_KEY,
                    response.token
                );

              }

            })
        );
  }

  // =========================================================
  // LOGIN
  // =========================================================

  login(
      email: string,
      password: string
  ): Observable<LoginResponse> {

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

              if (response?.token) {

                localStorage.setItem(
                    this.TOKEN_KEY,
                    response.token
                );

              }

            })
        );
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): void {

    localStorage.removeItem(
        this.TOKEN_KEY
    );

    this.router.navigate(['/']);
  }

  // =========================================================
  // REGISTER
  // =========================================================

  register(request: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }): Observable<MessageResponse> {

    return this.http.post<MessageResponse>(
        `${this.API_URL}/register`,
        request
    );
  }

  // =========================================================
  // VERIFY EMAIL
  // =========================================================

  verifyEmail(
      token: string
  ): Observable<MessageResponse> {

    return this.http.get<MessageResponse>(
        `${this.API_URL}/verify-email`,
        {
          params: {
            token
          }
        }
    );
  }

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  forgotPassword(
      email: string
  ): Observable<MessageResponse> {

    return this.http.post<MessageResponse>(
        `${this.API_URL}/forgot-password`,
        {
          email
        }
    );
  }

  // =========================================================
  // RESET PASSWORD
  // =========================================================

  resetPassword(
      token: string,
      newPassword: string
  ): Observable<MessageResponse> {

    return this.http.post<MessageResponse>(
        `${this.API_URL}/reset-password`,
        {
          token,
          newPassword
        }
    );
  }

  // =========================================================
  // GET TOKEN
  // =========================================================

  getToken(): string | null {

    return localStorage.getItem(
        this.TOKEN_KEY
    );
  }

  // =========================================================
  // DECODER JWT
  // =========================================================

  private decodeToken(): any | null {

    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {

      const parts = token.split('.');

      if (parts.length !== 3) {
        return null;
      }

      /*
       * Le payload JWT utilise du Base64URL.
       * On convertit donc - et _ avant le décodage.
       */
      const base64Payload = parts[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/');

      const payload = JSON.parse(
          atob(base64Payload)
      );

      return payload;

    } catch (error) {

      console.error(
          'Impossible de décoder le JWT',
          error
      );

      return null;
    }
  }

  // =========================================================
  // CHECK TOKEN EXPIRATION
  // =========================================================

  private isTokenExpired(): boolean {

    const payload = this.decodeToken();

    if (!payload) {
      return true;
    }

    /*
     * exp est exprimé en secondes Unix.
     * Date.now() est exprimé en millisecondes.
     */
    if (!payload.exp) {
      return true;
    }

    return (
        payload.exp * 1000 <= Date.now()
    );
  }

  // =========================================================
  // CHECK LOGIN
  // =========================================================

  isLoggedIn(): boolean {

    const token = this.getToken();

    if (!token) {
      return false;
    }

    /*
     * Token invalide ou expiré.
     */
    if (this.isTokenExpired()) {

      localStorage.removeItem(
          this.TOKEN_KEY
      );

      return false;
    }

    return true;
  }

  // =========================================================
  // GET USER ID
  // =========================================================

  getUserId(): number | null {

    if (!this.isLoggedIn()) {
      return null;
    }

    const payload = this.decodeToken();

    if (!payload) {
      return null;
    }

    return payload.userId ?? null;
  }

  // =========================================================
  // GET USER EMAIL
  // =========================================================

  getUserEmail(): string | null {

    if (!this.isLoggedIn()) {
      return null;
    }

    const payload = this.decodeToken();

    if (!payload) {
      return null;
    }

    return payload.sub ?? null;
  }

  // =========================================================
  // GET ROLES
  // =========================================================

  getRoles(): string[] {

    if (!this.isLoggedIn()) {
      return [];
    }

    const payload = this.decodeToken();

    if (!payload) {
      return [];
    }

    return payload.roles ?? [];
  }

  // =========================================================
  // CHECK ROLE
  // =========================================================

  hasRole(role: string): boolean {

    if (!this.isLoggedIn()) {
      return false;
    }

    return this.getRoles().includes(role);
  }

  // =========================================================
  // CHECK ADMIN
  // =========================================================

  isAdmin(): boolean {

    const token = this.getToken();

    if (!token) {
      return false;
    }

    const payload = this.decodeToken();

    if (!payload) {
      return false;
    }

    if (!payload.exp) {
      return false;
    }

    if (payload.exp * 1000 <= Date.now()) {

      localStorage.removeItem(
          this.TOKEN_KEY
      );

      return false;
    }

    const roles = payload.roles ?? [];

    return roles.includes('ROLE_ADMIN');
  }
}