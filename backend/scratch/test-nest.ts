import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { CitizensController } from '../src/modules/citizens/citizens.controller';
import { AttendancesController } from '../src/modules/attendances/attendances.controller';
import { PrismaService } from '../src/prisma/prisma.service';

async function bootstrap() {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const prisma = app.get(PrismaService);
  const citizensController = app.get(CitizensController);
  const attendancesController = app.get(AttendancesController);

  const citizen = await prisma.citizen.findUnique({
    where: { cpf: '52998224725' },
  });
  const user = await prisma.user.findFirst({
    where: { email: 'atendente@sippat.jacarei.sp.gov.br' },
  });

  console.log('CITIZEN:', citizen?.id);
  console.log('USER:', user?.id);

  try {
    console.log('1. Executando citizensController.update...');
    const reqMock = { user: { sub: user?.id } };
    
    // Simulate updating citizen
    const updated = await citizensController.update(
      citizen!.id,
      {
        cpf: '52998224725',
        fullName: 'João Silva de Souza Atualizado',
        birthDate: '1990-05-15',
        gender: 'MASCULINO',
        raceColor: 'PARDA',
        maritalStatus: 'SOLTEIRO',
      }
    );
    console.log('UPDATE SUCESSO:', updated.fullName);
  } catch (err) {
    console.error('ERRO EM UPDATE CIDADÃO:', err);
  }

  try {
    console.log('2. Executando attendancesController.create...');
    const reqMock = { user: { sub: user?.id } };
    
    const attendance = await attendancesController.create(
      {
        citizenId: citizen!.id,
        serviceType: 'ORIENTACAO' as any,
        notes: 'Teste de notas',
      },
      reqMock
    );
    console.log('ATTENDANCE SUCESSO:', attendance.id);
  } catch (err) {
    console.error('ERRO EM CREATE ATTENDANCE:', err);
  }

  await app.close();
}

bootstrap();
