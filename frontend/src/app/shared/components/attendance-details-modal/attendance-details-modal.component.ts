import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttendancesService } from '../../../core/services/attendances.service';
import { CitizenDetailsModalComponent } from '../citizen-details-modal/citizen-details-modal.component';

@Component({
  selector: 'app-attendance-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './attendance-details-modal.component.html',
  styleUrls: ['./attendance-details-modal.component.css']
})
export class AttendanceDetailsModalComponent implements OnInit {
  private readonly attendancesService = inject(AttendancesService);
  private readonly dialog = inject(MatDialog);

  attendance = signal<any>(null);
  isLoading = signal<boolean>(true);

  constructor(
    public dialogRef: MatDialogRef<AttendanceDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { attendanceId?: string; attendanceData?: any }
  ) {}

  ngOnInit(): void {
    if (this.data.attendanceData) {
      this.attendance.set(this.data.attendanceData);
      this.isLoading.set(false);
    } else if (this.data.attendanceId) {
      this.loadAttendanceDetails(this.data.attendanceId);
    }
  }

  loadAttendanceDetails(id: string): void {
    this.isLoading.set(true);
    this.attendancesService.findAll({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        const found = (res.data || []).find((item: any) => item.id === id);
        if (found) {
          this.attendance.set(found);
        } else {
          this.attendance.set(this.data.attendanceData || null);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openCitizenDetails(citizenId: string): void {
    if (!citizenId) return;
    this.dialog.open(CitizenDetailsModalComponent, {
      width: '850px',
      maxWidth: '95vw',
      data: { citizenId }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  formatCpf(cpf: string): string {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9)}`;
  }
}
