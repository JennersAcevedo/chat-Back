import { Module } from '@nestjs/common';
import { ChatController } from './modules/chat/controller/chat.controller';
import { ChatService } from './modules/chat/service/chat.service';
import { LlmModule } from './modules/llm/llm.module';

@Module({
  imports: [LlmModule], // Import LLM module
  controllers: [ChatController], // Import chat controller
  providers: [ChatService], // Import chat service
})
export class ChatModule {}
