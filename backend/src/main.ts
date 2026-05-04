import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { BadgeEngineService } from './badges/badge-engine.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
  origin: true, // Autorise l'origine de la requête entrante
  credentials: true,
});

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('ByteBattle API')
    .setDescription('ByteBattle competitive coding platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 4001;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);

  const publicApiUrl = process.env.PUBLIC_API_URL || `http://${host}:${port}`;
  console.log(`🚀 ByteBattle API running on ${publicApiUrl}`);
  console.log(`📄 Swagger docs at ${publicApiUrl}/api/docs`);

  // Seed badge catalogue on every startup (idempotent)
  try {
    const badgeEngine = app.get(BadgeEngineService);
    await badgeEngine.seedBadges();
  } catch (e) {
    console.warn('Badge seed skipped:', e.message);
  }
}
bootstrap();
