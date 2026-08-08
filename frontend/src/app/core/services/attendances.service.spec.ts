import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AttendancesService } from './attendances.service';
import { environment } from '../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('AttendancesService', () => {
  let service: AttendancesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AttendancesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AttendancesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado', () => {
    expect(service).toBeDefined();
  });

  it('deve fazer POST para criar atendimento', () => {
    const mockAtt = { citizenId: 'citizen-uuid', serviceType: 'ORIENTACAO', notes: 'obs' };
    const mockResponse = { id: 'att-uuid', ...mockAtt };

    service.create(mockAtt).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/attendances`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('deve fazer GET para obter historico por cidadão', () => {
    const citizenId = 'citizen-uuid';
    const mockList = [{ id: '1', citizenId, serviceType: 'ORIENTACAO' }];

    service.findByCitizen(citizenId).subscribe((res) => {
      expect(res).toEqual(mockList);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/attendances/citizen/${citizenId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockList);
  });
});
