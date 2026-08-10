import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="p-6 max-w-md bg-white rounded-xl shadow-xl border border-slate-100">
      <div class="flex items-center gap-4 mb-4">
        <div class="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
          <mat-icon class="scale-110">warning</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-800 leading-snug">{{ data.title }}</h2>
          <p class="text-xs text-slate-500 mt-0.5">Confirmação de Ação</p>
        </div>
      </div>

      <p class="text-sm text-slate-600 mb-6 leading-relaxed">
        {{ data.message }}
      </p>

      <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <button mat-stroked-button type="button" [mat-dialog-close]="false" class="text-slate-600">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button mat-flat-button type="button" color="warn" [mat-dialog-close]="true">
          {{ data.confirmText || 'Confirmar Exclusão' }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
