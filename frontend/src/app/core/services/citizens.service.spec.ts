import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CitizensService } from './citizens.service';
import { environment } from '../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('CitizensService', () => {
  let service: CitizensService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CitizensService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CitizensService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado', () => {
    expect(service).toBeDefined();
  });

  it('deve fazer requisição GET para buscar cidadãos', () => {
    const mockResponse = { data: [], total: 0 };

    service.findAll({ search: 'Jane' }).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/citizens?search=Jane`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('deve fazer requisição POST para criar cidadão', () => {
    const mockCitizen = { fullName: 'Jane Doe' };
    const mockResponse = { id: 'uuid', fullName: 'Jane Doe' };

    service.create(mockCitizen).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/citizens`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockCitizen);
    req.flush(mockResponse);
  });
});
