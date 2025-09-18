import { Injectable, Logger } from '@nestjs/common';
import { SendMessageDto } from '../dto/sendMessage.dto';
import { LlmService } from '../../llm/llm.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly llmService: LlmService) {}

  async sendMessage(body: SendMessageDto): Promise<string> {
    try {
      this.logger.log(`Processing message: ${body.message.substring(0, 50)}...`);
      
      const llmResponse = await this.llmService.generateResponse(body.message);
      
      this.logger.log('LLM response generated successfully');
      return llmResponse;

    } catch (error) {
      this.logger.error('Error in ChatService:', error);
      throw new Error('I couldn\'t process your query at the moment. Please try again.');
    }
  }
}
