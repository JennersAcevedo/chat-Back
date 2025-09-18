import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../src/modules/chat/service/chat.service';
import { SendMessageDto } from '../src/modules/chat/dto/sendMessage.dto';

describe('ChatService', () => {

  // Unit tests for ChatService
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should return message in uppercase with Bot prefix', () => {
      const sendMessageDto: SendMessageDto = { message: 'hello world' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO WORLD');
    });

    it('should handle empty string message', () => {
      const sendMessageDto: SendMessageDto = { message: '' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: ');
    });

    it('should handle single character message', () => {
      const sendMessageDto: SendMessageDto = { message: 'a' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: A');
    });

    it('should handle numbers in the message', () => {
      const sendMessageDto: SendMessageDto = { message: '123' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: 123');
    });

    it('should handle special characters in the message', () => {
      const sendMessageDto: SendMessageDto = { message: 'hello!@#$%^&*()' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO!@#$%^&*()');
    });

    it('should handle message already in uppercase', () => {
      const sendMessageDto: SendMessageDto = { message: 'HELLO WORLD' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO WORLD');
    });

    it('should handle message with mixed uppercase and lowercase', () => {
      const sendMessageDto: SendMessageDto = { message: 'HeLLo WoRLd' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO WORLD');
    });

    it('should handle message with spaces', () => {
      const sendMessageDto: SendMessageDto = { message: '  hello world  ' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot:   HELLO WORLD  ');
    });

    it('should handle message with line breaks', () => {
      const sendMessageDto: SendMessageDto = { message: 'hello\nworld' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO\nWORLD');
    });

    it('should handle message with tabs', () => {
      const sendMessageDto: SendMessageDto = { message: 'hello\tworld' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO\tWORLD');
    });

    it('should handle unicode characters', () => {
      const sendMessageDto: SendMessageDto = { message: 'hello ñoño' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO ÑOÑO');
    });

    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(1000);
      const sendMessageDto: SendMessageDto = { message: longMessage };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe(`Bot: ${longMessage.toUpperCase()}`);
    });

    it('should be a pure function (no side effects)', () => {
      const sendMessageDto: SendMessageDto = { message: 'test' };
      const originalMessage = sendMessageDto.message;
      service.sendMessage(sendMessageDto);
      expect(sendMessageDto.message).toBe(originalMessage);
    });

    it('should return string type', () => {
      const sendMessageDto: SendMessageDto = { message: 'test' };
      const result = service.sendMessage(sendMessageDto);
      expect(typeof result).toBe('string');
    });
  });
});


