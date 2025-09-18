import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';

@Module({
  providers: [LlmService], // Import LlmService
  exports: [LlmService],// Export LlmService
})
export class LlmModule {}
