import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';
import { Gender } from '@prisma/client';

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

  public validateCpf(value: any): boolean {
    if (!value) return false;
    const cpf = value.toString().replace(/[^\d]+/g, '');
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

  public normalizeGender(val: any, defaultGender: Gender = Gender.NAO_DECLARADO): Gender {
    if (!val) return defaultGender;
    const clean = val.toString().trim().toUpperCase();
    if (clean === 'MASCULINO' || clean === 'M' || clean === 'HOMEM') return Gender.MASCULINO;
    if (clean === 'FEMININO' || clean === 'F' || clean === 'MULHER') return Gender.FEMININO;
    if (clean === 'OUTRO' || clean === 'O') return Gender.OUTRO;
    if (clean === 'NAO_DECLARADO' || clean === 'NÃO DECLARADO' || clean === 'N') return Gender.NAO_DECLARADO;
    return defaultGender;
  }

  public parseDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

    // Excel serial number
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return isNaN(date.getTime()) ? null : date;
    }

    const str = val.toString().trim();

    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const d = new Date(str.substring(0, 10));
      return isNaN(d.getTime()) ? null : d;
    }

    // Check DD/MM/YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      const year = parseInt(ddmmyyyy[3], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }

    // Check if numeric string from Excel
    const num = Number(str);
    if (!isNaN(num) && num > 10000 && num < 60000) {
      const d = new Date(Math.round((num - 25569) * 86400 * 1000));
      return isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  private extractNeighborhood(address: any): string | null {
    if (!address) return null;
    const str = address.toString().trim();
    if (!str) return null;

    // e.g. "Rua X 126/Centro Pop" -> "Centro Pop"
    if (str.includes('/')) {
      const parts = str.split('/');
      const cand = parts[parts.length - 1].trim();
      if (cand) return cand;
    }

    // e.g. "Rua ..., n 43 - Bairro - 12345-000"
    if (str.includes('-')) {
      const parts = str.split('-').map((p) => p.trim());
      // find part that doesn't have digits
      for (let i = 1; i < parts.length; i++) {
        if (!/\d/.test(parts[i]) && parts[i].length > 2) {
          return parts[i];
        }
      }
    }

    return null;
  }

  public parseTechnician(raw: any): { technicianName: string | null; technicianWorkplace: string | null } {
    if (!raw) return { technicianName: null, technicianWorkplace: null };
    const str = raw.toString().trim();
    if (!str) return { technicianName: null, technicianWorkplace: null };

    // Common separators in atendimento.xlsx: \n, /, -
    const lines = str.split(/[\n\/]/).map((l: string) => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      return {
        technicianWorkplace: lines[0],
        technicianName: lines.slice(1).join(' / '),
      };
    }

    return {
      technicianWorkplace: null,
      technicianName: str,
    };
  }

  private getHeader(row: any, keys: string[]): any {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        const val = row[key].toString().trim();
        if (val !== '') return row[key];
      }
    }
    return undefined;
  }

  async preview(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Check if this workbook is the legacy 'atendimento.xlsx'
    const isAtendimentoFile = workbook.SheetNames.includes('Mulheres Vit Violencia') ||
      workbook.SheetNames.some((name) => {
        const sheet = workbook.Sheets[name];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        return rawJson.some((row) => Array.isArray(row) && row.some((cell) => typeof cell === 'string' && cell.includes('Encaminhado para entrevista')));
      });

    if (isAtendimentoFile) {
      return this.previewAtendimentos(workbook);
    }

    // Default or Formulario multi-tab
    return this.previewCitizens(workbook);
  }

  private async previewAtendimentos(workbook: XLSX.WorkBook) {
    const sheetName = workbook.SheetNames.includes('Mulheres Vit Violencia')
      ? 'Mulheres Vit Violencia'
      : workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Find header row (usually row with 'Encaminhado por:' or 'nº')
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(rawMatrix.length, 5); i++) {
      if (Array.isArray(rawMatrix[i]) && rawMatrix[i].some((cell) => typeof cell === 'string' && (cell.includes('Encaminhado por') || cell === 'nº'))) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = rawMatrix[headerRowIdx] || [];
    const rows: any[] = [];
    const summary = {
      total: 0,
      valid: 0,
      invalid: 0,
      duplicates: 0,
    };

    for (let i = headerRowIdx + 1; i < rawMatrix.length; i++) {
      const row = rawMatrix[i];
      if (!row || row.length === 0 || (!row[0] && !row[1] && !row[2])) continue;

      summary.total++;

      const candNum = row[0];
      const rawDate = row[1];
      const rawTech = row[2];
      const obs1 = row[3];
      const targetRole = row[4];
      const interview1 = row[5];
      const interview2 = row[6];
      const obs2 = row[8];
      const rawBairro = row[9];

      const { technicianName, technicianWorkplace } = this.parseTechnician(rawTech);
      const parsedDate = this.parseDate(rawDate);

      const notesParts: string[] = [];
      if (targetRole) notesParts.push(`Função desejada: ${targetRole}`);
      if (interview1) notesParts.push(`Entrevista 1: ${interview1}`);
      if (interview2) notesParts.push(`Entrevista 2: ${interview2}`);
      if (obs1) notesParts.push(`Obs: ${obs1}`);
      if (obs2) notesParts.push(`Obs retorno: ${obs2}`);

      const notes = notesParts.join('\n\n');
      const neighborhood = rawBairro ? rawBairro.toString().trim() : null;

      summary.valid++;
      rows.push({
        candidateNumber: candNum,
        date: parsedDate ? parsedDate.toISOString() : new Date().toISOString(),
        technicianName,
        technicianWorkplace,
        neighborhood,
        notes,
        status: 'valid',
      });
    }

    return {
      fileType: 'atendimentos',
      rows,
      summary,
    };
  }

  private async previewCitizens(workbook: XLSX.WorkBook) {
    const rows: any[] = [];
    const summary = {
      total: 0,
      valid: 0,
      invalid: 0,
      duplicates: 0,
    };

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

      // Default priorityGroup from sheet name if recognized
      let sheetPriorityGroup: string | null = null;
      let sheetGender: Gender = Gender.NAO_DECLARADO;

      if (sheetName.toLowerCase().includes('mulher')) {
        sheetPriorityGroup = 'Fluxo Municipal da Mulher';
        sheetGender = Gender.FEMININO;
      } else if (sheetName.toLowerCase().includes('pop')) {
        sheetPriorityGroup = 'Acompanhamento pelo Centro POP';
      }

      for (const raw of rawRows) {
        summary.total++;

        const rawCpf = this.getHeader(raw, ['CPF:', 'CPF', 'cpf', 'Cpf']);
        const rawName = this.getHeader(raw, ['Nome completo:', 'Nome Completo', 'Nome', 'nome', 'fullName']);
        const rawBirthDate = this.getHeader(raw, ['Data de nascimento:', 'Data de Nascimento', 'Nascimento', 'birthDate', 'birthdate']);
        const rawGender = this.getHeader(raw, ['Gênero', 'Genero', 'genero', 'gender', 'Sexo', 'sexo']);
        const rawPhone = this.getHeader(raw, ['Telefone seguro para contato:', 'Telefone para recado:', 'Telefone', 'Celular', 'phone', 'telefone']);
        const rawAddress = this.getHeader(raw, ['Endereço completo:', 'Endereço', 'Endereco', 'address']);
        const rawNeighborhood = this.getHeader(raw, ['Bairro', 'neighborhood', 'BAIRRO']);

        const rawPcd = this.getHeader(raw, ['Tem alguma deficiência ?', 'Tem alguma deficiência ? ', 'PcD', 'PCD', 'isPcd']);
        const rawDisabilityCid = this.getHeader(raw, ['Se "Sim", informar o CID:', 'CID', 'disabilityCid']);
        const rawSocialPrograms = this.getHeader(raw, ['Se "Sim", qual ?', 'Está recebendo algum benefício socioassistencial?', 'socialPrograms']);

        const rawPriorityGroup = this.getHeader(raw, ['Pertence a qual público prioritário para políticas públicas?', 'Pertence a qual público prioritário para políticas públicas? ', 'Público Prioritário', 'priorityGroup']);
        const rawEducation = this.getHeader(raw, ['Escolaridade:', 'Escolaridade', 'educationLevel']);
        const rawCourses = this.getHeader(raw, ['Cursos técnicos ou profissionalizantes realizados:', 'Qual o curso ou os cursos superiores concluídos?', 'Cursos', 'courses']);
        const rawTargetAreas = this.getHeader(raw, ['Áreas em que gostaria de trabalhar:', ' Áreas em que gostaria de trabalhar:', 'Áreas de Interesse', 'targetAreas']);

        // Experience questions from formulario.pdf
        const rawHadContract = this.getHeader(raw, ['Já trabalhou com carteira assinada?', 'Carteira assinada']);
        const rawLastOccupation = this.getHeader(raw, ['Última ocupação:']);
        const rawDuration = this.getHeader(raw, ['Tempo de experiência na última ocupação']);
        const rawSelfEmployed = this.getHeader(raw, ['Já trabalhou por conta própria ou empreendeu?']);
        const rawSelfEmployedArea = this.getHeader(raw, ['Se "Sim", em qual área?']);

        // Technician & Attendance section
        const rawTechName = this.getHeader(raw, ['Nome do técnico responsável pelo preenchimento desse formulário:', 'technicianName']);
        const rawTechWorkplace = this.getHeader(raw, ['Local de trabalho do técnico:', 'technicianWorkplace']);
        const rawTechContact = this.getHeader(raw, ['Contato do técnico responsável (telefone ou e-mail):', 'technicianContact']);
        const rawNotes = this.getHeader(raw, ['Observações técnicas relevantes ao PAT (sem exposição da situação de violência):', 'Observações técnicas relevantes ao PAT:', 'Observação', 'notes']);

        const errors: string[] = [];

        // Validate CPF
        const cleanCpf = rawCpf ? rawCpf.toString().replace(/[^\d]+/g, '') : '';
        if (!cleanCpf) {
          errors.push('CPF é obrigatório');
        } else if (!this.validateCpf(cleanCpf)) {
          errors.push('CPF inválido');
        }

        // Validate Name
        const fullName = rawName ? rawName.toString().trim() : '';
        if (!fullName) {
          errors.push('Nome é obrigatório');
        }

        // Validate Birth Date
        const birthDate = this.parseDate(rawBirthDate);
        if (!rawBirthDate) {
          errors.push('Data de nascimento é obrigatória');
        } else if (!birthDate) {
          errors.push('Data de nascimento inválida');
        }

        // Gender resolution
        const gender = this.normalizeGender(rawGender, sheetGender);

        // Neighborhood resolution
        const neighborhood = rawNeighborhood
          ? rawNeighborhood.toString().trim()
          : this.extractNeighborhood(rawAddress);

        // Phone resolution
        const phone = rawPhone ? rawPhone.toString().trim() : null;

        // Social profile
        const isPcd = rawPcd !== undefined ? (rawPcd.toString().toUpperCase().includes('SIM') || rawPcd === true || rawPcd === 1) : false;
        const disabilityCid = rawDisabilityCid ? rawDisabilityCid.toString().trim() : null;
        const socialPrograms = rawSocialPrograms ? rawSocialPrograms.toString().trim() : null;

        // Priority group
        const priorityGroup = rawPriorityGroup ? rawPriorityGroup.toString().trim() : sheetPriorityGroup;
        const educationLevel = rawEducation ? rawEducation.toString().trim() : null;

        // Courses
        let courses: string[] | null = null;
        if (rawCourses) {
          if (Array.isArray(rawCourses)) courses = rawCourses;
          else if (typeof rawCourses === 'string') {
            courses = rawCourses.split(/[;,]/).map((c) => c.trim()).filter(Boolean);
          }
        }

        // Target areas
        let targetAreas: string[] | null = null;
        if (rawTargetAreas) {
          if (Array.isArray(rawTargetAreas)) targetAreas = rawTargetAreas;
          else if (typeof rawTargetAreas === 'string') {
            targetAreas = rawTargetAreas.split(/[;,]/).map((a) => a.trim()).filter(Boolean);
          }
        }

        // Experiences JSON
        let experiences: any = null;
        if (rawHadContract !== undefined || rawLastOccupation || rawDuration || rawSelfEmployed !== undefined || rawSelfEmployedArea) {
          experiences = {
            had_formal_contract: rawHadContract ? rawHadContract.toString().toUpperCase().includes('SIM') : false,
            last_occupation: rawLastOccupation ? rawLastOccupation.toString().trim() : null,
            experience_duration: rawDuration ? rawDuration.toString().trim() : null,
            was_self_employed: rawSelfEmployed ? rawSelfEmployed.toString().toUpperCase().includes('SIM') : false,
            self_employed_area: rawSelfEmployedArea ? rawSelfEmployedArea.toString().trim() : null,
          };
        }

        // Technician details for initial attendance
        const technicianName = rawTechName ? rawTechName.toString().trim() : null;
        const technicianWorkplace = rawTechWorkplace ? rawTechWorkplace.toString().trim() : null;
        const technicianContact = rawTechContact ? rawTechContact.toString().trim() : null;
        const notes = rawNotes ? rawNotes.toString().trim() : null;

        const citizenObj = {
          cpf: cleanCpf,
          fullName,
          birthDate: birthDate ? birthDate.toISOString().split('T')[0] : null,
          gender,
          phone,
          neighborhood,
          socialProfile: isPcd || disabilityCid || socialPrograms ? {
            isPcd,
            disabilityCid,
            socialPrograms,
          } : null,
          professionalProfile: priorityGroup || educationLevel || courses || targetAreas || experiences ? {
            priorityGroup,
            educationLevel,
            courses,
            targetAreas,
            experiences,
          } : null,
          initialAttendance: technicianName || technicianWorkplace || notes ? {
            technicianName,
            technicianWorkplace,
            technicianContact,
            notes,
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
    }

    return {
      fileType: 'citizens',
      rows,
      summary,
    };
  }

  async execute(
    dto: {
      citizens?: any[];
      attendances?: any[];
      duplicateStrategy: 'overwrite_all' | 'ignore_all' | 'individual';
      decisions?: Record<string, 'overwrite' | 'ignore'>;
    },
    userId?: string,
  ) {
    let imported = 0;
    let overwritten = 0;
    let ignored = 0;
    let errors = 0;

    // Fallback user if none provided
    let fallbackUserId = userId;
    if (!fallbackUserId) {
      const firstUser = await this.prisma.user.findFirst();
      fallbackUserId = firstUser?.id || '';
    }

    await this.prisma.$transaction(async (tx) => {
      // Process citizens
      if (dto.citizens && Array.isArray(dto.citizens)) {
        for (const citizen of dto.citizens) {
          if (!citizen.cpf || !citizen.fullName || !citizen.birthDate || !citizen.gender) {
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
            const { socialProfile, professionalProfile, initialAttendance, ...citizenData } = citizen;
            const data: any = {
              ...citizenData,
              birthDate: new Date(citizenData.birthDate),
            };

            if (socialProfile) {
              data.socialProfile = {
                upsert: {
                  create: {
                    isPcd: socialProfile.isPcd ?? false,
                    disabilityCid: socialProfile.disabilityCid ? encrypt(socialProfile.disabilityCid) : undefined,
                    socialPrograms: socialProfile.socialPrograms ? encrypt(socialProfile.socialPrograms) : undefined,
                  },
                  update: {
                    isPcd: socialProfile.isPcd !== undefined ? socialProfile.isPcd : undefined,
                    disabilityCid: socialProfile.disabilityCid ? encrypt(socialProfile.disabilityCid) : undefined,
                    socialPrograms: socialProfile.socialPrograms ? encrypt(socialProfile.socialPrograms) : undefined,
                  },
                },
              };
            }

            if (professionalProfile) {
              data.professionalProfile = {
                upsert: {
                  create: {
                    priorityGroup: professionalProfile.priorityGroup,
                    educationLevel: professionalProfile.educationLevel,
                    courses: professionalProfile.courses,
                    experiences: professionalProfile.experiences,
                    targetAreas: professionalProfile.targetAreas,
                  },
                  update: {
                    priorityGroup: professionalProfile.priorityGroup,
                    educationLevel: professionalProfile.educationLevel,
                    courses: professionalProfile.courses,
                    experiences: professionalProfile.experiences,
                    targetAreas: professionalProfile.targetAreas,
                  },
                },
              };
            }

            const updated = await tx.citizen.update({
              where: { id: existing.id },
              data,
            });

            if (initialAttendance && fallbackUserId) {
              await tx.attendance.create({
                data: {
                  citizenId: updated.id,
                  userId: fallbackUserId,
                  serviceType: 'CADASTRO_VAGA',
                  notes: initialAttendance.notes,
                  technicianName: initialAttendance.technicianName,
                  technicianWorkplace: initialAttendance.technicianWorkplace,
                  technicianContact: initialAttendance.technicianContact,
                },
              });
            }

            overwritten++;
          } else {
            // Create new citizen
            const { socialProfile, professionalProfile, initialAttendance, ...citizenData } = citizen;
            const data: any = {
              ...citizenData,
              birthDate: new Date(citizenData.birthDate),
            };

            if (socialProfile) {
              data.socialProfile = {
                create: {
                  isPcd: socialProfile.isPcd ?? false,
                  disabilityCid: socialProfile.disabilityCid ? encrypt(socialProfile.disabilityCid) : undefined,
                  socialPrograms: socialProfile.socialPrograms ? encrypt(socialProfile.socialPrograms) : undefined,
                },
              };
            }

            if (professionalProfile) {
              data.professionalProfile = {
                create: {
                  priorityGroup: professionalProfile.priorityGroup,
                  educationLevel: professionalProfile.educationLevel,
                  courses: professionalProfile.courses,
                  experiences: professionalProfile.experiences,
                  targetAreas: professionalProfile.targetAreas,
                },
              };
            }

            const created = await tx.citizen.create({
              data,
            });

            if (initialAttendance && fallbackUserId) {
              await tx.attendance.create({
                data: {
                  citizenId: created.id,
                  userId: fallbackUserId,
                  serviceType: 'CADASTRO_VAGA',
                  notes: initialAttendance.notes,
                  technicianName: initialAttendance.technicianName,
                  technicianWorkplace: initialAttendance.technicianWorkplace,
                  technicianContact: initialAttendance.technicianContact,
                },
              });
            }

            imported++;
          }
        }
      }

      // Process attendances (if importing directly from atendimento.xlsx)
      if (dto.attendances && Array.isArray(dto.attendances) && fallbackUserId) {
        for (const att of dto.attendances) {
          // If a matching citizenId is present, link to it; otherwise register or log
          if (att.citizenId) {
            await tx.attendance.create({
              data: {
                citizenId: att.citizenId,
                userId: fallbackUserId,
                serviceType: 'ENCAMINHAMENTO',
                notes: att.notes,
                technicianName: att.technicianName,
                technicianWorkplace: att.technicianWorkplace,
                createdAt: att.date ? new Date(att.date) : new Date(),
              },
            });
            imported++;
          }
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
