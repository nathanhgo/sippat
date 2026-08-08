import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AttendanceFormComponent } from './attendance-form.component';
import { CitizensService } from '../../../core/services/citizens.service';
import { AttendancesService } from '../../../core/services/attendances.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AttendanceFormComponent', () => {
  let component: AttendanceFormComponent;
  let fixture: ComponentFixture<AttendanceFormComponent>;
  let citizensServiceMock: any;
  let attendancesServiceMock: any;
  let router: Router;

  const mockCitizen = {
    id: 'citizen-uuid',
    cpf: '12345678909',
    fullName: 'John Doe',
    birthDate: '1990-01-01',
    gender: 'MASCULINO',
    raceColor: 'BRANCA',
    maritalStatus: 'SOLTEIRO',
  };

  beforeEach(async () => {
    citizensServiceMock = {
      findAll: vi.fn(),
      update: vi.fn().mockReturnValue(of({ id: 'citizen-uuid' })),
      create: vi.fn().mockReturnValue(of({ id: 'citizen-uuid' })),
    };
    attendancesServiceMock = {
      create: vi.fn().mockReturnValue(of({ id: 'attendance-uuid' })),
    };

    await TestBed.configureTestingModule({
      imports: [
        AttendanceFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideRouter([]),
        { provide: CitizensService, useValue: citizensServiceMock },
        { provide: AttendancesService, useValue: attendancesServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve buscar cidadão ao digitar CPF válido e sugerir perfil existente', () => {
    citizensServiceMock.findAll.mockReturnValue(of({ data: [mockCitizen], total: 1 }));

    component.cpfControl.setValue('12345678909');
    fixture.detectChanges();

    expect(citizensServiceMock.findAll).toHaveBeenCalledWith({ search: '12345678909' });
    expect(component.suggestedCitizen()).toEqual(mockCitizen);
  });

  it('deve carregar dados no formulário ao aceitar sugestão', () => {
    component.suggestedCitizen.set(mockCitizen);
    component.acceptSuggestion();

    expect(component.selectedCitizenId()).toBe('citizen-uuid');
    expect(component.attendanceForm.get('fullName')?.value).toBe('John Doe');
  });

  it('deve registrar atendimento com sucesso chamando service.create', () => {
    component.selectedCitizenId.set('citizen-uuid');
    component.attendanceForm.patchValue({
      fullName: 'John Doe',
      birthDate: '1990-01-01',
      gender: 'MASCULINO',
      raceColor: 'BRANCA',
      maritalStatus: 'SOLTEIRO',
      serviceType: 'ORIENTACAO',
      notes: 'alguma nota',
    });

    component.onSubmit();

    expect(attendancesServiceMock.create).toHaveBeenCalledWith({
      citizenId: 'citizen-uuid',
      serviceType: 'ORIENTACAO',
      notes: 'alguma nota',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/citizens']);
  });
});
