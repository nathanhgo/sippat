import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/auth/auth.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: any;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = {
      register: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar com formulário inválido', () => {
    expect(component.registerForm.valid).toBe(false);
  });

  it('deve chamar o AuthService.register e navegar para login em caso de sucesso', () => {
    authServiceMock.register.mockReturnValue(of({ id: 'user-uuid' }));
    
    component.registerForm.get('name')!.setValue('Jane Doe');
    component.registerForm.get('email')!.setValue('jane@test.com');
    component.registerForm.get('password')!.setValue('password123');
    component.registerForm.get('role')!.setValue('ATTENDANT');
    
    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@test.com',
      password: 'password123',
      role: 'ATTENDANT',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('deve exibir mensagem de erro em caso de falha no registro', () => {
    authServiceMock.register.mockReturnValue(throwError(() => ({ error: { message: 'E-mail já cadastrado' } })));
    
    component.registerForm.get('name')!.setValue('Jane Doe');
    component.registerForm.get('email')!.setValue('jane@test.com');
    component.registerForm.get('password')!.setValue('password123');
    component.registerForm.get('role')!.setValue('ATTENDANT');
    
    component.onSubmit();

    expect(component.errorMessage()).toBe('E-mail já cadastrado');
  });
});
