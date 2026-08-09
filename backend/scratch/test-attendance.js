const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const citizen = await prisma.citizen.findUnique({
      where: { cpf: '52998224725' },
    });
    console.log('Cidadão encontrado:', citizen);

    const user = await prisma.user.findFirst({
      where: { email: 'atendente@sippat.jacarei.sp.gov.br' },
    });
    console.log('Usuário encontrado:', user);

    // Simulate citizensService.update
    console.log('Simulando update do cidadão...');
    const updated = await prisma.citizen.update({
      where: { id: citizen.id },
      data: {
        fullName: 'João Silva de Souza Novo',
        birthDate: new Date('1990-05-15'),
      },
    });
    console.log('Cidadão atualizado:', updated);

    // Simulate attendancesService.create
    console.log('Simulando criação de atendimento...');
    const attendance = await prisma.attendance.create({
      data: {
        citizenId: citizen.id,
        userId: user.id,
        serviceType: 'ORIENTACAO',
        notes: 'Teste de notas',
      },
    });
    console.log('Atendimento criado com sucesso:', attendance);

  } catch (error) {
    console.error('ERRO DETECTADO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
