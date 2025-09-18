import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from '../src/modules/llm/llm.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the GoogleGenerativeAI module
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(),
}));

describe('LlmService', () => {
  // Unit tests for LlmService
  let service: LlmService;
  let mockModel: any;
  let mockGenAI: any;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up environment variables for testing
    process.env.LLM_API_KEY = 'test-api-key';
    process.env.LLM_MODEL = 'gemini-2.0-flash';

    // Create mock for the model
    mockModel = {
      generateContent: jest.fn(),
    };

    // Create mock for GoogleGenerativeAI
    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    };

    // Mock the constructor
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => mockGenAI);

    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmService],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with valid API key', () => {
      // Arrange
      process.env.LLM_API_KEY = 'valid-api-key';
      process.env.LLM_MODEL = 'gemini-2.0-flash';

      // Act
      const newService = new LlmService();

      // Assert
      expect(GoogleGenerativeAI).toHaveBeenCalledWith('valid-api-key');
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash',
      });
    });

    it('should use default model when LLM_MODEL is not set', () => {
      // Arrange
      process.env.LLM_API_KEY = 'valid-api-key';
      delete process.env.LLM_MODEL;

      // Act
      const newService = new LlmService();

      // Assert
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash',
      });
    });

    it('should throw error when API key is missing', () => {
      // Arrange
      const originalApiKey = process.env.LLM_API_KEY;
      delete process.env.LLM_API_KEY;

      // Act and Assert
      expect(() => new LlmService()).toThrow('LLM_API_KEY is required');

      // Restore
      process.env.LLM_API_KEY = originalApiKey;
    });

    it('should throw error when API key is empty', () => {
      // Arrange
      const originalApiKey = process.env.LLM_API_KEY;
      process.env.LLM_API_KEY = '';

      // Act and Assert
      expect(() => new LlmService()).toThrow('LLM_API_KEY is required');

      // Restore
      process.env.LLM_API_KEY = originalApiKey;
    });
  });

  describe('generateResponse', () => {
    beforeEach(() => {
      // Set up environment for tests
      process.env.LLM_API_KEY = 'test-api-key';
      process.env.LLM_MODEL = 'gemini-2.0-flash';
    });

    it('should generate response for Dominican gastronomy query', async () => {
      // Arrange
      const userMessage = 'How do you make a Dominican Mangu?';
      const expectedResponse = '¡Claro que sí! Mangu is the quintessential Dominican breakfast, and it\'s surprisingly simple to make. Here\'s a breakdown of how to make a delicious, authentic Dominican Mangu...';
      
      const mockResult = {
        response: {
          text: jest.fn().mockReturnValue(expectedResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      // Act
      const result = await service.generateResponse(userMessage);

      // Assert
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('You are an expert in Dominican gastronomy')
      );
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining(userMessage)
      );
      expect(result).toBe(expectedResponse);
    });

    it('should generate response for locrio query', async () => {
      // Arrange
      const userMessage = 'What do you need to make a locrio?';
      const expectedResponse = 'Ah, locrio! One of the cornerstones of Dominican cuisine! It\'s more than just a rice dish; it\'s a celebration of flavors and ingredients all simmered together in one pot. Here\'s what you\'ll need to make a delicious locrio...';
      
      const mockResult = {
        response: {
          text: jest.fn().mockReturnValue(expectedResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      // Act
      const result = await service.generateResponse(userMessage);

      // Assert
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Dominican gastronomy')
      );
      expect(result).toBe(expectedResponse);
    });

    it('should handle empty message', async () => {
      // Arrange
      const userMessage = '';
      const expectedResponse = 'Sorry, I\'m an expert specialized in Dominican gastronomy. Could you ask me a question about traditional dishes, ingredients, cooking techniques, or any topic related to Dominican food? I\'d be happy to help you with that.';
      
      const mockResult = {
        response: {
          text: jest.fn().mockReturnValue(expectedResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      // Act
      const result = await service.generateResponse(userMessage);

      // Assert
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('User question: ')
      );
      expect(result).toBe(expectedResponse);
    });

    it('should handle special characters in message', async () => {
      // Arrange
      const userMessage = 'Can you tell me more about asopao? ¡Urgente!';
      const expectedResponse = '¡Claro que sí! Asopao is one of the most comforting and beloved dishes in Dominican cuisine. Think of it as a hearty, flavorful rice soup, but so much more than just that...';
      
      const mockResult = {
        response: {
          text: jest.fn().mockReturnValue(expectedResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      // Act
      const result = await service.generateResponse(userMessage);

      // Assert
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining(userMessage)
      );
      expect(result).toBe(expectedResponse);
    });

    it('should handle very long message', async () => {
      // Arrange
      const longMessage = 'What is the history of Dominican cuisine and how has it evolved? ' + 'a'.repeat(1000);
      const expectedResponse = 'The history of Dominican cuisine is rich and diverse...';
      
      const mockResult = {
        response: {
          text: jest.fn().mockReturnValue(expectedResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      // Act
      const result = await service.generateResponse(longMessage);

      // Assert
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining(longMessage)
      );
      expect(result).toBe(expectedResponse);
    });

    it('should throw error when Gemini API fails', async () => {
      // Arrange
      const userMessage = 'How to make moro?';
      const error = new Error('API connection failed');
      mockModel.generateContent.mockRejectedValue(error);

      // Act and Assert
      await expect(service.generateResponse(userMessage)).rejects.toThrow(
        'Error processing query with AI'
      );
    });

    it('should throw error when response is invalid', async () => {
      // Arrange
      const userMessage = 'What is sancocho?';
      const mockResult = {
        response: {
          text: jest.fn().mockImplementation(() => {
            throw new Error('Invalid response format');
          }),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      // Act and Assert
      await expect(service.generateResponse(userMessage)).rejects.toThrow(
        'Error processing query with AI'
      );
    });

    it('should return string type', async () => {
      // Arrange
      const userMessage = 'How to make tostones?';
      const expectedResponse = 'To make tostones, you need green plantains...';
      
      const mockResult = {
        response: {
          text: jest.fn().mockReturnValue(expectedResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      // Act
      const result = await service.generateResponse(userMessage);

      // Assert
      expect(typeof result).toBe('string');
    });

    it('should call generateContent with correct prompt structure', async () => {
      // Arrange
      const userMessage = 'How do you make a Dominican Mangu?';
      const expectedResponse = '¡Claro que sí! Mangu is the quintessential Dominican breakfast, and it\'s surprisingly simple to make. Here\'s a breakdown of how to make a delicious, authentic Dominican Mangu...';
      
      const mockResult = {
        response: {
          text: jest.fn().mockReturnValue(expectedResponse),
        },
      };
      mockModel.generateContent.mockResolvedValue(mockResult);

      // Act
      await service.generateResponse(userMessage);

      // Assert
      expect(mockModel.generateContent).toHaveBeenCalledTimes(1);
      const prompt = mockModel.generateContent.mock.calls[0][0];
      expect(prompt).toContain('You are an expert in Dominican gastronomy');
      expect(prompt).toContain('Traditional Dominican dishes');
      expect(prompt).toContain('mangu, locrio, moro, asopao');
      expect(prompt).toContain('User question: ' + userMessage);
      expect(prompt).toContain('Response:');
    });
  });

  describe('createDomainSpecificPrompt', () => {
    it('should create prompt with Dominican gastronomy focus', () => {
      // Arrange
      const userMessage = 'How do you make a Dominican Mangu?';

      // Act
      const result = (service as any).createDomainSpecificPrompt(userMessage);

      // Assert
      expect(result).toContain('You are an expert in Dominican gastronomy');
      expect(result).toContain('Traditional Dominican dishes (mangu, locrio, moro, asopao, etc.)');
      expect(result).toContain('Dominican cooking techniques');
      expect(result).toContain('Typical and regional ingredients');
      expect(result).toContain('Dominican culinary history');
      expect(result).toContain('Dominican wines and pairings');
      expect(result).toContain('Family recipes and cooking secrets');
      expect(result).toContain('Gastronomic traditions by region');
      expect(result).toContain('Iconic restaurants and landmarks');
      expect(result).toContain('User question: ' + userMessage);
      expect(result).toContain('Response:');
    });

    it('should include off-topic response instruction', () => {
      // Arrange
      const userMessage = 'How to program in JavaScript?';

      // Act
      const result = (service as any).createDomainSpecificPrompt(userMessage);

      // Assert
      expect(result).toContain('If the question is NOT related to Dominican gastronomy, respond politely:');
      expect(result).toContain('Sorry, I\'m an expert specialized in Dominican gastronomy');
      expect(result).toContain('Could you ask me a question about traditional dishes, ingredients, cooking techniques, or any topic related to Dominican food?');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.LLM_API_KEY = 'test-api-key';
    });

    it('should handle network timeout error', async () => {
      // Arrange
      const userMessage = 'How to make pastelitos?';
      const timeoutError = new Error('Request timeout');
      mockModel.generateContent.mockRejectedValue(timeoutError);

      // Act and Assert
      await expect(service.generateResponse(userMessage)).rejects.toThrow(
        'Error processing query with AI'
      );
    });

    it('should handle quota exceeded error', async () => {
      // Arrange
      const userMessage = 'What is mangú?';
      const quotaError = new Error('QUOTA_EXCEEDED');
      mockModel.generateContent.mockRejectedValue(quotaError);

      // Act and Assert
      await expect(service.generateResponse(userMessage)).rejects.toThrow(
        'Error processing query with AI'
      );
    });

    it('should handle invalid API key error', async () => {
      // Arrange
      const userMessage = 'How to make empanadas?';
      const authError = new Error('API_KEY_INVALID');
      mockModel.generateContent.mockRejectedValue(authError);

      // Act and Assert
      await expect(service.generateResponse(userMessage)).rejects.toThrow(
        'Error processing query with AI'
      );
    });
  });

  describe('Integration with GoogleGenerativeAI', () => {
    it('should properly initialize GoogleGenerativeAI with API key', () => {
      // Arrange
      process.env.LLM_API_KEY = 'test-integration-key';
      process.env.LLM_MODEL = 'gemini-2.0-flash';

      // Act
      new LlmService();

      // Assert
      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-integration-key');
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash',
      });
    });

    it('should use different model when specified', () => {
      // Arrange
      process.env.LLM_API_KEY = 'test-key';
      process.env.LLM_MODEL = 'gemini-1.5-pro';

      // Act
      new LlmService();

      // Assert
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-1.5-pro',
      });
    });
  });
});
