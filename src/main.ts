import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // -----> CORS Configuration 
  // Allows configuring origins via environment variables:
  // CORS_ORIGINS: comma-separated list (e.g. "http://localhost:3000,https://myapp.com")
  // FRONTEND_URL: single alternative (e.g. "http://localhost:5173")
  const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    // If origins are configured, use them; otherwise, reflect origin (true) to avoid blocks during development
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
    optionsSuccessStatus: 204,
  });

  // -----> Global validation configuration
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
