import { PrismaClient, Role, Gender, ServiceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
  console.log('Criando cidadãos de teste com novo perfil simplificado e enriquecido...');

  // Cidadão 1: João Silva
  const citizen1 = await prisma.citizen.upsert({
    where: { cpf: '52998224725' }, // CPF válido
    update: {
      fullName: 'João Silva de Souza',
    },
    create: {
      fullName: 'João Silva de Souza',
      cpf: '52998224725',
      birthDate: new Date('1990-05-15'),
      gender: Gender.MASCULINO,
      phone: '12988887777',
      neighborhood: 'Centro',
      socialProfile: {
        create: {
          socialPrograms: 'Bolsa Família',
          isPcd: false,
          disabilityCid: null,
        },
      },
      professionalProfile: {
        create: {
          priorityGroup: 'Acompanhamento pelo CRAS',
          educationLevel: 'Médio completo',
          targetAreas: ['Serviços administrativos', 'Área industrial'],
          courses: ['Operador de Empilhadeira', 'Informática'],
          experiences: {
            had_formal_contract: true,
            last_occupation: 'Auxiliar de Logística',
            experience_duration: '6 meses ou mais',
            was_self_employed: false,
          },
        },
      },
    },
  });

  // Cidadão 2: Maria Oliveira (PcD / Mulheres)
  const citizen2 = await prisma.citizen.upsert({
    where: { cpf: '91238475060' }, // CPF válido
    update: {
      fullName: 'Maria Aparecida Oliveira',
    },
    create: {
      fullName: 'Maria Aparecida Oliveira',
      cpf: '91238475060',
      birthDate: new Date('1982-10-20'),
      gender: Gender.FEMININO,
      phone: '12999998888',
      neighborhood: 'Jardim Esperança',
      socialProfile: {
        create: {
          socialPrograms: 'BPC',
          isPcd: true,
          disabilityCid: 'G80.0', // CID de paralisia cerebral / mobilidade reduzida
        },
      },
      professionalProfile: {
        create: {
          priorityGroup: 'Fluxo Municipal da Mulher',
          educationLevel: 'Superior completo',
          targetAreas: ['Atendimento ao público', 'Serviços administrativos'],
          courses: ['Administração de Empresas', 'Gestão'],
          experiences: {
            had_formal_contract: true,
            last_occupation: 'Auxiliar Administrativo',
            experience_duration: '6 meses ou mais',
            was_self_employed: true,
            self_employed_area: 'Artesanato',
          },
        },
      },
    },
  });

  // Cidadão 3: Carlos Santos
  const citizen3 = await prisma.citizen.upsert({
    where: { cpf: '12345678909' },
    update: {},
    create: {
      fullName: 'Carlos Henrique dos Santos',
      cpf: '12345678909',
      birthDate: new Date('1998-03-08'),
      gender: Gender.MASCULINO,
      phone: '12977776666',
      neighborhood: 'Parque Meia Lua',
      socialProfile: {
        create: {
          socialPrograms: null,
          isPcd: false,
          disabilityCid: null,
        },
      },
      professionalProfile: {
        create: {
          priorityGroup: 'Acompanhamento pelo Centro POP',
          educationLevel: 'Fundamental incompleto',
          targetAreas: ['Serviços gerais', 'Construção Civil'],
          courses: [],
          experiences: {
            had_formal_contract: false,
            last_occupation: 'Servente de Obras',
            experience_duration: 'Menos de 6 meses',
            was_self_employed: true,
            self_employed_area: 'Pintura',
          },
        },
      },
    },
  });

  console.log('Cidadãos criados com sucesso.');

  // 3. Criar Atendimentos Históricos
  console.log('Criando histórico de atendimentos com a Nova Seção do Atendimento (dados do técnico)...');
  await prisma.attendance.createMany({
    data: [
      {
        citizenId: citizen1.id,
        userId: attendant.id,
        serviceType: ServiceType.ORIENTACAO,
        notes: 'Cidadão compareceu buscando orientação profissional sobre vagas de logística.',
        technicianName: 'Marisa Alencar',
        technicianWorkplace: 'CREAS I',
        technicianContact: 'marisa@creas.jacarei.sp.gov.br',
        createdAt: new Date('2026-08-01T10:00:00.000Z'),
      },
      {
        citizenId: citizen1.id,
        userId: admin.id,
        serviceType: ServiceType.ENCAMINHAMENTO,
        notes: 'Encaminhado para entrevista na empresa Logística Jacareí para a vaga de Auxiliar de Logística.',
        technicianName: 'Flávio Souza',
        technicianWorkplace: 'PAT Jacareí',
        technicianContact: '12988881234',
        createdAt: new Date('2026-08-05T14:30:00.000Z'),
      },
      {
        citizenId: citizen2.id,
        userId: attendant.id,
        serviceType: ServiceType.CADASTRO_VAGA,
        notes: 'Inclusão produtiva da cidadã com encaminhamento para fluxo prioritário de mulheres.',
        technicianName: 'Ana Paula Psicóloga',
        technicianWorkplace: 'Ong Recomeçar',
        technicianContact: 'ana.recomecar@gmail.com',
        createdAt: new Date('2026-08-06T09:15:00.000Z'),
      },
      {
        citizenId: citizen3.id,
        userId: attendant.id,
        serviceType: ServiceType.ATUALIZACAO_CADASTRAL,
        notes: 'Acolhimento da equipe do Centro POP para elaboração de currículo básico.',
        technicianName: 'Juliana de Fátima',
        technicianWorkplace: 'Centro POP',
        technicianContact: '1239551122',
        createdAt: new Date('2026-08-07T11:00:00.000Z'),
      },
    ],
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

