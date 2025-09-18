# Chat App with Google Gemini LLM

## Features

- **Integration with Google Gemini**: Intelligent responses using AI
- **Specialization in Dominican Gastronomy**: Expert in traditional Dominican cuisine
- **Input Validation**: DTOs to validate messages
- **Error Handling**: Friendly responses in case of errors

##  Setup

### Environment Variables

Create a `.env` file in the project root:

```bash
# Server configuration
PORT=3000

# CORS configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Google Gemini configuration
LLM_API_KEY = 'AIzaSyCOxLmX0_yAolMzX6QA1c1Cl8NerGKIgRw'
LLM_MODEL = 'gemini-2.0-flash'
```

### Obtaining Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an account or log in
3. Generate a new API key
4. Copy the key and paste it into your `.env` file

## 🏃‍♂️ Installation and Running

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run in production mode
npm run start:prod

# Run tests
npm test
```

## API Endpoints

### POST /chat

Send a message to the chatbot specialized in Argentine gastronomy.

### Request
```json
{
  "message": "How do you make an Argentine asado?"
}
```

### Response (Success):**
```json
{
  "success": true,
  "reply": "To make a traditional Argentine asado you need...",
  "reason": ""
}
```

### Response (Error):**
```json
{
  "success": false,
  "reply": "",
  "reason": "Rate limit exceeded (10 requests per minute), please try again later"
}
```


### Example Queries

### Valid queries
- "How do you make a Dominican Mangu?"
- "What do you need to make a locrio?"
- "Can you tell me more about asopao?"

### Valid Responses:
- ¡Claro que sí! Mangu is the quintessential Dominican breakfast, and it's surprisingly simple to make. Here's a breakdown of how to make a delicious, authentic Dominican Mangu:

**Ingredients:**

*   **Plantains:** 3-4 green plantains (they should be very firm and green, with minimal yellowing).
*   **Water:** Enough to cover the plantains in a pot.
*   **Salt:** To taste (usually about 1 teaspoon, but adjust according to your preference).
*   **Butter or Olive Oil:** For mashing (about 2 tablespoons) - *Dominicans traditionally use butter, but some prefer the flavor of olive oil. It's your choice!*
*   **Optional additions (for extra flavor):** A clove of garlic, minced, added to the boiling water.


- Ah, locrio! One of the cornerstones of Dominican cuisine! It's more than just a rice dish; it's a celebration of flavors and ingredients all simmered together in one pot. Here's what you'll need to make a delicious locrio:

**The Essentials (Base Ingredients):**

*   **Rice:** This is the star, of course! Use a medium-grain rice, like a parboiled or long-grain variety. Dominican rice is usually a "grano mediano" type, but you can also use a quality long-grain. Avoid using short-grain rice (like sushi rice) as it will become too sticky.
*   **Meat or Seafood:** Locrio is incredibly versatile and can be made with 


- ¡Claro que sí! Asopao is one of the most comforting and beloved dishes in Dominican cuisine. Think of it as a hearty, flavorful rice soup, but so much more than just that. Here's a deeper dive:

**What is Asopao?**

At its heart, asopao is a soupy rice dish. The key to a great asopao is that the rice absorbs a lot of the flavorful broth, creating a comforting and thick consistency. It's not quite a soup, not quite a stew, but something in between.


### Off-topic queries:**
- "How to program in JavaScript?"
- "What is the capital of France?"
- "How to fix a computer?"

##  Rate Limiting

- **Per minute limit**: 10 requests per minute per IP (vs 15 of the free limit)
- **Daily limit**: 180 requests per day per IP (vs 200 of the free limit)
- **Error messages**: 
  - "Rate limit exceeded (10 requests per minute), please try again later"
  - "Daily limit exceeded (180 requests per day), please try again tomorrow"
- **Status code**: 400 Bad Request

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## Architecture

```
src/
├── modules/
│   ├── chat/
│   │   ├── controller/     # ChatController
│   │   ├── service/        # ChatService
│   │   └── dto/           # SendMessageDto
│   └── llm/
│       ├── llm.service.ts  # LlmService (Google Gemini)
│       └── llm.module.ts   # LlmModule
├── shared/
│   └── guards/
│       └── rate-limit.guard.ts
└── main.ts
```


## Error Handling

1. **Missing API Key**: Error initializing LlmService
2. **Connection error with Gemini**: Friendly error message
3. **Rate limit exceeded**: "Limit exceeded, please try again later"
4. **Validation failed**: DTO validation error

## Logs

The system includes detailed logging:
- Message processing
- LLM responses
- Errors and exceptions
- Rate limiting

## Data Flow

1. **Client** sends message → **ChatController**
2. **ChatController** validates with **RateLimitGuard**
3. **ChatController** calls **ChatService**
4. **ChatService** calls **LlmService**
5. **LlmService** queries **Google Gemini**
6. **Response** returns through the same chain
7. **Client** receives specialized response
