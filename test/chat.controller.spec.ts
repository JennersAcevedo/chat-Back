import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from '../src/modules/chat/controller/chat.controller';
import { ChatService } from '../src/modules/chat/service/chat.service';
import { RateLimitGuard } from '../src/shared/guards/rate-limit.guard';
import { SendMessageDto } from '../src/modules/chat/dto/sendMessage.dto';
import { HttpStatus, BadRequestException } from '@nestjs/common';

describe('ChatController', () => {
  // Unit tests for ChatController
  let controller: ChatController;
  let chatService: ChatService;
  let rateLimitGuard: RateLimitGuard;

  // Mock response object
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
          provide: 'LlmService',
          useValue: {
            generateResponse: jest.fn(),
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
    it('should successfully send a message and return LLM response', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'How do you make a Dominican Mangu?' };
      const expectedReply = '¡Claro que sí! Mangu is the quintessential Dominican breakfast, and it\'s surprisingly simple to make...';
      jest.spyOn(chatService, 'sendMessage').mockResolvedValue(expectedReply);

      // Act
      await controller.sendMessage(mockResponse, sendMessageDto);

      // Assert
      expect(chatService.sendMessage).toHaveBeenCalledWith(sendMessageDto);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        reply: expectedReply,
        reason: '',
      });
    });

    it('should handle service errors gracefully and return BAD_REQUEST', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'What do you need to make a locrio?' };
      const error = new Error('Gemini connection error');
      jest.spyOn(chatService, 'sendMessage').mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await controller.sendMessage(mockResponse, sendMessageDto);

      // Assert
      expect(chatService.sendMessage).toHaveBeenCalledWith(sendMessageDto);
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        reply: '',
        reason: 'Gemini connection error',
      });

      consoleSpy.mockRestore();
    });

    it('should handle service errors without message and return generic error', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'Can you tell me more about asopao?' };
      const error = new Error();
      jest.spyOn(chatService, 'sendMessage').mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await controller.sendMessage(mockResponse, sendMessageDto);

      // Assert
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

    it('should handle different types of Dominican gastronomy queries', async () => {
      // Arrange
      const testCases = [
        { input: 'How do you make a Dominican Mangu?', expected: '¡Claro que sí! Mangu is the quintessential Dominican breakfast...' },
        { input: 'What do you need to make a locrio?', expected: 'Ah, locrio! One of the cornerstones of Dominican cuisine! It\'s more than just a rice dish...' },
        { input: 'Can you tell me more about asopao?', expected: '¡Claro que sí! Asopao is one of the most comforting and beloved dishes in Dominican cuisine...' },
      ];

      for (const testCase of testCases) {
        const sendMessageDto: SendMessageDto = { message: testCase.input };
        jest.spyOn(chatService, 'sendMessage').mockResolvedValue(testCase.expected);

        // Act
        await controller.sendMessage(mockResponse, { message: testCase.input });

        // Assert
        expect(chatService.sendMessage).toHaveBeenCalledWith({ message: testCase.input });
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          reply: testCase.expected,
          reason: '',
        });

        // Reset mocks for next iteration
        jest.clearAllMocks();
        mockResponse.status.mockReturnThis();
        mockResponse.json.mockReturnThis();
      }
    });

    it('should handle whitespace-only messages', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: '   ' };
      const expectedReply = 'Sorry, I\'m an expert specialized in Dominican gastronomy. Could you ask me a question about traditional dishes, ingredients, cooking techniques, or any topic related to Dominican food? I\'d be happy to help you with that.';
      jest.spyOn(chatService, 'sendMessage').mockResolvedValue(expectedReply);

      // Act
      await controller.sendMessage(mockResponse, sendMessageDto);

      // Assert
      expect(chatService.sendMessage).toHaveBeenCalledWith(sendMessageDto);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        reply: expectedReply,
        reason: '',
      });
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should verify that the rate limit guard is applied to the endpoint', () => {
      // This test verifies that the RateLimitGuard decorator is applied correctly
      // The actual rate limiting behavior is tested in the guard's unit tests
      const guards = Reflect.getMetadata('__guards__', controller.sendMessage);
      expect(guards).toContain(RateLimitGuard);
    });
  });

  describe('Response Object Integration', () => {
    it('should properly chain response methods', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'Can you tell me more about asopao?' };
      const expectedReply = '¡Claro que sí! Asopao is one of the most comforting and beloved dishes in Dominican cuisine. Think of it as a hearty, flavorful rice soup...';
      jest.spyOn(chatService, 'sendMessage').mockResolvedValue(expectedReply);

      // Act
      await controller.sendMessage(mockResponse, sendMessageDto);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        reply: expectedReply,
        reason: '',
      });
    });

    it('should handle response object mutations', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'What is Mangu?' };
      const expectedReply = '¡Claro que sí! Mangu is the quintessential Dominican breakfast, and it\'s surprisingly simple to make. Here\'s a breakdown of how to make a delicious, authentic Dominican Mangu...';
      jest.spyOn(chatService, 'sendMessage').mockResolvedValue(expectedReply);
      
      // Create a new response object for each test
      const newMockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      // Act
      await controller.sendMessage(newMockResponse, sendMessageDto);

      // Assert
      expect(newMockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(newMockResponse.json).toHaveBeenCalledWith({
        success: true,
        reply: expectedReply,
        reason: '',
      });
    });
  });
});
