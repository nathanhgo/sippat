import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CitizenListComponent } from './citizen-list.component';
import { CitizensService } from '../../../core/services/citizens.service';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CitizenListComponent', () => {
  let component: CitizenListComponent;
  let fixture: ComponentFixture<CitizenListComponent>;
  let citizensServiceMock: any;
  let router: Router;

  const mockCitizensList = {
    data: [
      { id: '1', fullName: 'John Doe', cpf: '12345678909', socialProfile: { nis: '12345678901', receivesBolsaFamilia: true } },
      { id: '2', fullName: 'Jane Doe', cpf: '98765432101', socialProfile: { nis: '98765432102', receivesBolsaFamilia: false } },
    ],
    total: 2,
  };

  beforeEach(async () => {
    citizensServiceMock = {
      findAll: vi.fn().mockReturnValue(of(mockCitizensList)),
      delete: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      imports: [
        CitizenListComponent,
        NoopAnimationsModule,
      ],
      providers: [
        provideRouter([]),
        { provide: CitizensService, useValue: citizensServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CitizenListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar cidadãos na inicialização', () => {
    expect(citizensServiceMock.findAll).toHaveBeenCalled();
    expect(component.citizens().length).toBe(2);
  });

  it('deve chamar findAll com termo de busca ao buscar', () => {
    vi.useFakeTimers();
    component.searchControl.setValue('Jane');
    vi.advanceTimersByTime(400);
    vi.useRealTimers();

    expect(citizensServiceMock.findAll).toHaveBeenCalledWith({
      search: 'Jane',
      neighborhood: '',
      educationLevel: '',
      isPcd: undefined,
      minIncome: undefined,
      maxIncome: undefined,
      page: 1,
      limit: 10
    });
  });

  it('deve chamar o service.delete ao deletar e recarregar a lista', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDelete('1');
    expect(citizensServiceMock.delete).toHaveBeenCalledWith('1');
    expect(citizensServiceMock.findAll).toHaveBeenCalledTimes(2); // Initial + reload
  });

  it('deve chamar findAll com filtros de busca avançada quando preenchidos', () => {
    component.neighborhoodControl.setValue('Centro');
    component.educationControl.setValue('Médio');
    component.pcdControl.setValue('true');
    component.minIncomeControl.setValue(100);
    component.maxIncomeControl.setValue(500);

    component.applyAdvancedFilters();

    expect(citizensServiceMock.findAll).toHaveBeenCalledWith({
      search: '',
      neighborhood: 'Centro',
      educationLevel: 'Médio',
      isPcd: true,
      minIncome: 100,
      maxIncome: 500,
      page: 1,
      limit: 10
    });
  });
});
