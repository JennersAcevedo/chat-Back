import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // -----> Configuración de CORS 
  // Permite configurar orígenes por variables de entorno:
  // CORS_ORIGINS: lista separada por comas (ej: "http://localhost:3000,https://miapp.com")
  // FRONTEND_URL: alternativa única (ej: "http://localhost:5173")
  const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    // Si hay orígenes configurados, se usan; si no, reflejar origen (true) para evitar bloqueos durante desarrollo
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
    optionsSuccessStatus: 204,
  });

  // -----> Configuración de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const firstError = errors[0];
        const constraints = firstError.constraints;
        const messages = constraints ? Object.values(constraints) : ['Validation error'];
        return new BadRequestException(messages[0]);
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
