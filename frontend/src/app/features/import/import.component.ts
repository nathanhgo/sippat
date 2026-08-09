import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ImportService } from '../../core/services/import.service';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './import.component.html',
  styleUrl: './import.component.css'
})
export class ImportComponent {
  private readonly importService = inject(ImportService);
  private readonly router = inject(Router);

  selectedFile = signal<File | null>(null);
  isLoading = signal<boolean>(false);
  
  // States: 'select_file' | 'preview' | 'result'
  step = signal<'select_file' | 'preview' | 'result'>('select_file');

  // Preview Data
  previewData = signal<any | null>(null);
  
  // Selection strategy
  duplicateStrategy = signal<'overwrite_all' | 'ignore_all' | 'individual'>('ignore_all');
  
  // Individual decisions: { cpf: 'overwrite' | 'ignore' }
  individualDecisions: Record<string, 'overwrite' | 'ignore'> = {};

  // Final execution result
  executionResult = signal<any | null>(null);

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  uploadAndPreview(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoading.set(true);
    this.importService.upload(file).subscribe({
      next: (res) => {
        this.previewData.set(res);
        this.step.set('preview');
        this.isLoading.set(false);
        // Initialize individual decisions to ignore by default
        if (res.rows) {
          res.rows.forEach((row: any) => {
            if (row.status === 'duplicate') {
              this.individualDecisions[row.cpf] = 'ignore';
            }
          });
        }
      },
      error: (err) => {
        alert('Erro ao carregar e analisar a planilha. Verifique o formato.');
        this.isLoading.set(false);
      }
    });
  }

  setIndividualDecision(cpf: string, decision: 'overwrite' | 'ignore'): void {
    this.individualDecisions[cpf] = decision;
  }

  confirmImport(): void {
    const preview = this.previewData();
    if (!preview) return;

    this.isLoading.set(true);

    // Send only valid rows for execution (either 'new' or 'duplicate')
    const validCitizens = preview.rows
      .filter((row: any) => row.status === 'new' || row.status === 'duplicate')
      .map((row: any) => {
        const { status, existingId, errors, ...citizenData } = row;
        return citizenData;
      });

    const payload = {
      citizens: validCitizens,
      duplicateStrategy: this.duplicateStrategy(),
      decisions: this.duplicateStrategy() === 'individual' ? this.individualDecisions : undefined
    };

    this.importService.confirm(payload).subscribe({
      next: (res) => {
        this.executionResult.set(res);
        this.step.set('result');
        this.isLoading.set(false);
      },
      error: (err) => {
        alert('Erro ao realizar a importação dos cidadãos.');
        this.isLoading.set(false);
      }
    });
  }

  reset(): void {
    this.selectedFile.set(null);
    this.previewData.set(null);
    this.executionResult.set(null);
    this.duplicateStrategy.set('ignore_all');
    this.individualDecisions = {};
    this.step.set('select_file');
  }

  getDuplicateRows(): any[] {
    return this.previewData()?.rows.filter((r: any) => r.status === 'duplicate') || [];
  }

  getErrorRows(): any[] {
    return this.previewData()?.rows.filter((r: any) => r.status === 'error') || [];
  }
}
