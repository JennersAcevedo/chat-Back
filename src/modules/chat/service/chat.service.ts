import { Injectable } from '@nestjs/common';
import { SendMessageDto } from '../dto/sendMessage.dto';

@Injectable()
export class ChatService {
  sendMessage(body:SendMessageDto):string {
    // Simula una respuesta del bot convirtiendo el mensaje a mayúsculas
    return `Bot: ${body.message.toUpperCase()}`;
  }
}
