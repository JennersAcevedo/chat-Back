import { Injectable } from '@nestjs/common';
import { SendMessageDto } from '../dto/sendMessage.dto';

@Injectable()
export class ChatService {
  sendMessage(body:SendMessageDto):string {
    // Simulates a bot response by converting the message to uppercase
    return `Bot: ${body.message.toUpperCase()}`;
  }
}
