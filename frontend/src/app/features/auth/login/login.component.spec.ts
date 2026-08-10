import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar com formulário inválido', () => {
    expect(component.loginForm.valid).toBe(false);
  });

  it('deve validar e-mail no formato incorreto', () => {
    const emailControl = component.loginForm.get('email')!;
    emailControl.setValue('invalid-email');
    expect(emailControl.valid).toBe(false);
    expect(emailControl.errors?.['email']).toBeTruthy();
  });

  it('deve chamar o AuthService.login e navegar para home em caso de sucesso', () => {
    authServiceMock.login.mockReturnValue(of({ access_token: 'token' }));
    
    component.loginForm.get('email')!.setValue('user@test.com');
    component.loginForm.get('password')!.setValue('password123');
    
    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'password123',
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/citizens']);
  });

  it('deve exibir mensagem de erro em caso de credenciais inválidas', () => {
    authServiceMock.login.mockReturnValue(throwError(() => ({ error: { message: 'Credenciais inválidas' } })));
    
    component.loginForm.get('email')!.setValue('wrong@test.com');
    component.loginForm.get('password')!.setValue('wrongpassword');
    
    component.onSubmit();

    expect(component.errorMessage()).toBe('Credenciais inválidas');
  });
});
