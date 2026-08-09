import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ImportComponent } from './import.component';
import { ImportService } from '../../core/services/import.service';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('ImportComponent', () => {
  let component: ImportComponent;
  let fixture: ComponentFixture<ImportComponent>;
  let importServiceMock: any;
  let router: Router;

  beforeEach(async () => {
    importServiceMock = {
      upload: vi.fn(),
      confirm: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ImportComponent],
      providers: [
        { provide: ImportService, useValue: importServiceMock },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImportComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
    expect(component.step()).toBe('select_file');
  });

  it('deve selecionar arquivo com sucesso', () => {
    const file = new File(['test'], 'import.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const event = { target: { files: [file] } };
    
    component.onFileSelected(event);
    expect(component.selectedFile()).toEqual(file);
  });

  it('deve enviar arquivo e mostrar o preview', () => {
    const file = new File(['test'], 'import.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    component.selectedFile.set(file);

    const mockPreviewResponse = {
      rows: [
        { cpf: '52998224725', fullName: 'Test Citizen', status: 'new' },
        { cpf: '12345678909', fullName: 'Exist Citizen', status: 'duplicate' }
      ],
      summary: { total: 2, valid: 1, duplicates: 1, invalid: 0 }
    };

    importServiceMock.upload.mockReturnValue(of(mockPreviewResponse));

    component.uploadAndPreview();

    expect(importServiceMock.upload).toHaveBeenCalledWith(file);
    expect(component.previewData()).toEqual(mockPreviewResponse);
    expect(component.step()).toBe('preview');
    expect(component.individualDecisions['12345678909']).toBe('ignore');
  });

  it('deve confirmar importação e exibir o resultado', () => {
    const mockPreviewData = {
      rows: [
        { cpf: '52998224725', fullName: 'Test Citizen', status: 'new' },
        { cpf: '12345678909', fullName: 'Exist Citizen', status: 'duplicate' }
      ],
      summary: { total: 2, valid: 1, duplicates: 1, invalid: 0 }
    };

    component.previewData.set(mockPreviewData);
    component.step.set('preview');
    component.duplicateStrategy.set('overwrite_all');

    const mockExecutionResponse = {
      imported: 1,
      overwritten: 1,
      ignored: 0,
      errors: 0
    };

    importServiceMock.confirm.mockReturnValue(of(mockExecutionResponse));

    component.confirmImport();

    expect(importServiceMock.confirm).toHaveBeenCalledWith({
      citizens: [
        { cpf: '52998224725', fullName: 'Test Citizen' },
        { cpf: '12345678909', fullName: 'Exist Citizen' }
      ],
      duplicateStrategy: 'overwrite_all',
      decisions: undefined
    });

    expect(component.executionResult()).toEqual(mockExecutionResponse);
    expect(component.step()).toBe('result');
  });
});
