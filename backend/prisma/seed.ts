import { PrismaClient, Role, Gender, RaceColor, MaritalStatus, HousingStatus, ServiceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

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

async function main() {
  console.log('Iniciando o seeding do banco de dados...');

  // 1. Criar Funcionários (Users)
  console.log('Criando usuários do PAT...');
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@123', saltRounds);
  const attendantPasswordHash = await bcrypt.hash('Attendant@123', saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sippat.jacarei.sp.gov.br' },
    update: {},
    create: {
      name: 'Administrador PAT',
      email: 'admin@sippat.jacarei.sp.gov.br',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const attendant = await prisma.user.upsert({
    where: { email: 'atendente@sippat.jacarei.sp.gov.br' },
    update: {},
    create: {
      name: 'Atendente PAT Silva',
      email: 'atendente@sippat.jacarei.sp.gov.br',
      passwordHash: attendantPasswordHash,
      role: Role.ATTENDANT,
      isActive: true,
    },
  });

  console.log(`Usuários criados: ${admin.email} (ADMIN) e ${attendant.email} (ATTENDANT)`);

  // 2. Criar Cidadãos
  console.log('Criando cidadãos de teste com dados socioeconômicos e profissionais...');

  // Cidadão 1: João Silva
  const citizen1 = await prisma.citizen.upsert({
    where: { cpf: '52998224725' }, // CPF válido
    update: {},
    create: {
      fullName: 'João Silva de Souza',
      cpf: '52998224725',
      rg: '123456789',
      birthDate: new Date('1990-05-15'),
      gender: Gender.MASCULINO,
      raceColor: RaceColor.PARDA,
      maritalStatus: MaritalStatus.SOLTEIRO,
      phone: '12988887777',
      email: 'joao.silva@example.com',
      addressStreet: 'Rua Alfredo Schürig',
      addressNumber: '150',
      neighborhood: 'Centro',
      zipCode: '12308030',
      socialProfile: {
        create: {
          nis: encrypt('12345678901'),
          perCapitaIncome: encrypt('650.00'),
          housingStatus: HousingStatus.RENTED,
          familyMembersCount: 3,
          receivesBolsaFamilia: true,
          receivesBpc: false,
          isPcd: false,
        },
      },
      professionalProfile: {
        create: {
          educationLevel: 'Ensino Médio Completo',
          courses: ['Operador de Empilhadeira', 'Informática Básica'],
          experiences: [
            { empresa: 'Logística Jacareí', cargo: 'Auxiliar de Logística', duracao: '2 anos' }
          ],
          targetAreas: ['Logística', 'Operação de Máquinas', 'Produção'],
        },
      },
    },
  });

  // Cidadão 2: Maria Oliveira (PcD)
  const citizen2 = await prisma.citizen.upsert({
    where: { cpf: '38374246875' }, // CPF válido
    update: {},
    create: {
      fullName: 'Maria Aparecida Oliveira',
      cpf: '38374246875',
      rg: '987654321',
      birthDate: new Date('1982-10-20'),
      gender: Gender.FEMININO,
      raceColor: RaceColor.BRANCA,
      maritalStatus: MaritalStatus.CASADO,
      phone: '12999998888',
      email: 'maria.oliveira@example.com',
      addressStreet: 'Avenida Siqueira Campos',
      addressNumber: '1200',
      neighborhood: 'Jardim Esperança',
      zipCode: '12327000',
      socialProfile: {
        create: {
          nis: encrypt('23456789012'),
          perCapitaIncome: encrypt('1200.00'),
          housingStatus: HousingStatus.OWN,
          familyMembersCount: 4,
          receivesBolsaFamilia: false,
          receivesBpc: true,
          isPcd: true,
          pcdDescription: encrypt('Cadeirante, deficiência motora nos membros inferiores'),
        },
      },
      professionalProfile: {
        create: {
          educationLevel: 'Ensino Superior Completo',
          courses: ['Administração de Empresas', 'Excel Avançado'],
          experiences: [
            { empresa: 'Jacareí Auto Peças', cargo: 'Auxiliar Administrativo', duracao: '5 anos' }
          ],
          targetAreas: ['Administração', 'Recepção', 'Atendimento'],
        },
      },
    },
  });

  // Cidadão 3: Carlos Santos
  const citizen3 = await prisma.citizen.upsert({
    where: { cpf: '12345678909' }, // Mock valid in system context
    update: {},
    create: {
      fullName: 'Carlos Henrique dos Santos',
      cpf: '12345678909',
      rg: '456123789',
      birthDate: new Date('1998-03-08'),
      gender: Gender.MASCULINO,
      raceColor: RaceColor.PRETA,
      maritalStatus: MaritalStatus.UNIAO_ESTAVEL,
      phone: '12977776666',
      email: 'carlos.santos@example.com',
      addressStreet: 'Rua Santa Helena',
      addressNumber: '45',
      neighborhood: 'Parque Meia Lua',
      zipCode: '12330010',
      socialProfile: {
        create: {
          nis: null,
          perCapitaIncome: encrypt('0.00'),
          housingStatus: HousingStatus.RISK_AREA,
          familyMembersCount: 1,
          receivesBolsaFamilia: false,
          receivesBpc: false,
          isPcd: false,
        },
      },
      professionalProfile: {
        create: {
          educationLevel: 'Ensino Fundamental Incompleto',
          courses: [],
          experiences: [
            { empresa: 'Construções Jacareí', cargo: 'Servente de Pedreiro', duracao: '1 ano' }
          ],
          targetAreas: ['Construção Civil', 'Serviços Gerais'],
        },
      },
    },
  });

  console.log('Cidadãos criados com sucesso.');

  // 3. Criar Atendimentos Históricos
  console.log('Criando histórico de atendimentos de teste...');
  await prisma.attendance.createMany({
    data: [
      {
        citizenId: citizen1.id,
        userId: attendant.id,
        serviceType: ServiceType.ORIENTACAO,
        notes: 'Cidadão compareceu buscando orientação profissional sobre vagas na área de logística. Atualizado currículo no sistema.',
        createdAt: new Date('2026-08-01T10:00:00.000Z'),
      },
      {
        citizen1Id: citizen1.id, // Wait, database schema uses citizenId, not citizen1Id.
        citizenId: citizen1.id,
        userId: admin.id,
        serviceType: ServiceType.ENCAMINHAMENTO,
        notes: 'Encaminhado para entrevista na empresa Logística Jacareí para a vaga de Auxiliar de Logística.',
        createdAt: new Date('2026-08-05T14:30:00.000Z'),
      },
      {
        citizenId: citizen2.id,
        userId: attendant.id,
        serviceType: ServiceType.ATUALIZACAO_CADASTRAL,
        notes: 'Atualização das informações profissionais e de escolaridade. Cadastro de vaga PCD no sistema.',
        createdAt: new Date('2026-08-06T09:15:00.000Z'),
      },
    ].map(item => {
      // Remove any temporary mistakes
      const { citizen1Id, ...validItem } = item as any;
      return validItem;
    }),
  });

  console.log('Histórico de atendimentos criado com sucesso.');
  console.log('Seeding do banco de dados concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
