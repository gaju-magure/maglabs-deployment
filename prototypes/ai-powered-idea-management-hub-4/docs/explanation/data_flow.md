
# Data Flow Diagrams

This section describes the data flow for key user interactions within the Magure Idea Hub.

## 1. New Idea Submission & Initial Categorization

This flow covers the process from a user starting a new idea to it being listed with an AI-suggested category.

```mermaid
sequenceDiagram
    actor User
    participant FE_App as Frontend (App.tsx)
    participant FE_CategorySelector as CategorySelector
    participant FE_Questionnaire as Questionnaire
    participant FE_GeminiService as Frontend Service
    participant BE_Server as Backend Server
    participant Ext_GeminiAPI as Gemini API

    User->>FE_App: Clicks "Submit a New Idea"
    FE_App->>FE_App: Set workflowState = 'categorySelection'
    FE_App->>FE_CategorySelector: Render Category Selector
    User->>FE_CategorySelector: Selects categories
    User->>FE_CategorySelector: Clicks "Next: Ask Questions"
    FE_CategorySelector->>FE_App: onSubmit(selectedCategories)
    FE_App->>FE_App: Create CurrentQuestionnaireIdea (status: IN_QUESTIONNAIRE_CHAT)
    FE_App->>FE_App: Set workflowState = 'questionnaireChat'
    FE_App->>FE_Questionnaire: Render Questionnaire with ideaData

    Note over User, FE_Questionnaire: User interacts with AI chat
    loop Questionnaire Chat
        User->>FE_Questionnaire: Enters answer, Clicks "Send"
        FE_Questionnaire->>FE_App: onUpdate(updatedIdeaData with new message)
        FE_Questionnaire->>FE_GeminiService: evaluateAnswerAndSuggestNextStep(question, answer, chatHistory)
        FE_GeminiService->>BE_Server: POST /api/evaluate (question, answer, chatHistory)
        BE_Server->>Ext_GeminiAPI: generateContent (prompt for evaluation)
        Ext_GeminiAPI-->>BE_Server: Evaluation response (text)
        BE_Server-->>FE_GeminiService: JSON (type, aiResponseToUser, clarityDelta, etc.)
        FE_GeminiService-->>FE_Questionnaire: EvaluationResult
        FE_Questionnaire->>FE_App: onUpdate(updatedIdeaData with AI response, scores)
        FE_Questionnaire->>FE_Questionnaire: Displays AI response, potentially next question
    end
    User->>FE_Questionnaire: Completes all questions or indicates completion
    FE_Questionnaire->>FE_App: onComplete(finalizedChatData)

    FE_App->>FE_App: Set workflowState = 'valueDefinition' (Currently mock)
    Note over User, FE_App: User (mock) confirms value/effort
    User->>FE_App: Clicks "Proceed to Submit (Mock)"
    FE_App->>FE_App: handleValueEffortSubmit(finalizedIdeaData)
    FE_App->>FE_App: Synthesize title & description from answers
    FE_App->>FE_App: Add new Idea to 'ideas' list (status: UNDER_SCREENING, category_suggestion_loading: true)
    FE_App->>FE_App: Update UI (show submitting state)

    FE_App->>FE_GeminiService: categorizeIdeaWithGemini(title, description)
    FE_GeminiService->>BE_Server: POST /api/categorize (title, description)
    BE_Server->>Ext_GeminiAPI: generateContent (prompt for categorization)
    Ext_GeminiAPI-->>BE_Server: Category response (text)
    BE_Server-->>FE_GeminiService: JSON (category, confidence, error)
    FE_GeminiService-->>FE_App: CategorizationResult

    FE_App->>FE_App: Update Idea in 'ideas' list (tags, category_suggestion_loading: false, error?, status: SUBMITTED)
    FE_App->>FE_App: Update UI (show submitted state, then back to idle, display new idea in list)
    FE_App->>localStorage: Save updated 'ideas' list
```

## 2. Questionnaire Chat Interaction (Single Turn)

This focuses on a single exchange within the AI-driven questionnaire.

```mermaid
sequenceDiagram
    participant User
    participant FE_Questionnaire as Questionnaire UI
    participant FE_App as App.tsx (State)
    participant FE_GeminiService as Frontend Service (API Client)
    participant BE_Server as Backend Server
    participant Ext_GeminiAPI as Gemini API

    User->>FE_Questionnaire: Types answer to current AI question
    User->>FE_Questionnaire: Clicks "Send"
    FE_Questionnaire->>FE_Questionnaire: Adds user message to chat history (local UI update)
    FE_Questionnaire->>FE_Questionnaire: Shows "Thinking..." message
    FE_Questionnaire->>FE_App: onUpdate(ideaData with new user message, interactionState: USER_RESPONDED_AI_EVALUATING)

    FE_Questionnaire->>FE_GeminiService: evaluateAnswerAndSuggestNextStep(currentQuestion, userAnswer, chatHistory)
    FE_GeminiService->>BE_Server: POST /api/evaluate (payload: {mainQuestion, userAnswerText, fullChatHistory})
    
    alt API Key Missing or AI Error
        BE_Server-->>FE_GeminiService: JSON (mock/error EvaluationResult)
    else Gemini Call
        BE_Server->>Ext_GeminiAPI: generateContent(prompt_template)
        Ext_GeminiAPI-->>BE_Server: AI-generated text (evaluation and next step/clarification)
        BE_Server->>BE_Server: Parses AI text (PROCEED/CLARIFY, response, delta)
        BE_Server-->>FE_GeminiService: JSON (EvaluationResult: type, aiResponseToUser, finalAnswerForQuestion?, clarityMeterDelta)
    end

    FE_GeminiService-->>FE_Questionnaire: Returns Promise<EvaluationResult>
    FE_Questionnaire->>FE_Questionnaire: Receives EvaluationResult
    FE_Questionnaire->>FE_Questionnaire: Adds AI response message(s) to chat history
    FE_Questionnaire->>FE_Questionnaire: Updates currentSystemQuestionIndex if 'proceed' and not last Q
    FE_Questionnaire->>FE_Questionnaire: Updates answers list if 'proceed'
    FE_Questionnaire->>FE_App: onUpdate(ideaData with new AI messages, updated answers, new clarityScore, next interactionState)

    FE_App->>FE_App: Updates meterScores based on new clarityScore
    FE_App->>localStorage: (Implicitly via useEffect on 'ideas' state) Save updated idea details if questionnaire state is part of 'ideas' directly or when 'currentQuestionnaireIdea' is finalized.
```

## 3. Loading Ideas from LocalStorage

This flow describes how ideas are loaded when the application starts.

```mermaid
sequenceDiagram
    participant FE_App as App.tsx
    participant Browser_LocalStorage as localStorage

    FE_App->>FE_App: ComponentDidMount / useEffect []
    FE_App->>Browser_LocalStorage: getItem('ideas')
    Browser_LocalStorage-->>FE_App: Serialized ideas (string) or null
    alt Ideas Found
        FE_App->>FE_App: JSON.parse(serializedIdeas)
        FE_App->>FE_App: Transforms/hydrates data (e.g., Date objects)
        FE_App->>FE_App: setIdeas(parsedIdeas)
        FE_App->>FE_App: Renders IdeaList with loaded ideas
    else No Ideas or Error
        FE_App->>FE_App: setIdeas([])
        FE_App->>FE_App: Renders empty state for IdeaList
    end
```
These diagrams illustrate the primary interactions and data movements. The actual implementation involves React state updates and re-renders triggered by these flows.
