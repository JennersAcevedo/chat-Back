import { Module } from '@nestjs/common';
import { ChatController } from './modules/chat/controller/chat.controller';
import { ChatService } from './modules/chat/service/chat.service';

@Module({
  controllers: [ChatController], // Import the chat controller
  providers: [ChatService], // Import the chat service
})
export class ChatModule {}
