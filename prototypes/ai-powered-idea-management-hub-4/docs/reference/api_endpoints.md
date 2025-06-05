
# Backend API Endpoints

The backend service exposes RESTful API endpoints for the frontend to consume. All endpoints are prefixed with `/api`.

## Base URL

The backend server typically runs on `http://localhost:3001` during development. The frontend makes requests to relative paths like `/api/endpoint`, assuming a proxy setup in production or that the backend is served under the `/api` path of the same domain.

## Common Practices

*   **Content Type:** All requests and responses with bodies use `application/json`.
*   **Error Handling:**
    *   If an API call to Gemini or an internal process fails, the backend attempts to return a `200 OK` status but includes an `error` field in the JSON response. This allows the frontend to handle "application-level" errors gracefully.
    *   Critical server errors or malformed requests might result in `4xx` or `5xx` status codes. The global error handler returns a generic `500` error for unhandled exceptions.

---

## 1. Categorize Idea

*   **Endpoint:** `POST /api/categorize`
*   **Description:** Takes an idea's title and description, and uses the Gemini API to suggest a category for it.
*   **Request Body:**
    ```json
    {
      "title": "string",       // Title of the idea
      "description": "string"  // Description of the idea
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "category": "IdeaCategoryEnum", // e.g., "Product Innovation", "Uncategorized"
      "confidence": "number" (optional), // Mocked confidence score (e.g., 0.85)
      "error": "string" (optional)      // Message if categorization faced issues but didn't critically fail
    }
    ```
    *Example:*
    ```json
    {
      "category": "Technological Innovation",
      "confidence": 0.85
    }
    ```
    *Example with error:*
    ```json
    {
      "category": "Uncategorized",
      "error": "AI could not determine a valid category."
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If `title` or `description` is missing.
      ```json
      { "error": "Missing title or description" }
      ```
    *   `500 Internal Server Error`: For unexpected server-side errors.

---

## 2. Evaluate Answer and Suggest Next Step

*   **Endpoint:** `POST /api/evaluate`
*   **Description:** Evaluates a user's answer to a questionnaire question using the Gemini API. It determines whether to proceed to the next question or ask for clarification, and provides an AI response.
*   **Request Body:**
    ```json
    {
      "mainQuestion": {       // The Question object (from types.ts) the user is answering
        "id": "string",
        "stage": "number",    // 1, 2, or 3
        "theme": "string",
        "text": "string",
        "isMandatory": "boolean" (optional)
      },
      "userAnswerText": "string", // The user's textual answer
      "fullChatHistory": [      // Optional: Array of ChatMessage objects (from types.ts)
        {
          "id": "string",
          "sender": "'user' | 'ai'",
          "text": "string",
          "timestamp": "Date" // ISO Date string
        }
        // ... more messages
      ]
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "type": "'proceed' | 'clarify'",         // AI's decision
      "aiResponseToUser": "string",           // Text to display to the user from the AI
      "finalAnswerForQuestion": "string" (optional), // If type is 'proceed', a refined/summarized version of user's answer
      "clarityMeterDelta": "number",          // Value between 0.0 and 0.3 indicating clarity change
      "error": "string" (optional)             // Message if evaluation faced issues
    }
    ```
    *Example (Proceed):*
    ```json
    {
      "type": "proceed",
      "aiResponseToUser": "Got it, that's helpful for understanding 'Core Idea & Problem'. Thanks!",
      "finalAnswerForQuestion": "The core idea is a solar-powered widget that solves energy waste.",
      "clarityMeterDelta": 0.25
    }
    ```
    *Example (Clarify):*
    ```json
    {
      "type": "clarify",
      "aiResponseToUser": "That's a bit brief. Could you please expand a little on that for 'Core Idea & Problem'?",
      "clarityMeterDelta": 0.05
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If `mainQuestion` or `userAnswerText` is missing.
      ```json
      { "error": "Missing mainQuestion or userAnswerText" }
      ```
    *   `500 Internal Server Error`: For unexpected server-side errors.

---

The type definitions `IdeaCategoryEnum`, `Question`, and `ChatMessage` are defined in `types.ts` in the frontend project and are conceptually used by the backend. For a robust setup, these types might be shared in a common library or duplicated.
