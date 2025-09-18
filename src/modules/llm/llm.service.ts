import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class LlmService {
    // LLM Service to generate responses using Google Gemini
    private readonly logger = new Logger(LlmService.name);
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.LLM_API_KEY;
        if (!apiKey) {
            this.logger.error('LLM_API_KEY is not configured in environment variables');
            throw new Error('LLM_API_KEY is required');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: process.env.LLM_MODEL || 'gemini-2.0-flash'  // if not set a model, use gemini-2.0-flash
        });
    }

    async generateResponse(userMessage: string): Promise<string> {
        try {
            const prompt = this.createDomainSpecificPrompt(userMessage);

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            this.logger.log(`Response generated for message: ${userMessage.substring(0, 50)}...`);
            return text;

        } catch (error) {
            this.logger.error('Error generating response with Gemini:', error);
            throw new Error('Error processing query with AI');
        }
    }

    // Create a domain specific prompt for the LLM
    private createDomainSpecificPrompt(userMessage: string): string {
        return `You are an expert in Dominican gastronomy with extensive knowledge about:

- Traditional Dominican dishes (mangu, locrio, moro, asopao, etc.)
- Dominican cooking techniques
- Typical and regional ingredients
- Dominican culinary history
- Dominican wines and pairings
- Family recipes and cooking secrets
- Gastronomic traditions by region
- Iconic restaurants and landmarks

Your goal is to help with questions related to Dominican gastronomy in a friendly, detailed and authentic way.

If the question is NOT related to Dominican gastronomy, respond politely:
"Sorry, I'm an expert specialized in Dominican gastronomy. Could you ask me a question about traditional dishes, ingredients, cooking techniques, or any topic related to Dominican food? I'd be happy to help you with that."

User question: ${userMessage}

Response:`;
    }
}
