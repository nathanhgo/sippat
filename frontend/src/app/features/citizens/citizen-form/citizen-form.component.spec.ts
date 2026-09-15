import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CitizenFormComponent } from './citizen-form.component';
import { CitizensService } from '../../../core/services/citizens.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CitizenFormComponent', () => {
  let component: CitizenFormComponent;
  let fixture: ComponentFixture<CitizenFormComponent>;
  let citizensServiceMock: any;
  let router: Router;

  beforeEach(async () => {
    citizensServiceMock = {
      create: vi.fn().mockReturnValue(of({ id: 'new-uuid' })),
      update: vi.fn().mockReturnValue(of({ id: 'existing-uuid' })),
      findOne: vi.fn().mockReturnValue(of({ 
        id: 'existing-uuid', 
        cpf: '52998224725', 
        fullName: 'Jane',
        socialProfile: { isPcd: true, disabilityCid: 'F84.0', socialPrograms: 'Bolsa Família' },
        professionalProfile: { priorityGroup: 'Fluxo Municipal da Mulher' }
      })),
    };

    await TestBed.configureTestingModule({
      imports: [
        CitizenFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideRouter([]),
        { provide: CitizensService, useValue: citizensServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: null }), // Creation mode
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CitizenFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar com formulário inválido devido a campos obrigatórios vazios', () => {
    expect(component.citizenForm.valid).toBe(false);
  });

  it('deve validar o CPF usando a regra de validação no frontend', () => {
    const cpfControl = component.citizenForm.get('cpf')!;
    
    // Teste CPF inválido
    cpfControl.setValue('11111111111');
    expect(cpfControl.valid).toBe(false);
    expect(cpfControl.errors?.['invalidCpf']).toBeTruthy();

    // Teste CPF válido
    cpfControl.setValue('52998224725');
    expect(cpfControl.valid).toBe(true);
  });

  it('deve permitir preencher indicadores socioeconômicos e perfil profissional da Fase 6', () => {
    component.citizenForm.patchValue({
      socialProfile: {
        isPcd: true,
        disabilityCid: 'F84.0',
        socialPrograms: 'Bolsa Família',
      },
      professionalProfile: {
        priorityGroup: 'Fluxo Municipal da Mulher',
        educationLevel: 'Médio completo',
      }
    });

    expect(component.citizenForm.get('socialProfile.isPcd')?.value).toBe(true);
    expect(component.citizenForm.get('socialProfile.disabilityCid')?.value).toBe('F84.0');
    expect(component.citizenForm.get('professionalProfile.priorityGroup')?.value).toBe('Fluxo Municipal da Mulher');
  });

  it('deve enviar dados válidos para o CitizensService.create e navegar de volta', () => {
    component.citizenForm.patchValue({
      cpf: '52998224725',
      fullName: 'Jane Doe',
      birthDate: '1990-01-01',
      gender: 'FEMININO',
      phone: '12999998888',
      neighborhood: 'Centro',
      socialProfile: {
        socialPrograms: 'Bolsa Família',
        isPcd: false,
      },
      professionalProfile: {
        priorityGroup: 'Fluxo Municipal da Mulher',
      }
    });

    component.onSubmit();

    expect(citizensServiceMock.create).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/citizens']);
  });
});
