import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ImportService } from './import.service';
import { environment } from '../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('ImportService', () => {
  let service: ImportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ImportService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(ImportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('deve enviar um POST multipart com o arquivo', () => {
      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      service.upload(mockFile).subscribe((res) => {
        expect(res).toEqual({ success: true });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/import/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ success: true });
    });
  });

  describe('confirm', () => {
    it('deve enviar um POST com dados de confirmação', () => {
      const payload = {
        citizens: [],
        duplicateStrategy: 'ignore_all' as const,
      };

      service.confirm(payload).subscribe((res) => {
        expect(res).toEqual({ imported: 5 });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/import/confirm`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ imported: 5 });
    });
  });
});
