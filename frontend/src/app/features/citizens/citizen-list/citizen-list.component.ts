import { Component, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CitizensService } from '../../../core/services/citizens.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-citizen-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './citizen-list.component.html',
  styleUrls: ['./citizen-list.component.css']
})
export class CitizenListComponent implements OnInit {
  citizens = signal<any[]>([]);
  totalCitizens = signal(0);
  isLoading = signal(false);
  showAdvancedFilters = signal(false);
  
  searchControl = new FormControl('');
  neighborhoodControl = new FormControl('');
  educationControl = new FormControl('');
  pcdControl = new FormControl('');
  minIncomeControl = new FormControl<number | null>(null);
  maxIncomeControl = new FormControl<number | null>(null);

  currentPage = 1;
  pageSize = 10;
  
  displayedColumns: string[] = ['fullName', 'cpf', 'nis', 'bolsaFamilia', 'actions'];

  constructor(
    private readonly citizensService: CitizensService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadCitizens();

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadCitizens();
    });
  }

  loadCitizens() {
    this.isLoading.set(true);
    const search = this.searchControl.value || '';
    const neighborhood = this.neighborhoodControl.value || '';
    const educationLevel = this.educationControl.value || '';
    const pcdVal = this.pcdControl.value;
    const isPcd = pcdVal === 'true' ? true : pcdVal === 'false' ? false : undefined;
    const minIncome = this.minIncomeControl.value !== null ? Number(this.minIncomeControl.value) : undefined;
    const maxIncome = this.maxIncomeControl.value !== null ? Number(this.maxIncomeControl.value) : undefined;
    
    this.citizensService.findAll({
      search,
      neighborhood,
      educationLevel,
      isPcd,
      minIncome,
      maxIncome,
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.citizens.set(res.data || []);
        this.totalCitizens.set(res.total || 0);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  applyAdvancedFilters() {
    this.currentPage = 1;
    this.loadCitizens();
  }

  clearAdvancedFilters() {
    this.neighborhoodControl.setValue('');
    this.educationControl.setValue('');
    this.pcdControl.setValue('');
    this.minIncomeControl.setValue(null);
    this.maxIncomeControl.setValue(null);
    this.currentPage = 1;
    this.loadCitizens();
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCitizens();
  }

  onEdit(id: string) {
    this.router.navigate(['/citizens/edit', id]);
  }

  onDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir este cadastro? Esta ação não pode ser desfeita.')) {
      this.citizensService.delete(id).subscribe({
        next: () => {
          this.loadCitizens();
        }
      });
    }
  }
}
