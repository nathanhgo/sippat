import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';
import { Gender, RaceColor, MaritalStatus, HousingStatus } from '@prisma/client';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a87b92f7c001db222f9872ea5a176865';

function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  private validateCpf(value: string): boolean {
    if (typeof value !== 'string') return false;
    const cpf = value.replace(/[^\d]+/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  private validateNis(value: string): boolean {
    if (!value) return true; // Optional field
    if (typeof value !== 'string') return false;
    const nis = value.replace(/[^\d]+/g, '');
    if (nis.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(nis)) return false;

    const multipliers = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(nis.charAt(i)) * multipliers[i];
    }

    let remainder = sum % 11;
    let digit = 11 - remainder;
    if (digit === 10 || digit === 11) digit = 0;

    return digit === parseInt(nis.charAt(10));
  }

  private normalizeGender(val: string): Gender | null {
    if (!val) return null;
    const clean = val.toString().trim().toUpperCase();
    if (clean === 'MASCULINO' || clean === 'M') return Gender.MASCULINO;
    if (clean === 'FEMININO' || clean === 'F') return Gender.FEMININO;
    if (clean === 'OUTRO' || clean === 'O') return Gender.OUTRO;
    if (clean === 'NAO_DECLARADO' || clean === 'NÃO DECLARADO' || clean === 'N') return Gender.NAO_DECLARADO;
    return null;
  }

  private normalizeRaceColor(val: string): RaceColor | null {
    if (!val) return null;
    const clean = val.toString().trim().toUpperCase();
    if (clean === 'BRANCA' || clean === 'BRANCO') return RaceColor.BRANCA;
    if (clean === 'PRETA' || clean === 'PRETO') return RaceColor.PRETA;
    if (clean === 'PARDA' || clean === 'PARDO') return RaceColor.PARDA;
    if (clean === 'AMARELA' || clean === 'AMARELO') return RaceColor.AMARELA;
    if (clean === 'INDIGENA' || clean === 'INDÍGENA') return RaceColor.INDIGENA;
    if (clean === 'NAO_DECLARADO' || clean === 'NÃO DECLARADO' || clean === 'N') return RaceColor.NAO_DECLARADO;
    return null;
  }

  private normalizeMaritalStatus(val: string): MaritalStatus | null {
    if (!val) return null;
    const clean = val.toString().trim().toUpperCase().replace('_', ' ');
    if (clean === 'SOLTEIRO' || clean === 'SOLTEIRA') return MaritalStatus.SOLTEIRO;
    if (clean === 'CASADO' || clean === 'CASADA') return MaritalStatus.CASADO;
    if (clean === 'DIVORCIADO' || clean === 'DIVORCIADA') return MaritalStatus.DIVORCIADO;
    if (clean === 'VIUVO' || clean === 'VIÚVO' || clean === 'VIÚVA') return MaritalStatus.VIUVO;
    if (clean === 'UNIAO ESTAVEL' || clean === 'UNIÃO ESTÁVEL') return MaritalStatus.UNIAO_ESTAVEL;
    return null;
  }

  private normalizeHousingStatus(val: string): HousingStatus | null {
    if (!val) return null;
    const clean = val.toString().trim().toUpperCase();
    if (clean === 'PROPRIA' || clean === 'PRÓPRIA' || clean === 'OWN') return HousingStatus.OWN;
    if (clean === 'ALUGADA' || clean === 'RENTED') return HousingStatus.RENTED;
    if (clean === 'AREA DE RISCO' || clean === 'ÁREA DE RISCO' || clean === 'RISK_AREA') return HousingStatus.RISK_AREA;
    if (clean === 'SITUACAO DE RUA' || clean === 'SITUAÇÃO DE RUA' || clean === 'UNHOUSED') return HousingStatus.UNHOUSED;
    return null;
  }

  private parseDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    
    // Excel date serialized as a number
    if (typeof val === 'number') {
      return new Date(Math.round((val - 25569) * 86400 * 1000));
    }

    const str = val.toString().trim();
    
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    }

    // Try DD/MM/YYYY
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  private getHeader(row: any, keys: string[]): any {
    for (const key of keys) {
      if (row[key] !== undefined) return row[key];
    }
    return undefined;
  }

  async preview(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

    const rows: any[] = [];
    const summary = {
      total: 0,
      valid: 0,
      invalid: 0,
      duplicates: 0,
    };

    for (const raw of rawRows) {
      summary.total++;
      
      const rawCpf = this.getHeader(raw, ['CPF', 'cpf', 'Cpf']);
      const fullName = this.getHeader(raw, ['Nome', 'Nome Completo', 'nome', 'fullName', 'Nome completo']);
      const rawBirthDate = this.getHeader(raw, ['Data de Nascimento', 'Nascimento', 'data_nascimento', 'birthDate', 'birthdate', 'Data de nascimento']);
      const rawGender = this.getHeader(raw, ['Gênero', 'Genero', 'genero', 'gender', 'Sexo', 'sexo']);
      const rawRaceColor = this.getHeader(raw, ['Raça/Cor', 'Raça', 'Raca', 'raca_cor', 'raceColor']);
      const rawMaritalStatus = this.getHeader(raw, ['Estado Civil', 'estado_civil', 'maritalStatus']);

      const errors: string[] = [];

      // Validate CPF
      const cleanCpf = rawCpf ? rawCpf.toString().replace(/[^\d]+/g, '') : '';
      if (!cleanCpf) {
        errors.push('CPF é obrigatório');
      } else if (!this.validateCpf(cleanCpf)) {
        errors.push('CPF inválido');
      }

      // Validate Name
      if (!fullName || !fullName.toString().trim()) {
        errors.push('Nome é obrigatório');
      }

      // Validate Birth Date
      const birthDate = this.parseDate(rawBirthDate);
      if (!rawBirthDate) {
        errors.push('Data de nascimento é obrigatória');
      } else if (!birthDate) {
        errors.push('Data de nascimento inválida');
      }

      // Validate Gender
      const gender = this.normalizeGender(rawGender);
      if (!rawGender) {
        errors.push('Gênero é obrigatório');
      } else if (!gender) {
        errors.push(`Gênero inválido: ${rawGender}`);
      }

      // Validate Race/Color
      const raceColor = this.normalizeRaceColor(rawRaceColor);
      if (!rawRaceColor) {
        errors.push('Raça/Cor é obrigatória');
      } else if (!raceColor) {
        errors.push(`Raça/Cor inválida: ${rawRaceColor}`);
      }

      // Validate Marital Status
      const maritalStatus = this.normalizeMaritalStatus(rawMaritalStatus);
      if (!rawMaritalStatus) {
        errors.push('Estado civil é obrigatório');
      } else if (!maritalStatus) {
        errors.push(`Estado civil inválido: ${rawMaritalStatus}`);
      }

      // Optional fields parsing
      const rg = this.getHeader(raw, ['RG', 'rg', 'Rg'])?.toString() || null;
      const phone = this.getHeader(raw, ['Telefone', 'Celular', 'phone', 'telefone'])?.toString() || null;
      const email = this.getHeader(raw, ['E-mail', 'Email', 'email'])?.toString() || null;
      const addressStreet = this.getHeader(raw, ['Endereço', 'Endereco', 'Rua', 'street', 'addressStreet'])?.toString() || null;
      const addressNumber = this.getHeader(raw, ['Número', 'Numero', 'num', 'number', 'addressNumber'])?.toString() || null;
      const neighborhood = this.getHeader(raw, ['Bairro', 'neighborhood', 'bairro'])?.toString() || null;
      
      const rawCep = this.getHeader(raw, ['CEP', 'cep', 'Cep']);
      const zipCode = rawCep ? rawCep.toString().replace(/[^\d]+/g, '') : null;
      if (zipCode && zipCode.length !== 8) {
        errors.push('CEP inválido');
      }

      // Social Profile Optional fields
      const rawNis = this.getHeader(raw, ['NIS', 'nis', 'CadÚnico', 'CadUnico']);
      const nis = rawNis ? rawNis.toString().replace(/[^\d]+/g, '') : null;
      if (nis && !this.validateNis(nis)) {
        errors.push('NIS inválido');
      }

      const rawIncome = this.getHeader(raw, ['Renda per capita', 'Renda', 'renda', 'perCapitaIncome']);
      const perCapitaIncome = rawIncome !== undefined ? Number(rawIncome) : null;

      const rawHousing = this.getHeader(raw, ['Situação de Moradia', 'Moradia', 'housingStatus']);
      const housingStatus = this.normalizeHousingStatus(rawHousing);

      const rawFamilyCount = this.getHeader(raw, ['Integrantes da Família', 'Integrantes', 'familyMembersCount']);
      const familyMembersCount = rawFamilyCount !== undefined ? parseInt(rawFamilyCount, 10) : null;

      const rawBolsa = this.getHeader(raw, ['Recebe Bolsa Família', 'Bolsa Família', 'Bolsa Familia', 'receivesBolsaFamilia']);
      const receivesBolsaFamilia = rawBolsa !== undefined ? (rawBolsa.toString().toUpperCase() === 'SIM' || rawBolsa === true || rawBolsa === 1) : false;

      const rawBpc = this.getHeader(raw, ['Recebe BPC', 'BPC', 'receivesBpc']);
      const receivesBpc = rawBpc !== undefined ? (rawBpc.toString().toUpperCase() === 'SIM' || rawBpc === true || rawBpc === 1) : false;

      const rawPcd = this.getHeader(raw, ['PcD', 'PCD', 'isPcd']);
      const isPcd = rawPcd !== undefined ? (rawPcd.toString().toUpperCase() === 'SIM' || rawPcd === true || rawPcd === 1) : false;

      const pcdDescription = this.getHeader(raw, ['Descrição da Deficiência', 'Deficiência', 'pcdDescription'])?.toString() || null;

      // Professional Profile Optional fields
      const educationLevel = this.getHeader(raw, ['Escolaridade', 'Grau de Instrução', 'educationLevel'])?.toString() || null;
      const rawCourses = this.getHeader(raw, ['Cursos', 'courses']);
      const courses = rawCourses ? (typeof rawCourses === 'string' ? JSON.parse(rawCourses) : rawCourses) : null;
      const rawExperiences = this.getHeader(raw, ['Experiências', 'experiences']);
      const experiences = rawExperiences ? (typeof rawExperiences === 'string' ? JSON.parse(rawExperiences) : rawExperiences) : null;
      const rawAreas = this.getHeader(raw, ['Áreas de Interesse', 'targetAreas']);
      const targetAreas = rawAreas ? (typeof rawAreas === 'string' ? JSON.parse(rawAreas) : rawAreas) : null;

      const citizenObj = {
        cpf: cleanCpf,
        fullName: fullName?.toString().trim() || '',
        birthDate: birthDate ? birthDate.toISOString().split('T')[0] : null,
        gender,
        raceColor,
        maritalStatus,
        rg,
        phone,
        email,
        addressStreet,
        addressNumber,
        neighborhood,
        zipCode,
        socialProfile: nis || perCapitaIncome !== null || housingStatus || familyMembersCount !== null || receivesBolsaFamilia || receivesBpc || isPcd || pcdDescription ? {
          nis,
          perCapitaIncome,
          housingStatus,
          familyMembersCount,
          receivesBolsaFamilia,
          receivesBpc,
          isPcd,
          pcdDescription,
        } : null,
        professionalProfile: educationLevel || courses || experiences || targetAreas ? {
          educationLevel,
          courses,
          experiences,
          targetAreas,
        } : null,
      };

      if (errors.length > 0) {
        summary.invalid++;
        rows.push({
          ...citizenObj,
          status: 'error',
          errors,
        });
      } else {
        const existing = await this.prisma.citizen.findUnique({
          where: { cpf: cleanCpf },
        });

        if (existing) {
          summary.duplicates++;
          rows.push({
            ...citizenObj,
            status: 'duplicate',
            existingId: existing.id,
          });
        } else {
          summary.valid++;
          rows.push({
            ...citizenObj,
            status: 'new',
          });
        }
      }
    }

    return {
      rows,
      summary,
    };
  }

  async execute(dto: {
    citizens: any[];
    duplicateStrategy: 'overwrite_all' | 'ignore_all' | 'individual';
    decisions?: Record<string, 'overwrite' | 'ignore'>;
  }) {
    let imported = 0;
    let overwritten = 0;
    let ignored = 0;
    let errors = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const citizen of dto.citizens) {
        if (!citizen.cpf || !citizen.fullName || !citizen.birthDate || !citizen.gender || !citizen.raceColor || !citizen.maritalStatus) {
          errors++;
          continue;
        }

        const existing = await tx.citizen.findUnique({
          where: { cpf: citizen.cpf },
        });

        if (existing) {
          let action: 'overwrite' | 'ignore' = 'ignore';

          if (dto.duplicateStrategy === 'overwrite_all') {
            action = 'overwrite';
          } else if (dto.duplicateStrategy === 'ignore_all') {
            action = 'ignore';
          } else if (dto.duplicateStrategy === 'individual' && dto.decisions) {
            action = dto.decisions[citizen.cpf] || 'ignore';
          }

          if (action === 'ignore') {
            ignored++;
            continue;
          }

          // Overwrite existing citizen
          const { socialProfile, professionalProfile, ...citizenData } = citizen;
          const data: any = {
            ...citizenData,
            birthDate: new Date(citizenData.birthDate),
          };

          if (socialProfile) {
            data.socialProfile = {
              upsert: {
                create: {
                  nis: socialProfile.nis ? encrypt(socialProfile.nis) : undefined,
                  perCapitaIncome: socialProfile.perCapitaIncome !== undefined && socialProfile.perCapitaIncome !== null ? encrypt(String(socialProfile.perCapitaIncome)) : undefined,
                  housingStatus: socialProfile.housingStatus,
                  familyMembersCount: socialProfile.familyMembersCount,
                  receivesBolsaFamilia: socialProfile.receivesBolsaFamilia,
                  receivesBpc: socialProfile.receivesBpc,
                  isPcd: socialProfile.isPcd,
                  pcdDescription: socialProfile.pcdDescription ? encrypt(socialProfile.pcdDescription) : undefined,
                },
                update: {
                  nis: socialProfile.nis ? encrypt(socialProfile.nis) : undefined,
                  perCapitaIncome: socialProfile.perCapitaIncome !== undefined && socialProfile.perCapitaIncome !== null ? encrypt(String(socialProfile.perCapitaIncome)) : undefined,
                  housingStatus: socialProfile.housingStatus,
                  familyMembersCount: socialProfile.familyMembersCount,
                  receivesBolsaFamilia: socialProfile.receivesBolsaFamilia,
                  receivesBpc: socialProfile.receivesBpc,
                  isPcd: socialProfile.isPcd,
                  pcdDescription: socialProfile.pcdDescription ? encrypt(socialProfile.pcdDescription) : undefined,
                },
              },
            };
          }

          if (professionalProfile) {
            data.professionalProfile = {
              upsert: {
                create: {
                  educationLevel: professionalProfile.educationLevel,
                  courses: professionalProfile.courses,
                  experiences: professionalProfile.experiences,
                  targetAreas: professionalProfile.targetAreas,
                },
                update: {
                  educationLevel: professionalProfile.educationLevel,
                  courses: professionalProfile.courses,
                  experiences: professionalProfile.experiences,
                  targetAreas: professionalProfile.targetAreas,
                },
              },
            };
          }

          await tx.citizen.update({
            where: { id: existing.id },
            data,
          });

          overwritten++;
        } else {
          // Create new citizen
          const { socialProfile, professionalProfile, ...citizenData } = citizen;
          const data: any = {
            ...citizenData,
            birthDate: new Date(citizenData.birthDate),
          };

          if (socialProfile) {
            data.socialProfile = {
              create: {
                nis: socialProfile.nis ? encrypt(socialProfile.nis) : undefined,
                perCapitaIncome: socialProfile.perCapitaIncome !== undefined && socialProfile.perCapitaIncome !== null ? encrypt(String(socialProfile.perCapitaIncome)) : undefined,
                housingStatus: socialProfile.housingStatus,
                familyMembersCount: socialProfile.familyMembersCount,
                receivesBolsaFamilia: socialProfile.receivesBolsaFamilia,
                receivesBpc: socialProfile.receivesBpc,
                isPcd: socialProfile.isPcd,
                pcdDescription: socialProfile.pcdDescription ? encrypt(socialProfile.pcdDescription) : undefined,
              },
            };
          }

          if (professionalProfile) {
            data.professionalProfile = {
              create: {
                educationLevel: professionalProfile.educationLevel,
                courses: professionalProfile.courses,
                experiences: professionalProfile.experiences,
                targetAreas: professionalProfile.targetAreas,
              },
            };
          }

          await tx.citizen.create({
            data,
          });

          imported++;
        }
      }
    });

    return {
      imported,
      overwritten,
      ignored,
      errors,
    };
  }
}
