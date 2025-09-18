import { Module } from '@nestjs/common';
import { ChatController } from './modules/chat/controller/chat.controller';
import { ChatService } from './modules/chat/service/chat.service';

@Module({
  controllers: [ChatController], // Se importa el controlador de chat
  providers: [ChatService], // Se importa el servicio de chat
})
export class ChatModule {}
