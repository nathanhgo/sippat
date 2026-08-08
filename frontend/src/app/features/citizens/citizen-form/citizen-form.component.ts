import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CitizensService } from '../../../core/services/citizens.service';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-citizen-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './citizen-form.component.html',
  styleUrls: ['./citizen-form.component.css']
})
export class CitizenFormComponent implements OnInit {
  citizenForm: FormGroup;
  citizenId: string | null = null;
  isLoading = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  genders = [
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMININO', label: 'Feminino' },
    { value: 'OUTRO', label: 'Outro' },
    { value: 'NAO_DECLARADO', label: 'Prefiro não declarar' },
  ];

  raceColors = [
    { value: 'BRANCA', label: 'Branca' },
    { value: 'PRETA', label: 'Preta' },
    { value: 'PARDA', label: 'Parda' },
    { value: 'AMARELA', label: 'Amarela' },
    { value: 'INDIGENA', label: 'Indígena' },
    { value: 'NAO_DECLARADO', label: 'Prefiro não declarar' },
  ];

  maritalStatuses = [
    { value: 'SOLTEIRO', label: 'Solteiro(a)' },
    { value: 'CASADO', label: 'Casado(a)' },
    { value: 'DIVORCIADO', label: 'Divorciado(a)' },
    { value: 'VIUVO', label: 'Viúvo(a)' },
    { value: 'UNIAO_ESTAVEL', label: 'União Estável' },
  ];

  housingStatuses = [
    { value: 'OWN', label: 'Própria' },
    { value: 'RENTED', label: 'Alugada' },
    { value: 'RISK_AREA', label: 'Área de Risco' },
    { value: 'UNHOUSED', label: 'Sem Moradia / Situação de Rua' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly citizensService: CitizensService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.citizenForm = this.fb.group({
      cpf: ['', [Validators.required, CustomValidators.cpf()]],
      rg: [''],
      fullName: ['', [Validators.required]],
      birthDate: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      raceColor: ['', [Validators.required]],
      maritalStatus: ['', [Validators.required]],
      phone: [''],
      email: ['', [Validators.email]],
      addressStreet: [''],
      addressNumber: [''],
      neighborhood: [''],
      zipCode: ['', [CustomValidators.cep()]],
      socialProfile: this.fb.group({
        nis: ['', [CustomValidators.nis()]],
        perCapitaIncome: [null],
        housingStatus: [null],
        familyMembersCount: [null],
        receivesBolsaFamilia: [false],
        receivesBpc: [false],
        isPcd: [false],
        pcdDescription: ['']
      }),
      professionalProfile: this.fb.group({
        educationLevel: [''],
        courses: [''],
        experiences: [''],
        targetAreas: ['']
      })
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.citizenId = params['id'];
        this.loadCitizen();
      }
    });
  }

  loadCitizen() {
    if (!this.citizenId) return;
    this.isLoading.set(true);
    this.citizensService.findOne(this.citizenId).subscribe({
      next: (data) => {
        this.isLoading.set(false);
        if (data.birthDate) {
          data.birthDate = new Date(data.birthDate).toISOString().substring(0, 10);
        }
        this.citizenForm.patchValue(data);
        this.citizenForm.get('cpf')?.disable();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Erro ao carregar os dados do cidadão.');
      }
    });
  }

  onSubmit() {
    if (this.citizenForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = this.citizenForm.getRawValue();

    const request$ = this.citizenId
      ? this.citizensService.update(this.citizenId, payload)
      : this.citizensService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/citizens']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Erro ao salvar os dados.');
      }
    });
  }
}
