import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../src/modules/chat/service/chat.service';
import { SendMessageDto } from '../src/modules/chat/dto/sendMessage.dto';
import { LlmService } from '../src/modules/llm/llm.service';

describe('ChatService', () => {

  // Unit tests for ChatService
  let service: ChatService;
  let llmService: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: LlmService,
          useValue: {
            generateResponse: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    llmService = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should return LLM response for Dominican gastronomy query', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'How do you make a Dominican Mangu?' };
      const expectedResponse = '¡Claro que sí! Mangu is the quintessential Dominican breakfast, and it\'s surprisingly simple to make. Here\'s a breakdown of how to make a delicious, authentic Dominican Mangu...';
      jest.spyOn(llmService, 'generateResponse').mockResolvedValue(expectedResponse);

      // Act
      const result = await service.sendMessage(sendMessageDto);

      // Assert
      expect(llmService.generateResponse).toHaveBeenCalledWith(sendMessageDto.message);
      expect(result).toBe(expectedResponse);
    });

    it('should handle LLM errors and return error message', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'What do you need to make a locrio?' };
      const error = new Error('Gemini connection error');
      jest.spyOn(llmService, 'generateResponse').mockRejectedValue(error);

      // Act and Assert
      await expect(service.sendMessage(sendMessageDto)).rejects.toThrow(
        'I couldn\'t process your query at the moment. Please try again.'
      );
    });

    it('should process empty string message', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: '' };
      const expectedResponse = 'Sorry, I\'m an expert specialized in Dominican gastronomy. Could you ask me a question about traditional dishes, ingredients, cooking techniques, or any topic related to Dominican food? I\'d be happy to help you with that.';
      jest.spyOn(llmService, 'generateResponse').mockResolvedValue(expectedResponse);

      // Act
      const result = await service.sendMessage(sendMessageDto);

      // Assert
      expect(llmService.generateResponse).toHaveBeenCalledWith('');
      expect(result).toBe(expectedResponse);
    });

    it('should process message with special characters', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'Can you tell me more about asopao? ¡Urgente!' };
      const expectedResponse = '¡Claro que sí! Asopao is one of the most comforting and beloved dishes in Dominican cuisine. Think of it as a hearty, flavorful rice soup, but so much more than just that...';
      jest.spyOn(llmService, 'generateResponse').mockResolvedValue(expectedResponse);

      // Act
      const result = await service.sendMessage(sendMessageDto);

      // Assert
      expect(llmService.generateResponse).toHaveBeenCalledWith(sendMessageDto.message);
      expect(result).toBe(expectedResponse);
    });

    it('should process very long message', async () => {
      // Arrange
      const longMessage = 'What is the history of Dominican cuisine and how has it evolved over the years? ' + 'a'.repeat(500);
      const sendMessageDto: SendMessageDto = { message: longMessage };
      const expectedResponse = 'The history of Dominican cuisine is rich and diverse, reflecting the island\'s complex cultural heritage...';
      jest.spyOn(llmService, 'generateResponse').mockResolvedValue(expectedResponse);

      // Act
      const result = await service.sendMessage(sendMessageDto);

      // Assert
      expect(llmService.generateResponse).toHaveBeenCalledWith(longMessage);
      expect(result).toBe(expectedResponse);
    });

    it('should return string type', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'What do you need to make a locrio?' };
      const expectedResponse = 'Ah, locrio! One of the cornerstones of Dominican cuisine! It\'s more than just a rice dish; it\'s a celebration of flavors and ingredients all simmered together in one pot...';
      jest.spyOn(llmService, 'generateResponse').mockResolvedValue(expectedResponse);

      // Act
      const result = await service.sendMessage(sendMessageDto);

      // Assert
      expect(typeof result).toBe('string');
    });

    it('should call LLM service with correct message', async () => {
      // Arrange
      const sendMessageDto: SendMessageDto = { message: 'How do you make a Dominican Mangu?' };
      const expectedResponse = '¡Claro que sí! Mangu is the quintessential Dominican breakfast, and it\'s surprisingly simple to make. Here\'s a breakdown of how to make a delicious, authentic Dominican Mangu...';
      const generateResponseSpy = jest.spyOn(llmService, 'generateResponse').mockResolvedValue(expectedResponse);

      // Act
      await service.sendMessage(sendMessageDto);

      // Assert
      expect(generateResponseSpy).toHaveBeenCalledTimes(1);
      expect(generateResponseSpy).toHaveBeenCalledWith('How do you make a Dominican Mangu?');
    });
  });
});


