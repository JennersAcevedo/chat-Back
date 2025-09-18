import { Module } from '@nestjs/common';
import { ChatModule } from './chat.module';

@Module({
  imports: [ChatModule], // Import the chat module
})
export class AppModule {}
