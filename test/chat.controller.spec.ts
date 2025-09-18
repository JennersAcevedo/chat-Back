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
    it('should send a message successfully and return response', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'Hello World' };
      const expectedReply = 'Bot: HELLO WORLD';
      jest.spyOn(chatService, 'sendMessage').mockReturnValue(expectedReply);

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
      const sendMessageDto: SendMessageDto = { message: 'Test message' };
      const error = new Error('Service error');
      jest.spyOn(chatService, 'sendMessage').mockImplementation(() => {
        throw error;
      });
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
        reason: 'Service error',
      });

      consoleSpy.mockRestore();
    });

    it('should handle service errors without message and return generic error', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'Test message' };
      const error = new Error();
      jest.spyOn(chatService, 'sendMessage').mockImplementation(() => {
        throw error;
      });
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

    it('should handle different types of messages correctly', async () => {
      // Arrange
      const testCases = [
        { input: 'hello', expected: 'Bot: HELLO' },
        { input: 'Test Message', expected: 'Bot: TEST MESSAGE' },
        { input: '123', expected: 'Bot: 123' },
        { input: 'special!@#$%', expected: 'Bot: SPECIAL!@#$%' },
      ];

      for (const testCase of testCases) {
        const sendMessageDto: SendMessageDto = { message: testCase.input };
        jest.spyOn(chatService, 'sendMessage').mockReturnValue(testCase.expected);

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

    it('should handle messages with only whitespace', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: '   ' };
      const expectedReply = 'Bot:    ';
      jest.spyOn(chatService, 'sendMessage').mockReturnValue(expectedReply);

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
      // The actual rate limiting behavior is tested in the guard unit tests
      const guards = Reflect.getMetadata('__guards__', controller.sendMessage);
      expect(guards).toContain(RateLimitGuard);
    });
  });

  describe('Response Object Integration', () => {
    it('should chain response methods correctly', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'Test' };
      const expectedReply = 'Bot: TEST';
      jest.spyOn(chatService, 'sendMessage').mockReturnValue(expectedReply);

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
      const sendMessageDto: SendMessageDto = { message: 'Test' };
      const expectedReply = 'Bot: TEST';
      jest.spyOn(chatService, 'sendMessage').mockReturnValue(expectedReply);
      
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
