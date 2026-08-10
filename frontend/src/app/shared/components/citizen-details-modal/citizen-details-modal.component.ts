import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CitizensService } from '../../../core/services/citizens.service';
import { AttendancesService } from '../../../core/services/attendances.service';
import { AttendanceDetailsModalComponent } from '../attendance-details-modal/attendance-details-modal.component';

@Component({
  selector: 'app-citizen-details-modal',
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
  templateUrl: './citizen-details-modal.component.html',
  styleUrls: ['./citizen-details-modal.component.css']
})
export class CitizenDetailsModalComponent implements OnInit {
  private readonly citizensService = inject(CitizensService);
  private readonly attendancesService = inject(AttendancesService);
  private readonly dialog = inject(MatDialog);
  
  citizen = signal<any>(null);
  attendances = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  constructor(
    public dialogRef: MatDialogRef<CitizenDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { citizenId: string }
  ) {}

  ngOnInit(): void {
    this.loadCitizenDetails();
  }

  loadCitizenDetails(): void {
    this.isLoading.set(true);
    this.citizensService.findOne(this.data.citizenId).subscribe({
      next: (citizenRes) => {
        this.citizen.set(citizenRes);
        
        // Load attendances history
        this.attendancesService.findByCitizen(this.data.citizenId).subscribe({
          next: (attendanceRes) => {
            this.attendances.set(attendanceRes || []);
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.dialogRef.close();
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  viewAttendanceDetails(attendance: any): void {
    this.dialog.open(AttendanceDetailsModalComponent, {
      width: '750px',
      maxWidth: '95vw',
      data: { attendanceData: attendance, attendanceId: attendance.id }
    });
  }

  formatCpf(cpf: string): string {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9)}`;
  }

  formatExperience(item: any): string {
    if (!item) return '';
    if (typeof item === 'string') {
      if (item === '[object Object]' || item.includes('[object Object]')) return '';
      return item;
    }
    if (typeof item === 'object') {
      const parts = [];
      if (item.cargo) parts.push(`Cargo: ${item.cargo}`);
      if (item.empresa) parts.push(`Empresa: ${item.empresa}`);
      if (item.duracao) parts.push(`Duração: ${item.duracao}`);
      return parts.length > 0 ? parts.join(' - ') : '';
    }
    return String(item);
  }

  getExperiences(prof: any): string[] {
    if (!prof || !prof.experiences) return [];
    let exp = prof.experiences;
    if (typeof exp === 'string') {
      if (exp.startsWith('[')) {
        try { exp = JSON.parse(exp); } catch (e) {}
      } else {
        return exp.split('\n').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    if (Array.isArray(exp)) {
      return exp.map((item: any) => this.formatExperience(item)).filter(Boolean);
    }
    return [this.formatExperience(exp)].filter(Boolean);
  }

  getCourses(prof: any): string[] {
    if (!prof || !prof.courses) return [];
    let c = prof.courses;
    if (typeof c === 'string') {
      return c.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(c)) {
      return c.map((s: any) => String(s)).filter(Boolean);
    }
    return [];
  }

  getTargetAreas(prof: any): string[] {
    if (!prof || !prof.targetAreas) return [];
    let a = prof.targetAreas;
    if (typeof a === 'string') {
      return a.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(a)) {
      return a.map((s: any) => String(s)).filter(Boolean);
    }
    return [];
  }
}
