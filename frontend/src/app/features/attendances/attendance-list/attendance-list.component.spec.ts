import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AttendanceListComponent } from './attendance-list.component';
import { AttendancesService } from '../../../core/services/attendances.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('AttendanceListComponent', () => {
  let component: AttendanceListComponent;
  let fixture: ComponentFixture<AttendanceListComponent>;
  let attendancesServiceMock: any;

  beforeEach(async () => {
    attendancesServiceMock = {
      findAll: vi.fn().mockReturnValue(of({ data: [], total: 0 })),
    };

    await TestBed.configureTestingModule({
      imports: [AttendanceListComponent],
      providers: [
        { provide: AttendancesService, useValue: attendancesServiceMock },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar atendimentos na inicialização', () => {
    const mockResponse = {
      data: [
        { id: '1', serviceType: 'ORIENTACAO', citizen: { fullName: 'Maria' }, user: { name: 'João' } }
      ],
      total: 1
    };

    attendancesServiceMock.findAll.mockReturnValue(of(mockResponse));
    component.loadAttendances();

    expect(attendancesServiceMock.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(component.attendances()).toEqual(mockResponse.data);
    expect(component.totalAttendances()).toBe(1);
  });
});
