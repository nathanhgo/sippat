import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CitizensService } from '../../../core/services/citizens.service';
import { AttendancesService } from '../../../core/services/attendances.service';

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

  formatCpf(cpf: string): string {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9)}`;
  }
}
