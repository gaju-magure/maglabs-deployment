# AI-Powered Idea Management Hub - Demo Setup Guide

This guide shows you how to run the system in demo mode using Docker Compose with mock authentication - perfect for demonstrations, testing, or development without needing real Supabase accounts.

## 🎭 Demo Mode Features

- **No Real Authentication Required** - Uses mock users instead of Supabase auth
- **Pre-configured Demo Users** - 4 different user roles ready to test
- **Quick Role Switching** - Instantly switch between user types
- **Full Feature Access** - All system features work in demo mode
- **Persistent Demo Sessions** - Demo login persists in browser storage

## 🚀 Quick Start

### 1. Enable Demo Mode

Create or update your `.env.local` file in the project root:

```bash
# Frontend Demo Mode
VITE_DEMO_MODE=true

# Supabase Config (still needed for backend, but won't be used for auth)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
VITE_API_BASE_URL=/api
```

### 2. Start the Docker Stack

```bash
# Start all services
docker compose up -d

# View logs (optional)
docker compose logs -f
```

### 3. Access the Demo

Open your browser to: **http://localhost:8080**

## 👥 Demo Users

The system comes with 4 pre-configured demo users:

| Email | Password | Role | Access Level |
|-------|----------|------|-------------|
| `contributor@demo.com` | `demo` | Contributor | Submit ideas, view own ideas |
| `evaluator@demo.com` | `demo` | Evaluator | Review & evaluate ideas |
| `admin@demo.com` | `demo` | Admin | Full system access |
| `manager@demo.com` | `demo` | Manager | Contributor + Evaluator roles |

## 🔐 Demo Authentication Options

### Option 1: Standard Demo Login
1. Go to the login page
2. Enter any demo user email (e.g., `admin@demo.com`)
3. Enter `demo` as the password
4. Click "Sign In"

### Option 2: Quick Demo Login (if available)
Some builds may include quick demo buttons for instant role switching.

### Option 3: Auto-Login Setup
You can modify the frontend to auto-login for unattended demos:

```typescript
// Add to AuthContext.tsx initialization for auto-demo login
useEffect(() => {
  if (isDemoMode && !currentUser && !isLoading) {
    // Auto-login as admin for demos
    quickDemoLogin?.(UserRole.ADMIN);
  }
}, [isDemoMode, currentUser, isLoading]);
```

## 🛠️ Docker Services

The demo stack includes:

- **Frontend** (Port 3000): React app with demo mode enabled
- **Backend** (Port 8000): Python FastAPI with full API
- **Nginx Proxy** (Port 8080): Main entry point routing traffic
- **Network**: All services communicate via Docker bridge network

## 🌐 Service URLs

- **Main Application**: http://localhost:8080
- **Frontend Direct**: http://localhost:3000  
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🎮 Demo Workflow

### For Contributors:
1. Login as `contributor@demo.com`
2. Submit new ideas via the idea form
3. View your submitted ideas
4. Edit/update your ideas

### For Evaluators:
1. Login as `evaluator@demo.com`
2. Browse submitted ideas
3. Evaluate ideas with scores and feedback
4. View evaluation dashboard

### For Admins:
1. Login as `admin@demo.com`
2. Access all system features
3. Manage users and ideas
4. View system analytics

### For Managers:
1. Login as `manager@demo.com`
2. Submit ideas (Contributor role)
3. Evaluate ideas (Evaluator role)
4. Demonstrate multi-role functionality

## 🔧 Troubleshooting

### Demo Mode Not Working
```bash
# Check environment variables are loaded
docker compose exec frontend env | grep VITE_DEMO_MODE

# Should show: VITE_DEMO_MODE=true
```

### Can't Access Services
```bash
# Check all services are running
docker compose ps

# Check logs for errors
docker compose logs frontend
docker compose logs backend
docker compose logs nginx_proxy
```

### Backend API Issues
```bash
# Test backend directly
curl http://localhost:8000/health

# Check backend logs
docker compose logs backend
```

### Frontend Build Issues
```bash
# Rebuild frontend with demo mode
docker compose build frontend
docker compose up -d frontend
```

## 🔄 Switching Between Demo and Production

### Enable Demo Mode:
```bash
# Update .env.local
echo "VITE_DEMO_MODE=true" > .env.local

# Restart services
docker compose restart frontend
```

### Disable Demo Mode:
```bash
# Update .env.local
echo "VITE_DEMO_MODE=false" > .env.local

# Restart services  
docker compose restart frontend
```

## 📱 Demo Script

For presentations, here's a suggested demo flow:

1. **Start as Contributor** (`contributor@demo.com`)
   - Show idea submission process
   - Demonstrate form validation
   - Submit 2-3 sample ideas

2. **Switch to Evaluator** (`evaluator@demo.com`)
   - Show idea evaluation interface
   - Evaluate the submitted ideas
   - Add evaluation comments

3. **Switch to Admin** (`admin@demo.com`)
   - Show admin dashboard
   - Demonstrate user management
   - Show system analytics

4. **Highlight Features**
   - Role-based access control
   - Real-time updates
   - Responsive design
   - API functionality

## 🛑 Stopping the Demo

```bash
# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

## 📝 Notes

- Demo data is stored in browser localStorage
- Backend still connects to real Supabase for data persistence
- Demo mode only affects frontend authentication
- All API calls work normally in demo mode
- Demo users persist across browser sessions
