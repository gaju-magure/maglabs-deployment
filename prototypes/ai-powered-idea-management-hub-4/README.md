# Magure Idea Hub

An AI-powered platform for capturing, elaborating, and managing innovative ideas. Users can submit initial thoughts and have them refined through an interactive AI-driven questionnaire system with automatic categorization.

## 🚀 Features

- **AI-Powered Questionnaire**: Interactive chat interface with AI analyst to elaborate ideas
- **Smart Categorization**: Automatic idea categorization using Google Gemini AI
- **Clarity Metrics**: Visual indicators showing idea development progress
- **User Authentication**: Secure authentication system with role-based access (Contributor, Evaluator, Admin)
- **Responsive Design**: Works seamlessly across all device sizes
- **Real-time Persistence**: Ideas saved with Supabase backend and browser localStorage

## 🏗️ Architecture

**Frontend**: React 19 + TypeScript SPA with Vite build system
**Backend**: Python FastAPI with Supabase PostgreSQL database
**Authentication**: Supabase Auth with JWT-based security
**AI Integration**: Google Gemini API for categorization and questionnaire analysis

## 📋 Prerequisites

- **Node.js** (v18+ recommended)
- **Python** 3.12+ (for backend development)
- **Supabase Account** (for authentication and database)
- **Google Gemini API Key** (for AI features)

## 🛠️ Quick Start

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The frontend will be available at `http://localhost:5173`

### Backend Development (Optional)

```bash
# Navigate to backend directory
cd backend-python

# Install Python dependencies
pip install -e .

# Start development server
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

## ⚙️ Environment Setup

### Frontend Configuration

Create `.env.local` in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend Configuration (if running locally)

Create `.env` in the `backend-python` directory:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# App Configuration
APP_ENV=development
LOG_LEVEL=INFO
```

## 🔐 Authentication Setup

The application uses Supabase for authentication with the following user roles:

- **Contributor**: Can submit and view their own ideas
- **Evaluator**: Can review and evaluate submitted ideas
- **Admin**: Full access to all ideas and user management

### Initial User Setup

1. Create a Supabase project
2. Run the provided SQL migrations in `supabase/migrations/` (see [Migration Guide](docs/guides/migrations.md))
3. Use the backend scripts to create initial users:

```bash
cd backend-python
python create_admin_user.py
python create_auth_user.py
```

## 🎯 User Workflow

1. **Login**: Authenticate with Supabase Auth
2. **Category Selection**: Choose relevant categories for your idea
3. **AI Questionnaire**: Interactive chat to elaborate on the idea
4. **Value Definition**: Assess potential value and effort (coming soon)
5. **Submission**: Idea is automatically categorized and stored
6. **Review**: Evaluators can review and manage submitted ideas

## 🧪 Development Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend (from backend-python/)
uvicorn app.main:app --reload  # Start development server
pytest                         # Run tests
black app/                     # Format code
ruff check app/               # Lint code
```

## 📁 Project Structure

```
├── README.md                 # Project documentation
├── CLAUDE.md                # Development guidance
├── package.json             # Frontend dependencies
├── vite.config.ts           # Vite configuration
├── index.html               # Main HTML template
├── App.tsx                  # Main application component
├── AuthContext.tsx          # Authentication context
├── types.ts                 # TypeScript type definitions
├── components/              # React components
├── services/                # API service layer
├── lib/                     # Utility libraries (Supabase client)
├── backend-python/          # Python FastAPI backend
│   ├── app/                 # Application code
│   ├── tests/               # Test suite
│   ├── pyproject.toml       # Python dependencies
│   └── Dockerfile           # Backend container
├── supabase/                # Database migrations
├── docs/                    # Documentation
└── public/                  # Static assets
```

## 🚀 Deployment

### Frontend (Netlify/Vercel)

1. Build the project: `npm run build`
2. Deploy the `dist/` directory
3. Set environment variables in your hosting platform

### Backend (Docker)

```bash
cd backend-python
docker build -t magure-idea-hub-backend .
docker run -p 8000:8000 --env-file .env magure-idea-hub-backend
```

### Full Stack (Docker Compose)

```bash
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📚 Documentation

- [Architecture Overview](docs/explanation/architecture.md)
- [API Documentation](docs/reference/api_endpoints.md)
- [Data Flow](docs/explanation/data_flow.md)
- [Deployment Guide](docs/guides/deployment.md)

## 🐛 Troubleshooting

### Frontend Issues

- **White page on load**: Check browser console for environment variable errors
- **Authentication failures**: Verify Supabase configuration in `.env.local`
- **Build errors**: Ensure all dependencies are installed with `npm install`

### Backend Issues

- **Database connection**: Verify Supabase credentials and database setup
- **AI features not working**: Check Gemini API key configuration
- **Import errors**: Ensure Python dependencies are installed: `pip install -e .`

## 📄 License

This project is proprietary software developed for Magure. All rights reserved.

## 🆘 Support

For technical support or questions:
- Review the [documentation](docs/)
- Check the [troubleshooting section](#-troubleshooting)
- Contact the development team

---

**Powered by React, FastAPI, Supabase, and Google Gemini AI**  
*© Magure 2025*