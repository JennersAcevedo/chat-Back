import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../src/modules/chat/service/chat.service';
import { SendMessageDto } from '../src/modules/chat/dto/sendMessage.dto';

describe('ChatService', () => {

  // Unit tests para ChatService
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
    it('debería retornar mensaje en mayúsculas con prefijo Bot', () => {
      const sendMessageDto: SendMessageDto = { message: 'hello world' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO WORLD');
    });

    it('debería manejar mensaje de cadena vacía', () => {
      const sendMessageDto: SendMessageDto = { message: '' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: ');
    });

    it('debería manejar mensaje de un solo carácter', () => {
      const sendMessageDto: SendMessageDto = { message: 'a' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: A');
    });

    it('debería manejar números en el mensaje', () => {
      const sendMessageDto: SendMessageDto = { message: '123' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: 123');
    });

    it('debería manejar caracteres especiales en el mensaje', () => {
      const sendMessageDto: SendMessageDto = { message: 'hello!@#$%^&*()' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO!@#$%^&*()');
    });

    it('debería manejar mensaje ya en mayúsculas', () => {
      const sendMessageDto: SendMessageDto = { message: 'HELLO WORLD' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO WORLD');
    });

    it('debería manejar mensaje con mayúsculas y minúsculas mixtas', () => {
      const sendMessageDto: SendMessageDto = { message: 'HeLLo WoRLd' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO WORLD');
    });

    it('debería manejar mensaje con espacios', () => {
      const sendMessageDto: SendMessageDto = { message: '  hello world  ' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot:   HELLO WORLD  ');
    });

    it('debería manejar mensaje con saltos de línea', () => {
      const sendMessageDto: SendMessageDto = { message: 'hello\nworld' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO\nWORLD');
    });

    it('debería manejar mensaje con tabulaciones', () => {
      const sendMessageDto: SendMessageDto = { message: 'hello\tworld' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO\tWORLD');
    });

    it('debería manejar caracteres unicode', () => {
      const sendMessageDto: SendMessageDto = { message: 'hello ñoño' };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe('Bot: HELLO ÑOÑO');
    });

    it('debería manejar mensaje muy largo', () => {
      const longMessage = 'a'.repeat(1000);
      const sendMessageDto: SendMessageDto = { message: longMessage };
      const result = service.sendMessage(sendMessageDto);
      expect(result).toBe(`Bot: ${longMessage.toUpperCase()}`);
    });

    it('debería ser una función pura (sin efectos secundarios)', () => {
      const sendMessageDto: SendMessageDto = { message: 'test' };
      const originalMessage = sendMessageDto.message;
      service.sendMessage(sendMessageDto);
      expect(sendMessageDto.message).toBe(originalMessage);
    });

    it('debería retornar tipo string', () => {
      const sendMessageDto: SendMessageDto = { message: 'test' };
      const result = service.sendMessage(sendMessageDto);
      expect(typeof result).toBe('string');
    });
  });
});


