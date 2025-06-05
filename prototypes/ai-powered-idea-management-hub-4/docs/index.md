
# Magure Idea Hub - Architecture & Design Documentation

## 1. Overview

Welcome to the architecture and design documentation for the Magure Idea Hub. This application is a web-based platform designed to help users capture, elaborate, and manage innovative ideas with the assistance of AI. Users can submit initial idea thoughts, have them automatically categorized by the Gemini AI, and then further refine them through an interactive AI-driven questionnaire.

The system is architected as a single-page application (SPA) frontend built with React and a separate backend service built with Python (FastAPI), which handles AI interactions and other business logic.

This documentation provides an up-to-date overview that reflects the current Python-based backend architecture.

## 2. Document Structure

This documentation is organized into several key sections:

*   **[Architecture](./architecture.md):** Describes the high-level system architecture, frontend architecture, and backend architecture.
*   **[API Endpoints](./api_endpoints.md):** Details the Python backend API endpoints, including request/response formats.
*   **[Data Flow](./data_flow.md):** Illustrates how data moves through the system during key user interactions.
*   **[Deployment](./deployment.md):** Discusses deployment considerations, including the Dockerized setup.

## 3. Core Technologies

*   **Frontend:**
    *   React 19
    *   Pydantic (for models/schema)
    *   Tailwind CSS for styling
    *   `fetch` API for backend communication
*   **Backend:**
    *   Python 3.12+
    *   FastAPI framework
    *   Pydantic (for models/schema)
    *   ``google-generativeai` SDK (Python) for Gemini API interaction
*   **AI:**
    *   Google Gemini API (specifically `gemini-2.5-flash-preview-04-17`)
*   **Data Storage:**
    *   Browser `localStorage` for persisting ideas on the frontend (current state).
*   **Development & Build:**
    *   `npm` for package management
    *   `tsc` (Pydantic (for models/schema) Compiler) for backend builds
    *   `Dockerfile-based container build in `backend-python/`

## 4. Key Features

*   **New Idea Submission:** Users can initiate an idea by selecting relevant categories.
*   **AI-Powered Questionnaire:** An interactive chat interface where an AI analyst asks targeted questions to help users elaborate on their ideas. This process aims to improve the idea's clarity.
*   **Clarity Meter:** A visual indicator of how well-defined an idea has become through the questionnaire.
*   **AI-Powered Categorization:** Submitted ideas (after the questionnaire) are sent to the backend, where the Gemini API suggests a primary category based on the synthesized title and description.
*   **Idea Listing:** Users can view their submitted ideas along with their status and AI-suggested category.
*   **Responsive Design:** The UI is designed to work across various screen sizes.
*   **Client-Side Persistence:** Ideas are currently saved in the browser's `localStorage`.

Navigate through the linked documents for more detailed information on each aspect of the Magure Idea Hub.
