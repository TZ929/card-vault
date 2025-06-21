import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RolesGuard } from './auth/roles.guard'
import { Reflector } from '@nestjs/core'
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  app.useGlobalGuards(new RolesGuard(reflector));

  // Enable CORS
  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Get PrismaService instance and enable shutdown hooks
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
