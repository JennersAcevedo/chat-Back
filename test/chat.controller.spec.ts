import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from '../src/modules/chat/controller/chat.controller';
import { ChatService } from '../src/modules/chat/service/chat.service';
import { RateLimitGuard } from '../src/shared/guards/rate-limit.guard';
import { SendMessageDto } from '../src/modules/chat/dto/sendMessage.dto';
import { HttpStatus, BadRequestException } from '@nestjs/common';

describe('ChatController', () => {
  // Unit tests para ChatController
  let controller: ChatController;
  let chatService: ChatService;
  let rateLimitGuard: RateLimitGuard;

  // Objeto mock de respuesta
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
        {
          provide: RateLimitGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
    rateLimitGuard = module.get<RateLimitGuard>(RateLimitGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMessage', () => {
    it('debería enviar un mensaje exitosamente y retornar respuesta', async () => {
      // Preparar
      const sendMessageDto: SendMessageDto = { message: 'Hello World' };
      const expectedReply = 'Bot: HELLO WORLD';
      jest.spyOn(chatService, 'sendMessage').mockReturnValue(expectedReply);

      // Actuar
      await controller.sendMessage(mockResponse, sendMessageDto);

      // Verificar
      expect(chatService.sendMessage).toHaveBeenCalledWith(sendMessageDto);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        reply: expectedReply,
        reason: '',
      });
    });

    it('debería manejar errores del servicio graciosamente y retornar BAD_REQUEST', async () => {
      // Preparar
      const sendMessageDto: SendMessageDto = { message: 'Test message' };
      const error = new Error('Service error');
      jest.spyOn(chatService, 'sendMessage').mockImplementation(() => {
        throw error;
      });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Actuar
      await controller.sendMessage(mockResponse, sendMessageDto);

      // Verificar
      expect(chatService.sendMessage).toHaveBeenCalledWith(sendMessageDto);
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        reply: '',
        reason: 'Service error',
      });

      consoleSpy.mockRestore();
    });

    it('debería manejar errores del servicio sin mensaje y retornar error genérico', async () => {
      // Preparar
      const sendMessageDto: SendMessageDto = { message: 'Test message' };
      const error = new Error();
      jest.spyOn(chatService, 'sendMessage').mockImplementation(() => {
        throw error;
      });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Actuar
      await controller.sendMessage(mockResponse, sendMessageDto);

      // Verificar
      expect(chatService.sendMessage).toHaveBeenCalledWith(sendMessageDto);
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        reply: '',
        reason: 'Error',
      });

      consoleSpy.mockRestore();
    });

    it('debería manejar diferentes tipos de mensajes correctamente', async () => {
      // Preparar
      const testCases = [
        { input: 'hello', expected: 'Bot: HELLO' },
        { input: 'Test Message', expected: 'Bot: TEST MESSAGE' },
        { input: '123', expected: 'Bot: 123' },
        { input: 'special!@#$%', expected: 'Bot: SPECIAL!@#$%' },
      ];

      for (const testCase of testCases) {
        const sendMessageDto: SendMessageDto = { message: testCase.input };
        jest.spyOn(chatService, 'sendMessage').mockReturnValue(testCase.expected);

        // Actuar
        await controller.sendMessage(mockResponse, { message: testCase.input });

        // Verificar
        expect(chatService.sendMessage).toHaveBeenCalledWith({ message: testCase.input });
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          reply: testCase.expected,
          reason: '',
        });

        // Reiniciar mocks para la siguiente iteración
        jest.clearAllMocks();
        mockResponse.status.mockReturnThis();
        mockResponse.json.mockReturnThis();
      }
    });

    it('debería manejar mensajes solo con espacios en blanco', async () => {
      // Preparar
      const sendMessageDto: SendMessageDto = { message: '   ' };
      const expectedReply = 'Bot:    ';
      jest.spyOn(chatService, 'sendMessage').mockReturnValue(expectedReply);

      // Actuar
      await controller.sendMessage(mockResponse, sendMessageDto);

      // Verificar
      expect(chatService.sendMessage).toHaveBeenCalledWith(sendMessageDto);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        reply: expectedReply,
        reason: '',
      });
    });
  });

  describe('Integración de Rate Limiting', () => {
    it('debería verificar que el guard de rate limit está aplicado al endpoint', () => {
      // Este test verifica que el decorador RateLimitGuard está aplicado correctamente
      // El comportamiento real del rate limiting se prueba en los tests unitarios del guard
      const guards = Reflect.getMetadata('__guards__', controller.sendMessage);
      expect(guards).toContain(RateLimitGuard);
    });
  });

  describe('Integración del Objeto Response', () => {
    it('debería encadenar correctamente los métodos de respuesta', async () => {
      // Preparar
      const sendMessageDto: SendMessageDto = { message: 'Test' };
      const expectedReply = 'Bot: TEST';
      jest.spyOn(chatService, 'sendMessage').mockReturnValue(expectedReply);

      // Actuar
      await controller.sendMessage(mockResponse, sendMessageDto);

      // Verificar
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        reply: expectedReply,
        reason: '',
      });
    });

    it('debería manejar mutaciones del objeto response', async () => {
      // Preparar
      const sendMessageDto: SendMessageDto = { message: 'Test' };
      const expectedReply = 'Bot: TEST';
      jest.spyOn(chatService, 'sendMessage').mockReturnValue(expectedReply);
      
      // Crear un nuevo objeto response para cada test
      const newMockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      // Actuar
      await controller.sendMessage(newMockResponse, sendMessageDto);

      // Verificar
      expect(newMockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(newMockResponse.json).toHaveBeenCalledWith({
        success: true,
        reply: expectedReply,
        reason: '',
      });
    });
  });
});
