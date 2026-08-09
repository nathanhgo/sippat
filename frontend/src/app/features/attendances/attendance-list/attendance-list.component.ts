import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AttendancesService } from '../../../core/services/attendances.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CitizenDetailsModalComponent } from '../../../shared/components/citizen-details-modal/citizen-details-modal.component';
import { AttendanceDetailsModalComponent } from '../../../shared/components/attendance-details-modal/attendance-details-modal.component';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
  ],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.css'
})
export class AttendanceListComponent implements OnInit {
  private readonly attendancesService = inject(AttendancesService);
  private readonly dialog = inject(MatDialog);

  attendances = signal<any[]>([]);
  totalAttendances = signal<number>(0);
  isLoading = signal<boolean>(true);
  showAdvancedFilters = signal<boolean>(false);

  // Search & filters
  searchControl = new FormControl('');
  serviceTypeControl = new FormControl('');
  attendantNameControl = new FormControl('');
  dateFromControl = new FormControl<Date | null>(null);
  dateToControl = new FormControl<Date | null>(null);

  readonly serviceTypeOptions = [
    { value: '', label: 'Todos' },
    { value: 'ENCAMINHAMENTO', label: 'Encaminhamento' },
    { value: 'ORIENTACAO', label: 'Orientação' },
    { value: 'CADASTRO_VAGA', label: 'Cadastro de Vaga' },
    { value: 'ATUALIZACAO_CADASTRAL', label: 'Atualização Cadastral' },
    { value: 'EMISSAO_DOCUMENTO', label: 'Emissão de Documento' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  // Pagination
  page = 1;
  pageSize = 10;
  displayedColumns: string[] = ['id', 'createdAt', 'citizenName', 'serviceType', 'userName', 'notes', 'actions'];

  ngOnInit(): void {
    this.loadAttendances();

    // Real-time search on citizen name
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.loadAttendances();
    });
  }

  loadAttendances(): void {
    this.isLoading.set(true);
    const citizenName = this.searchControl.value || '';
    const serviceType = this.serviceTypeControl.value || '';
    const attendantName = this.attendantNameControl.value || '';
    const dateFrom = this.dateFromControl.value
      ? this.formatDateForApi(this.dateFromControl.value)
      : '';
    const dateTo = this.dateToControl.value
      ? this.formatDateForApi(this.dateToControl.value)
      : '';

    this.attendancesService.findAll({
      page: this.page,
      limit: this.pageSize,
      ...(citizenName && { citizenName }),
      ...(serviceType && { serviceType }),
      ...(attendantName && { attendantName }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    }).subscribe({
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

  private formatDateForApi(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  applyAdvancedFilters(): void {
    this.page = 1;
    this.loadAttendances();
  }

  clearAdvancedFilters(): void {
    this.serviceTypeControl.setValue('');
    this.attendantNameControl.setValue('');
    this.dateFromControl.setValue(null);
    this.dateToControl.setValue(null);
    this.page = 1;
    this.loadAttendances();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadAttendances();
  }

  viewCitizenDetails(id: string): void {
    this.dialog.open(CitizenDetailsModalComponent, {
      data: { citizenId: id },
      width: '850px',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container'
    });
  }

  viewAttendanceDetails(element: any): void {
    this.dialog.open(AttendanceDetailsModalComponent, {
      data: { attendanceData: element, attendanceId: element.id },
      width: '750px',
      maxWidth: '95vw'
    });
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.serviceTypeControl.value ||
      this.attendantNameControl.value ||
      this.dateFromControl.value ||
      this.dateToControl.value
    );
  }

  getServiceTypeLabel(value: string | null): string {
    return this.serviceTypeOptions.find(o => o.value === value)?.label ?? value ?? '';
  }
}
