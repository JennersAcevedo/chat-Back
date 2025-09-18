import { Module } from '@nestjs/common';
import { ChatModule } from './chat.module';

@Module({
  imports: [ChatModule], // Se importa el módulo de chat
})
export class AppModule {}
