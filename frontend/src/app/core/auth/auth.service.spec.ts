import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  // Mock token payload: { sub: '123', email: 'user@test.com', role: 'ATTENDANT', exp: Date.now() / 1000 + 3600 }
  // Header: {} (empty base64 is e30)
  // Payload base64 for { "sub": "123", "email": "user@test.com", "role": "ATTENDANT" } is:
  // eyJzdWIiOiIxMjMiLCJlbWFpbCI6InVzZXJAdGVzdC5jb20iLCJyb2xlIjoiQVRURU5EQU5UIn0
  const mockToken = 'e30.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InVzZXJAdGVzdC5jb20iLCJyb2xlIjoiQVRURU5EQU5UIn0.signature';

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { for (const k in store) delete store[k]; })
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('deve ser criado', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('deve fazer requisição POST para /auth/login, armazenar o token e atualizar o currentUser', () => {
      const email = 'user@test.com';
      const password = 'password123';

      service.login({ email, password }).subscribe((response) => {
        expect(response.access_token).toBe(mockToken);
        expect(localStorage.setItem).toHaveBeenCalledWith('access_token', mockToken);
        expect(service.currentUser()).toEqual({
          sub: '123',
          email: 'user@test.com',
          role: 'ATTENDANT',
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });
      
      req.flush({ access_token: mockToken });
    });
  });

  describe('logout', () => {
    it('deve remover o token do localStorage e limpar o currentUser', () => {
      // Injetar token simulado no estado inicial
      localStorage.setItem('access_token', mockToken);
      service.loadUserFromToken(); // Função para ler o token do storage e carregar no signal
      
      expect(service.currentUser()).toBeDefined();

      service.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('deve retornar true se houver token e false caso contrário', () => {
      expect(service.isAuthenticated()).toBe(false);

      localStorage.setItem('access_token', mockToken);
      service.loadUserFromToken();

      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('register', () => {
    it('deve fazer requisição POST para /auth/register e retornar o usuário criado', () => {
      const mockUser = { name: 'Jane Doe', email: 'jane@example.com', password: 'password123', role: 'ATTENDANT' };
      const mockResponse = { id: 'user-uuid', name: 'Jane Doe', email: 'jane@example.com' };

      service.register(mockUser).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockUser);
      
      req.flush(mockResponse);
    });
  });
});
