import { Body, Controller,  HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ChatService } from '../service/chat.service';
import { SendMessageDto } from '../dto/sendMessage.dto';
import { RateLimitGuard } from '../../../shared/guards/rate-limit.guard';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(RateLimitGuard) // Guard to limit requests 
  @Post('/chat')
 async sendMessage(@Res()response, @Body() body:SendMessageDto) {
    try {
      //Call the service to send the message and get the bot's response
            let reply = await this.chatService.sendMessage(body);
            //The service response returns success true to make validation easier in the frontend
            return response
                .status(HttpStatus.OK)
                .json({ success: true, reply, reason: "" });
        } catch (error: any) {
            console.log(error);
            // In case of error, return a 400 status with the error message and log the error to console
            return response
                .status(HttpStatus.BAD_REQUEST)
                .json({ success: false, reply: "", reason: error.message || "Error" });
        }
  }
}
