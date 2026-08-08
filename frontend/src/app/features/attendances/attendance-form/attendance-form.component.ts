import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CitizensService } from '../../../core/services/citizens.service';
import { AttendancesService } from '../../../core/services/attendances.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-attendance-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './attendance-form.component.html',
  styleUrls: ['./attendance-form.component.css']
})
export class AttendanceFormComponent implements OnInit {
  attendanceForm: FormGroup;
  cpfControl = new FormControl('');
  
  suggestedCitizen = signal<any | null>(null);
  selectedCitizenId = signal<string | null>(null);
  
  isSearchingCpf = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  serviceTypes = [
    { value: 'ENCAMINHAMENTO', label: 'Encaminhamento para Vaga' },
    { value: 'ORIENTACAO', label: 'Orientação Profissional' },
    { value: 'CADASTRO_VAGA', label: 'Cadastro em Vaga de Emprego' },
    { value: 'ATUALIZACAO_CADASTRAL', label: 'Atualização de Cadastro' },
    { value: 'EMISSAO_DOCUMENTO', label: 'Emissão de Carteira de Trabalho' },
    { value: 'OUTRO', label: 'Outro Atendimento' }
  ];

  genders = [
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMININO', label: 'Feminino' },
    { value: 'OUTRO', label: 'Outro' },
    { value: 'NAO_DECLARADO', label: 'Prefiro não declarar' }
  ];

  raceColors = [
    { value: 'BRANCA', label: 'Branca' },
    { value: 'PRETA', label: 'Preta' },
    { value: 'PARDA', label: 'Parda' },
    { value: 'AMARELA', label: 'Amarela' },
    { value: 'INDIGENA', label: 'Indígena' },
    { value: 'NAO_DECLARADO', label: 'Prefiro não declarar' }
  ];

  maritalStatuses = [
    { value: 'SOLTEIRO', label: 'Solteiro(a)' },
    { value: 'CASADO', label: 'Casado(a)' },
    { value: 'DIVORCIADO', label: 'Divorciado(a)' },
    { value: 'VIUVO', label: 'Viúvo(a)' },
    { value: 'UNIAO_ESTAVEL', label: 'União Estável' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly citizensService: CitizensService,
    private readonly attendancesService: AttendancesService,
    private readonly router: Router
  ) {
    this.attendanceForm = this.fb.group({
      fullName: ['', [Validators.required]],
      birthDate: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      raceColor: ['', [Validators.required]],
      maritalStatus: ['', [Validators.required]],
      serviceType: ['', [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Monitor CPF changes
    this.cpfControl.valueChanges.subscribe((val) => {
      const clean = (val || '').replace(/[^\d]/g, '');
      if (clean.length === 11) {
        this.searchCpf(clean);
      } else {
        this.suggestedCitizen.set(null);
      }
    });
  }

  searchCpf(cpf: string) {
    this.isSearchingCpf.set(true);
    this.citizensService.findAll({ search: cpf }).subscribe({
      next: (res) => {
        this.isSearchingCpf.set(false);
        if (res.data && res.data.length > 0) {
          this.suggestedCitizen.set(res.data[0]);
        } else {
          this.suggestedCitizen.set(null);
        }
      },
      error: () => {
        this.isSearchingCpf.set(false);
      }
    });
  }

  acceptSuggestion() {
    const citizen = this.suggestedCitizen();
    if (!citizen) return;

    this.selectedCitizenId.set(citizen.id);
    
    let formattedDate = '';
    if (citizen.birthDate) {
      formattedDate = new Date(citizen.birthDate).toISOString().substring(0, 10);
    }

    this.attendanceForm.patchValue({
      fullName: citizen.fullName,
      birthDate: formattedDate,
      gender: citizen.gender,
      raceColor: citizen.raceColor,
      maritalStatus: citizen.maritalStatus
    });

    this.suggestedCitizen.set(null);
  }

  rejectSuggestion() {
    this.suggestedCitizen.set(null);
    this.selectedCitizenId.set(null);
  }

  onSubmit() {
    if (this.attendanceForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { serviceType, notes, ...citizenData } = this.attendanceForm.value;
    const cpf = this.cpfControl.value || '';

    // Step 1: Save or update the Citizen
    const citizen$ = this.selectedCitizenId()
      ? this.citizensService.update(this.selectedCitizenId()!, { cpf, ...citizenData })
      : this.citizensService.create({ cpf, ...citizenData });

    citizen$.subscribe({
      next: (savedCitizen) => {
        const citizenId = savedCitizen.id || this.selectedCitizenId();
        
        // Step 2: Register the Attendance
        this.attendancesService.create({
          citizenId,
          serviceType,
          notes
        }).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.router.navigate(['/citizens']);
          },
          error: (err) => {
            this.isSubmitting.set(false);
            this.errorMessage.set(err.error?.message || 'Erro ao registrar o atendimento.');
          }
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Erro ao salvar os dados do cidadão.');
      }
    });
  }
}
