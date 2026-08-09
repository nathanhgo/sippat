import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AttendancesService } from '../../../core/services/attendances.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CitizenDetailsModalComponent } from '../../../shared/components/citizen-details-modal/citizen-details-modal.component';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatDialogModule,
  ],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.css'
})
export class AttendanceListComponent implements OnInit {
  private readonly attendancesService = inject(AttendancesService);
  private readonly dialog = inject(MatDialog);

  viewCitizenDetails(id: string) {
    this.dialog.open(CitizenDetailsModalComponent, {
      data: { citizenId: id },
      width: '850px',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container'
    });
  }

  attendances = signal<any[]>([]);
  totalAttendances = signal<number>(0);
  isLoading = signal<boolean>(true);

  // Pagination
  page = 1;
  pageSize = 10;
  displayedColumns: string[] = ['createdAt', 'citizenName', 'citizenCpf', 'serviceType', 'userName', 'notes'];

  ngOnInit(): void {
    this.loadAttendances();
  }

  loadAttendances(): void {
    this.isLoading.set(true);
    this.attendancesService.findAll({ page: this.page, limit: this.pageSize }).subscribe({
      next: (res) => {
        this.attendances.set(res.data || []);
        this.totalAttendances.set(res.total || 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadAttendances();
  }
}
