import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

function decodeToken(token: string): any {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<any | null>(null);

  constructor(private readonly http: HttpClient) {
    this.loadUserFromToken();
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        if (response && response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          this.loadUserFromToken();
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  register(user: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, user);
  }

  loadUserFromToken() {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        this.currentUser.set({
          sub: decoded.sub,
          email: decoded.email,
          role: decoded.role,
        });
        return;
      }
    }
    this.currentUser.set(null);
  }
}
