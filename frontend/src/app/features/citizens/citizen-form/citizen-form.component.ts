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

  formatExperienceItem(exp: any): string {
    if (!exp) return '';
    if (typeof exp === 'string') return exp;
    if (typeof exp === 'object') {
      const parts = [];
      if (exp.cargo) parts.push(`Cargo: ${exp.cargo}`);
      if (exp.empresa) parts.push(`Empresa: ${exp.empresa}`);
      if (exp.duracao) parts.push(`Duração: ${exp.duracao}`);
      return parts.length > 0 ? parts.join(' - ') : JSON.stringify(exp);
    }
    return String(exp);
  }

  loadCitizen() {
    if (!this.citizenId) return;
    this.isLoading.set(true);
    this.citizensService.findOne(this.citizenId).subscribe({
      next: (data) => {
        this.isLoading.set(false);
        if (data.birthDate) {
          try {
            const dateObj = new Date(data.birthDate);
            if (!isNaN(dateObj.getTime())) {
              data.birthDate = dateObj.toISOString().substring(0, 10);
            }
          } catch (e) {
            // Keep original if parsing fails
          }
        }

        // Format professional profile arrays/objects to strings for form inputs
        if (data.professionalProfile) {
          const prof = data.professionalProfile;
          let expString = '';
          if (Array.isArray(prof.experiences)) {
            expString = prof.experiences.map((e: any) => this.formatExperienceItem(e)).join('\n');
          } else if (typeof prof.experiences === 'object' && prof.experiences !== null) {
            expString = this.formatExperienceItem(prof.experiences);
          } else {
            expString = prof.experiences || '';
          }

          data.professionalProfile = {
            educationLevel: prof.educationLevel || '',
            courses: Array.isArray(prof.courses) ? prof.courses.join(', ') : (prof.courses || ''),
            experiences: expString,
            targetAreas: Array.isArray(prof.targetAreas) ? prof.targetAreas.join(', ') : (prof.targetAreas || '')
          };
        }

        if (!data.socialProfile) {
          data.socialProfile = {
            nis: '',
            perCapitaIncome: null,
            housingStatus: null,
            familyMembersCount: null,
            receivesBolsaFamilia: false,
            receivesBpc: false,
            isPcd: false,
            pcdDescription: ''
          };
        }

        this.citizenForm.patchValue(data);
        const cpfControl = this.citizenForm.get('cpf');
        if (this.citizenId && cpfControl) {
          cpfControl.clearValidators();
          cpfControl.setErrors(null);
          cpfControl.disable();
        }
        this.citizenForm.updateValueAndValidity();
        this.citizenForm.markAsPristine();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Erro ao carregar os dados do cidadão.');
      }
    });
  }

  onSubmit() {
    if (this.citizenForm.invalid) {
      this.citizenForm.markAllAsTouched();
      this.errorMessage.set('Existem campos obrigatórios ou inválidos no formulário. Por favor, revise os dados das abas.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const rawValue = this.citizenForm.getRawValue();

    // Format professional profile strings back to arrays for backend DTO
    if (rawValue.professionalProfile) {
      const prof = rawValue.professionalProfile;
      rawValue.professionalProfile = {
        educationLevel: prof.educationLevel || undefined,
        courses: typeof prof.courses === 'string' && prof.courses.trim() 
          ? prof.courses.split(',').map((s: string) => s.trim()).filter(Boolean) 
          : [],
        experiences: prof.experiences || undefined,
        targetAreas: typeof prof.targetAreas === 'string' && prof.targetAreas.trim() 
          ? prof.targetAreas.split(',').map((s: string) => s.trim()).filter(Boolean) 
          : []
      };
    }

    const request$ = this.citizenId
      ? this.citizensService.update(this.citizenId, rawValue)
      : this.citizensService.create(rawValue);

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
