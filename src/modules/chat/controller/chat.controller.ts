import { Body, Controller,  HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ChatService } from '../service/chat.service';
import { SendMessageDto } from '../dto/sendMessage.dto';
import { RateLimitGuard } from '../../../shared/guards/rate-limit.guard';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(RateLimitGuard) // Guard para limitar 
  @Post('/chat')
 async sendMessage(@Res()response, @Body() body:SendMessageDto) {
    try {
      //Se llama al servicio para enviar el mensaje y obtener la respuesta del bot
            let reply = await this.chatService.sendMessage(body);
            //En la respuesta de el servicio se retorna un success true para poder validar mas facil en el frontend
            return response
                .status(HttpStatus.OK)
                .json({ success: true, reply, reason: "" });
        } catch (error: any) {
            console.log(error);
            // En caso de error, retornar un estado 400 con el mensaje de error y en la consola se muestra el error
            return response
                .status(HttpStatus.BAD_REQUEST)
                .json({ success: false, reply: "", reason: error.message || "Error" });
        }
  }
}
