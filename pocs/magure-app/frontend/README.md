# Magure Frontend (NestJS)

This is the frontend service for the Magure application, built with NestJS and TypeScript.

## Features

- NestJS-based frontend
- TypeScript, Vite, Tailwind CSS
- Docker and docker-compose support

---

## Prerequisites

- Node.js 20+
- npm 9+
- (Recommended) Docker & docker-compose

---

## Local Development

1. **Clone the repository and navigate to frontend:**
   ```bash
   cd pocs/magure-app/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and update as needed (if `.env.example` exists).
   - Ensure your `.env` contains correct API/backend URLs.

4. **Run the development server:**
   ```bash
   npm run start
   ```
   - The app will be available at [http://localhost:3000](http://localhost:3000)

---

## Building for Production

```bash
npm run build
```
- Output will be in the `dist/` directory.

---

## Running with Docker

1. **Build and run the container:**
   ```bash
   docker run --rm -it -v $(pwd):/app -w /app -p 3000:3000 node:20-alpine sh -c "npm install && npm run build && npm run start"
   ```

---

## Running with Docker Compose (Recommended)

The project root contains a `docker-compose.yml` that orchestrates backend, frontend, and Postgres.

1. **Navigate to the project root:**
   ```bash
   cd pocs/magure-app
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:8000](http://localhost:8000)
   - Postgres: localhost:5432

3. **Environment variables:**
   - Frontend uses `frontend/.env` for configuration.
   - Ensure API URLs point to the backend service (e.g., `http://localhost:8000`).

---

## Useful Commands

- Lint code:  
  ```bash
  npm run lint
  ```
- Run tests:  
  ```bash
  npm run test
  ```

---

## Troubleshooting

- Ensure backend and database are running and accessible.
- Check `.env` for correct API/backend URLs.
- For Docker issues, rebuild images:  
  ```bash
  docker-compose build --no-cache
  ```

---

## License

[MIT] or as specified in the project root.
