# MagLabs Developer Reference Guide

This document serves as a comprehensive technical reference for developers working on the MagLabs multi-tenant application. It covers architecture, development workflows, debugging, and best practices.

## 📋 Table of Contents

1. [Project Architecture](#project-architecture)
2. [Development Environment Setup](#development-environment-setup)
3. [Codebase Structure](#codebase-structure)
4. [Multi-Tenant Implementation](#multi-tenant-implementation)
5. [API Integration](#api-integration)
6. [Frontend Development](#frontend-development)
7. [Backend Development](#backend-development)
8. [Database Management](#database-management)
9. [Docker Development Workflow](#docker-development-workflow)
10. [Testing Strategy](#testing-strategy)
11. [Debugging Guide](#debugging-guide)
12. [Performance Optimization](#performance-optimization)
13. [Security Considerations](#security-considerations)
14. [Deployment Workflows](#deployment-workflows)
15. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## 🏗️ Project Architecture

### High-Level Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Django Backend │    │  MagLabs VLLM   │
│   (Vite + TS)   │◄──►│  Multi-tenant   │◄──►│      API        │
│                 │    │   PostgreSQL    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Nginx Proxy     │    │  PostgreSQL     │    │ External APIs   │
│ Multi-tenant    │    │    Database     │    │ Auth Services   │
│ Routing         │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend Stack
```typescript
// Core Technologies
React 18.x              // UI Framework
TypeScript 5.x           // Type Safety
Vite 4.x                // Build Tool
React Router 6.x         // Client-side Routing
TanStack Query 4.x       // Server State Management
Zustand 4.x             // Client State Management
Tailwind CSS 3.x        // Styling Framework
Headless UI             // Accessible Components
React Hook Form         // Form Management
Zod                     // Schema Validation

// Development Tools
ESLint                  // Code Linting
Prettier                // Code Formatting
Vitest                  // Unit Testing
Playwright              // E2E Testing
Storybook              // Component Documentation
```

#### Backend Stack
```python
# Core Technologies
Django 4.2.x            # Web Framework
Django REST Framework   # API Framework
django-tenants         # Multi-tenancy
PostgreSQL 15.x        # Primary Database
Gunicorn              # WSGI Server

# Additional Libraries
django-cors-headers    # CORS Management
django-environ        # Environment Variables
psycopg2-binary      # PostgreSQL Adapter
requests             # HTTP Client
Pillow               # Image Processing
django-storages      # File Storage (S3)
boto3                # AWS SDK

# Development Tools
pytest               # Testing Framework
pytest-django        # Django Testing
black                # Code Formatting
flake8               # Code Linting
mypy                 # Type Checking
coverage             # Test Coverage
```

### Container Architecture
```yaml
# Development Stack
services:
  nginx:           # Reverse Proxy & Multi-tenant Routing
    - frontend:3000    # React Development Server
    - backend:8000     # Django Development Server
  postgres:        # Multi-tenant Database
  mailhog:         # Email Testing (dev only)

# Production Stack
services:
  nginx:           # Load Balancer & SSL Termination
    - frontend:3000    # Static React Build + Nginx
    - backend:8000     # Django + Gunicorn
  postgres:        # Optimized PostgreSQL
```

## 🛠️ Development Environment Setup

### Prerequisites
```bash
# System Requirements
Docker 20.10+
Docker Compose 2.0+
Node.js 18+
Python 3.11+
Git

# Optional Development Tools
VS Code / PyCharm
Postman / Insomnia
pgAdmin / DBeaver
```

### Quick Setup
```bash
# 1. Clone Repository
git clone <repository-url>
cd pocs/magure-app

# 2. Setup Environment
cp .env.development .env

# 3. Configure Local Domains
sudo bash -c 'cat >> /etc/hosts << EOF
127.0.0.1 tenant1.maglabs.local
127.0.0.1 tenant2.maglabs.local
127.0.0.1 demo.maglabs.local
127.0.0.1 tenant1.maglabs.api
127.0.0.1 tenant2.maglabs.api
127.0.0.1 demo.maglabs.api
EOF'

# 4. Start Development Environment
./scripts/deploy.sh development

# 5. Verify Setup
curl http://tenant1.maglabs.local/health
curl http://tenant1.maglabs.api/api/health/
```

### Local Development Workflow
```bash
# Development with Docker (Recommended)
docker-compose up -d              # Start all services
docker-compose logs -f backend    # Watch backend logs
docker-compose logs -f frontend   # Watch frontend logs

# Native Development (Optional)
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000

# Frontend
cd frontend
npm install
npm run dev
```

## 📁 Codebase Structure

### Project Layout
```
pocs/magure-app/
├── frontend/                   # React Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI Components
│   │   │   ├── chat/          # Chat-specific Components
│   │   │   ├── ui/            # Base UI Components
│   │   │   └── common/        # Shared Components
│   │   ├── hooks/             # Custom React Hooks
│   │   ├── services/          # API Service Layer
│   │   ├── stores/            # State Management (Zustand)
│   │   ├── types/             # TypeScript Type Definitions
│   │   ├── utils/             # Utility Functions
│   │   └── pages/             # Page Components
│   ├── public/                # Static Assets
│   ├── nginx/                 # Frontend Nginx Config
│   └── Dockerfile             # Frontend Container

├── backend/                    # Django Backend Application
│   ├── apps/                  # Django Applications
│   │   ├── ideas/             # Core Business Logic
│   │   ├── users/             # User Management
│   │   ├── tenants/           # Multi-tenant Management
│   │   └── common/            # Shared Utilities
│   ├── config/                # Django Configuration
│   │   ├── settings/          # Environment-specific Settings
│   │   ├── urls.py            # URL Routing
│   │   └── wsgi.py            # WSGI Configuration
│   ├── services/              # External Service Integration
│   │   └── ai_services/       # MagLabs API Integration
│   ├── fixtures/              # Database Fixtures
│   ├── static/                # Static Files
│   ├── media/                 # User Uploads
│   └── Dockerfile             # Backend Container

├── nginx/                     # Reverse Proxy Configuration
│   ├── nginx.conf             # Main Nginx Config
│   ├── conf.d/                # Environment-specific Configs
│   └── ssl/                   # SSL Certificates

├── scripts/                   # Deployment & Maintenance Scripts
│   ├── deploy.sh              # Main Deployment Script
│   ├── backup.sh              # Backup Management
│   └── restore.sh             # Restore Operations

├── .github/workflows/         # CI/CD Pipeline Definitions
├── docker-compose*.yml        # Container Orchestration
├── .env.*                     # Environment Configurations
└── DEPLOYMENT_README.md       # Deployment Documentation
```

### Frontend Architecture
```typescript
// Component Hierarchy
App
├── ChatLayout
│   ├── ChatSessionSidebar
│   │   ├── SessionList
│   │   └── NewSessionButton
│   ├── ChatInterface
│   │   ├── UnifiedChatInterface
│   │   ├── StageProgressMeter
│   │   ├── ConversationHealthIndicator
│   │   ├── AITransparencyPanel
│   │   └── InterventionSuggestions
│   └── MessageList
│       ├── MessageBubble
│       └── MessageMetadata

// State Management Structure
stores/
├── useAuthStore.ts            # Authentication State
├── useChatStore.ts            # Chat Session State
├── useUIStore.ts              # UI State (modals, loading)
└── useSettingsStore.ts        # User Preferences

// Service Layer
services/
├── chatApi/                   # Chat API Client
│   ├── index.ts              # Main API Client
│   ├── types.ts              # API Type Definitions
│   └── hooks.ts              # React Query Hooks
├── authApi/                   # Authentication API
└── websocket/                 # Real-time Communication
```

### Backend Architecture
```python
# Django Apps Structure
apps/
├── ideas/                     # Core Business Logic
│   ├── models.py             # Data Models
│   ├── views.py              # API Views
│   ├── serializers.py        # Data Serialization
│   ├── urls.py               # URL Routing
│   └── management/commands/   # Custom Commands

├── users/                     # User Management
│   ├── models.py             # User Model Extensions
│   ├── views.py              # User API Views
│   └── serializers.py        # User Serialization

├── tenants/                   # Multi-tenant Management
│   ├── models.py             # Tenant Models
│   ├── middleware.py         # Tenant Middleware
│   └── utils.py              # Tenant Utilities

# Service Layer
services/
├── ai_services/
│   ├── maglabs_service.py    # MagLabs API Integration
│   ├── response_parser.py    # Response Processing
│   └── exceptions.py         # Custom Exceptions

# Configuration Structure
config/
├── settings/
│   ├── base.py               # Base Settings
│   ├── development.py        # Development Overrides
│   ├── production.py         # Production Overrides
│   └── test.py               # Test Settings
```

## 🏢 Multi-Tenant Implementation

### Django-Tenants Configuration
```python
# Tenant Model (apps/tenants/models.py)
from django_tenants.models import TenantMixin, DomainMixin

class Tenant(TenantMixin):
    name = models.CharField(max_length=100)
    created_on = models.DateField(auto_now_add=True)
    
    # Optional: Add custom tenant fields
    subscription_plan = models.CharField(max_length=50, default='basic')
    max_users = models.IntegerField(default=10)
    features = models.JSONField(default=dict)

class Domain(DomainMixin):
    pass

# Settings Configuration (config/settings/base.py)
SHARED_APPS = [
    'django_tenants',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'apps.tenants',
    'apps.users',
]

TENANT_APPS = [
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.admin',
    'rest_framework',
    'apps.ideas',
]

INSTALLED_APPS = SHARED_APPS + TENANT_APPS

DATABASE_ROUTERS = ['django_tenants.routers.TenantSyncRouter']
TENANT_MODEL = "tenants.Tenant"
TENANT_DOMAIN_MODEL = "tenants.Domain"
```

### Tenant Middleware & Routing
```python
# Custom Tenant Middleware (apps/tenants/middleware.py)
from django_tenants.middleware import TenantMainMiddleware

class CustomTenantMiddleware(TenantMainMiddleware):
    def process_request(self, request):
        # Extract tenant from X-Tenant-Name header (set by Nginx)
        tenant_name = request.META.get('HTTP_X_TENANT_NAME')
        
        if tenant_name and tenant_name != 'public':
            # Override hostname for tenant resolution
            request.META['HTTP_HOST'] = f"{tenant_name}.yourdomain.com"
        
        return super().process_request(request)

# Nginx Tenant Extraction (nginx/nginx.conf)
map $host $tenant_name {
    ~^(?<tenant>[^.]+)\.yourdomain\.com$ $tenant;
    ~^(?<tenant>[^.]+)\.maglabs\.local$ $tenant;
    default "public";
}

# Set tenant header for Django
proxy_set_header X-Tenant-Name $tenant_name;
```

### Tenant Management Operations
```python
# Create New Tenant
from apps.tenants.models import Tenant, Domain

def create_tenant(name, domain_url, schema_name):
    # Create tenant
    tenant = Tenant(
        name=name,
        schema_name=schema_name,
    )
    tenant.save()
    
    # Create domain
    domain = Domain(
        domain=domain_url,
        tenant=tenant,
        is_primary=True
    )
    domain.save()
    
    return tenant

# Management Command Example
class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('--name', required=True)
        parser.add_argument('--domain', required=True)
        parser.add_argument('--schema', required=True)
    
    def handle(self, *args, **options):
        tenant = create_tenant(
            name=options['name'],
            domain_url=options['domain'],
            schema_name=options['schema']
        )
        self.stdout.write(f"Tenant {tenant.name} created successfully")
```

## 🔌 API Integration

### MagLabs VLLM API Integration
```python
# Service Class (services/ai_services/maglabs_service.py)
import requests
from typing import Dict, Any, Optional

class MagLabsService:
    def __init__(self):
        self.base_url = settings.MAGLABS_API_URL
        self.api_key = settings.MAGLABS_API_KEY
        self.timeout = 120  # 2 minutes
    
    def send_message(
        self, 
        conversation_history: List[Dict],
        session: 'ChatSession',
        auth_token: str
    ) -> Dict[str, Any]:
        """Send message to MagLabs API and return enhanced response"""
        
        payload = self._build_payload(conversation_history, session)
        headers = self._build_headers(session, auth_token)
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            return self._parse_response(response.json())
            
        except requests.RequestException as e:
            logger.error(f"MagLabs API error: {e}")
            raise MagLabsAPIException(f"API request failed: {e}")
    
    def _build_payload(self, conversation_history, session):
        """Build request payload for MagLabs API"""
        return {
            "model": "gpt-4o-mini",
            "messages": conversation_history,
            "temperature": session.template.temperature if session.template else 0.7,
            "stream": False,
            "metadata": {
                "interview_type": session.interview_type or "business_idea",
                "focus_stages": self._get_focus_stages(session),
                "instructions": self._get_instructions(session),
                "user_context": self._get_user_context(session)
            }
        }
    
    def _build_headers(self, session, auth_token):
        """Build request headers"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-User-Token": auth_token,
        }
        
        # Add session ID if exists for continuity
        if session.maglabs_session_id:
            headers["X-Session-ID"] = session.maglabs_session_id
            
        return headers
    
    def _parse_response(self, response_data):
        """Parse and enhance MagLabs API response"""
        enhanced_response = {
            # Core response fields
            "content": response_data.get("content", ""),
            "session_id": response_data.get("session_id"),
            
            # Enhanced metadata parsing
            **self._parse_metadata(response_data)
        }
        
        return enhanced_response
    
    def _parse_metadata(self, response_data):
        """Parse metadata fields from API response"""
        metadata = {}
        
        # Parse string-encoded JSON fields
        for field in ['stage_completion', 'business_context', 'quality_metrics', 
                     'ai_state', 'next_actions']:
            value = response_data.get(field)
            if isinstance(value, str):
                try:
                    metadata[field] = json.loads(value)
                except json.JSONDecodeError:
                    metadata[field] = value
            else:
                metadata[field] = value
        
        return metadata

# Usage in Views (apps/ideas/views.py)
from services.ai_services.maglabs_service import MagLabsService

class ChatSessionViewSet(viewsets.ModelViewSet):
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        session = self.get_object()
        
        # Create user message
        user_message = self._create_user_message(session, request.data)
        
        # Build conversation history
        conversation_history = self._build_conversation_history(session)
        
        # Send to MagLabs API
        maglabs_service = MagLabsService()
        try:
            ai_response = maglabs_service.send_message(
                conversation_history=conversation_history,
                session=session,
                auth_token=request.META.get('HTTP_AUTHORIZATION', '')
            )
            
            # Create AI message with metadata
            ai_message = self._create_ai_message(session, ai_response)
            
            # Update session with latest metadata
            self._update_session_metadata(session, ai_response)
            
            return Response({
                'user_message': ChatMessageSerializer(user_message).data,
                'ai_message': ChatMessageSerializer(ai_message).data,
                'session': ChatSessionDetailSerializer(session).data
            })
            
        except Exception as e:
            logger.error(f"Error in send_message: {e}")
            return Response(
                {'error': 'Failed to process message'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

### Frontend API Client
```typescript
// API Client (src/services/chatApi/index.ts)
import { ChatSession, ChatMessage, SendMessageRequest } from './types';

class ChatApiClient {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '/api';
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.headers,
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Chat Session Operations
  async getChatSessions(): Promise<ChatSession[]> {
    return this.request<ChatSession[]>('/chat/sessions/');
  }

  async getChatSession(id: string): Promise<ChatSession> {
    return this.request<ChatSession>(`/chat/sessions/${id}/`);
  }

  async createChatSession(data: Partial<ChatSession>): Promise<ChatSession> {
    return this.request<ChatSession>('/chat/sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendMessage(
    sessionId: string, 
    data: SendMessageRequest
  ): Promise<{ user_message: ChatMessage; ai_message: ChatMessage; session: ChatSession }> {
    return this.request(`/chat/sessions/${sessionId}/send_message/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Template Operations
  async getChatTemplates(): Promise<ChatTemplate[]> {
    return this.request<ChatTemplate[]>('/chat/templates/');
  }
}

export const chatApi = new ChatApiClient();

// React Query Hooks (src/services/chatApi/hooks.ts)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from './index';

export const useChatSessions = () => {
  return useQuery({
    queryKey: ['chatSessions'],
    queryFn: chatApi.getChatSessions,
  });
};

export const useChatSession = (id: string) => {
  return useQuery({
    queryKey: ['chatSession', id],
    queryFn: () => chatApi.getChatSession(id),
    enabled: !!id,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, data }: { 
      sessionId: string; 
      data: SendMessageRequest 
    }) => chatApi.sendMessage(sessionId, data),
    
    onSuccess: (response, { sessionId }) => {
      // Update session cache
      queryClient.setQueryData(['chatSession', sessionId], response.session);
      
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });
};
```

## 🎨 Frontend Development

### Component Development Guidelines
```typescript
// Component Structure Example
// src/components/chat/ChatInterface.tsx

import React from 'react';
import { useChatSession, useSendMessage } from '@/services/chatApi/hooks';
import { ChatMessage } from '@/types/chat';

interface ChatInterfaceProps {
  sessionId: string;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  sessionId, 
  className 
}) => {
  const { data: session, isLoading } = useChatSession(sessionId);
  const sendMessage = useSendMessage();

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage.mutateAsync({
        sessionId,
        data: { content, message_type: 'text' }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (isLoading) {
    return <ChatSkeleton />;
  }

  return (
    <div className={`chat-interface ${className}`}>
      <ChatHeader session={session} />
      <MessageList messages={session?.messages || []} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

// Custom Hook Example
// src/hooks/useConversationHealth.ts

import { useMemo } from 'react';
import { ChatSession } from '@/types/chat';

export const useConversationHealth = (session: ChatSession | null) => {
  return useMemo(() => {
    if (!session?.ai_metadata) {
      return {
        health: 'unknown',
        momentum: 0,
        velocity: 0,
        issues: [],
        suggestions: []
      };
    }

    const metadata = session.ai_metadata;
    
    return {
      health: metadata.conversation_health || 'good',
      momentum: metadata.conversation_momentum || 0,
      velocity: metadata.progress_velocity || 0,
      issues: metadata.flow_issues || [],
      suggestions: metadata.quality_metrics?.intervention_suggestions || []
    };
  }, [session?.ai_metadata]);
};

// State Management with Zustand
// src/stores/useChatStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ChatState {
  activeSessionId: string | null;
  isInterviewMode: boolean;
  selectedTemplate: string | null;
  
  // Actions
  setActiveSession: (sessionId: string | null) => void;
  setInterviewMode: (enabled: boolean) => void;
  setSelectedTemplate: (templateId: string | null) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set) => ({
        activeSessionId: null,
        isInterviewMode: false,
        selectedTemplate: null,
        
        setActiveSession: (sessionId) => 
          set({ activeSessionId: sessionId }),
        
        setInterviewMode: (enabled) => 
          set({ isInterviewMode: enabled }),
        
        setSelectedTemplate: (templateId) => 
          set({ selectedTemplate: templateId }),
      }),
      {
        name: 'chat-store',
        partialize: (state) => ({
          isInterviewMode: state.isInterviewMode,
          selectedTemplate: state.selectedTemplate,
        }),
      }
    )
  )
);
```

### UI Component Library
```typescript
// Base UI Components
// src/components/ui/Button.tsx

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };

// Complex Component Example
// src/components/chat/StageProgressMeter.tsx

import React from 'react';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { ChatSession } from '@/types/chat';

interface StageProgressMeterProps {
  session: ChatSession;
  className?: string;
}

export const StageProgressMeter: React.FC<StageProgressMeterProps> = ({
  session,
  className
}) => {
  const stageCompletion = session.ai_metadata?.stage_completion || {};
  const businessContext = session.ai_metadata?.business_context || {};
  
  const stages = [
    { key: 'user_profiling', label: 'User Profiling', color: 'blue' },
    { key: 'problem_capture', label: 'Problem Capture', color: 'green' },
    { key: 'problem_clarification', label: 'Problem Clarification', color: 'yellow' },
    { key: 'solution_brainstorming', label: 'Solution Brainstorming', color: 'purple' },
    { key: 'value_proposition', label: 'Value Proposition', color: 'red' },
    { key: 'report_generation', label: 'Report Generation', color: 'gray' },
  ];

  const businessMetrics = [
    { key: 'problem_clarity_score', label: 'Problem Clarity' },
    { key: 'solution_readiness_score', label: 'Solution Readiness' },
    { key: 'market_understanding_score', label: 'Market Understanding' },
    { key: 'value_proposition_score', label: 'Value Proposition' },
    { key: 'feasibility_score', label: 'Feasibility' },
    { key: 'user_profile_completeness', label: 'User Profile' },
  ];

  return (
    <div className={`stage-progress-meter ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Stage Progress</h3>
        <div className="space-y-3">
          {stages.map((stage) => {
            const completion = (stageCompletion[stage.key] || 0) * 100;
            const isActive = session.current_stage === stage.key;
            
            return (
              <div key={stage.key} className="flex items-center gap-3">
                <Badge 
                  variant={isActive ? 'default' : 'secondary'}
                  className="w-20 justify-center"
                >
                  {completion.toFixed(0)}%
                </Badge>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{stage.label}</span>
                    {isActive && (
                      <Badge variant="outline" size="sm">Active</Badge>
                    )}
                  </div>
                  <Progress 
                    value={completion} 
                    className="h-2"
                    color={stage.color}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Business Context</h3>
        <div className="grid grid-cols-2 gap-3">
          {businessMetrics.map((metric) => {
            const score = (businessContext[metric.key] || 0) * 100;
            
            return (
              <div key={metric.key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{metric.label}</span>
                  <span className="font-medium">{score.toFixed(0)}%</span>
                </div>
                <Progress value={score} className="h-1" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

## ⚙️ Backend Development

### Django Model Patterns
```python
# Base Model with Audit Fields
# apps/common/models.py

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class BaseModel(models.Model):
    """Base model with common fields for all models"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class AuditableModel(BaseModel):
    """Model with user audit trails"""
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='%(class)s_created'
    )
    updated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='%(class)s_updated'
    )
    
    class Meta:
        abstract = True

# Business Models
# apps/ideas/models.py

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.common.models import BaseModel, AuditableModel

class ChatTemplate(BaseModel):
    """Template for chat conversations with predefined settings"""
    name = models.CharField(max_length=100)
    key = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    content = models.TextField(help_text="Template instructions")
    
    # Configuration
    is_active = models.BooleanField(default=True)
    department = models.ForeignKey(
        'users.Department', 
        on_delete=models.CASCADE,
        null=True, blank=True
    )
    
    # MagLabs Configuration
    maglabs_interview_type = models.CharField(
        max_length=50, 
        default='business_idea'
    )
    expected_stages = models.JSONField(default=list)
    stage_prompts = models.JSONField(default=dict)
    temperature = models.FloatField(
        default=0.7,
        validators=[MinValueValidator(0.0), MaxValueValidator(2.0)]
    )
    focus_stages = models.JSONField(default=list)
    
    class Meta:
        db_table = 'chat_templates'
        ordering = ['name']
    
    def __str__(self):
        return self.name

class ChatSession(AuditableModel):
    """Chat session with multi-tenant support"""
    title = models.CharField(max_length=200, default="New Chat")
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('archived', 'Archived'),
            ('deleted', 'Deleted'),
        ],
        default='active'
    )
    
    # Relationships
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    template = models.ForeignKey(
        ChatTemplate, 
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    submitted_idea = models.ForeignKey(
        'Idea', 
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    
    # MagLabs Integration
    maglabs_session_id = models.CharField(max_length=255, blank=True)
    current_stage = models.CharField(max_length=50, default='user_profiling')
    stage_progress = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )
    conversation_health = models.CharField(max_length=20, default='good')
    business_context = models.JSONField(default=dict)
    
    # Interview Configuration
    interview_mode = models.BooleanField(default=False)
    interview_type = models.CharField(max_length=50, blank=True)
    target_stages = models.JSONField(default=list)
    completed_stages = models.JSONField(default=list)
    interview_goals = models.TextField(blank=True)
    
    # Metadata
    context_metadata = models.JSONField(default=dict)
    message_count = models.PositiveIntegerField(default=0)
    total_tokens_used = models.PositiveIntegerField(default=0)
    is_idea_submitted = models.BooleanField(default=False)
    last_activity_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_sessions'
        ordering = ['-last_activity_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['last_activity_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.user.name})"
    
    @property
    def progress_percentage(self):
        """Get stage progress as percentage"""
        return int(self.stage_progress * 100)
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity_at = timezone.now()
        self.save(update_fields=['last_activity_at'])

class ChatMessage(BaseModel):
    """Individual chat message with AI metadata"""
    session = models.ForeignKey(
        ChatSession, 
        on_delete=models.CASCADE,
        related_name='messages'
    )
    parent_message = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='replies'
    )
    
    # Message Content
    role = models.CharField(
        max_length=20,
        choices=[
            ('user', 'User'),
            ('assistant', 'Assistant'),
            ('system', 'System'),
        ]
    )
    content = models.TextField()
    message_type = models.CharField(
        max_length=20,
        choices=[
            ('text', 'Text'),
            ('idea_draft', 'Idea Draft'),
            ('refinement', 'Refinement'),
            ('question', 'Question'),
            ('submission', 'Submission'),
            ('error', 'Error'),
        ],
        default='text'
    )
    
    # AI Metadata (stores full MagLabs API response)
    ai_metadata = models.JSONField(default=dict)
    
    # Organization
    sequence_number = models.PositiveIntegerField()
    
    # Processing Status
    is_processed = models.BooleanField(default=True)
    processing_status = models.CharField(max_length=20, default='completed')
    error_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'chat_messages'
        ordering = ['sequence_number']
        unique_together = ['session', 'sequence_number']
        indexes = [
            models.Index(fields=['session', 'sequence_number']),
            models.Index(fields=['created_at']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
    
    def save(self, *args, **kwargs):
        # Auto-increment sequence number
        if not self.sequence_number:
            last_message = ChatMessage.objects.filter(
                session=self.session
            ).order_by('-sequence_number').first()
            
            self.sequence_number = (last_message.sequence_number + 1) if last_message else 1
        
        super().save(*args, **kwargs)
        
        # Update session message count
        self.session.message_count = self.session.messages.count()
        self.session.save(update_fields=['message_count'])
```

### API View Patterns
```python
# ViewSet with Custom Actions
# apps/ideas/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
import logging

from .models import ChatSession, ChatMessage
from .serializers import (
    ChatSessionListSerializer,
    ChatSessionDetailSerializer,
    ChatSessionCreateSerializer,
    ChatMessageSerializer
)
from services.ai_services.maglabs_service import MagLabsService

logger = logging.getLogger(__name__)

class ChatSessionViewSet(viewsets.ModelViewSet):
    """Chat session management with AI integration"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatSession.objects.filter(
            user=self.request.user,
            status__in=['active', 'archived']
        ).select_related('template', 'user').prefetch_related('messages')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ChatSessionListSerializer
        elif self.action == 'create':
            return ChatSessionCreateSerializer
        return ChatSessionDetailSerializer
    
    def perform_create(self, serializer):
        """Create new chat session with initial setup"""
        with transaction.atomic():
            # Create session
            session = serializer.save(
                user=self.request.user,
                context_metadata=self._build_context_metadata()
            )
            
            # Create initial system message if template exists
            if session.template:
                self._create_initial_message(session)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send message to AI and get response"""
        session = self.get_object()
        
        try:
            with transaction.atomic():
                # Create user message
                user_message = self._create_user_message(session, request.data)
                
                # Build conversation history
                conversation_history = self._build_conversation_history(session)
                
                # Send to MagLabs API
                maglabs_service = MagLabsService()
                ai_response = maglabs_service.send_message(
                    conversation_history=conversation_history,
                    session=session,
                    auth_token=request.META.get('HTTP_AUTHORIZATION', '')
                )
                
                # Create AI message
                ai_message = self._create_ai_message(session, ai_response)
                
                # Update session metadata
                self._update_session_metadata(session, ai_response)
                
                return Response({
                    'user_message': ChatMessageSerializer(user_message).data,
                    'ai_message': ChatMessageSerializer(ai_message).data,
                    'session': ChatSessionDetailSerializer(session).data
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error in send_message for session {pk}: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to process message. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive chat session"""
        session = self.get_object()
        session.status = 'archived'
        session.save(update_fields=['status', 'updated_at'])
        
        return Response({'status': 'archived'})
    
    @action(detail=True, methods=['post'])
    def reset_conversation(self, request, pk=None):
        """Reset conversation context while keeping history"""
        session = self.get_object()
        
        # Clear MagLabs session to force new conversation
        session.maglabs_session_id = ''
        session.current_stage = 'user_profiling'
        session.stage_progress = 0.0
        session.conversation_health = 'good'
        session.business_context = {}
        session.save()
        
        return Response({'status': 'conversation reset'})
    
    def _build_context_metadata(self):
        """Build context metadata for new session"""
        user = self.request.user
        return {
            'user_role': getattr(user, 'role', 'user'),
            'user_name': user.get_full_name() or user.email,
            'department': getattr(user.department, 'name', '') if hasattr(user, 'department') else '',
            'session_reset': str(uuid.uuid4()),  # Force new MagLabs session
            'reset_timestamp': timezone.now().isoformat(),
            'reset_reason': 'new_session'
        }
    
    def _create_user_message(self, session, data):
        """Create user message from request data"""
        return ChatMessage.objects.create(
            session=session,
            role='user',
            content=data.get('content', ''),
            message_type=data.get('message_type', 'text')
        )
    
    def _create_ai_message(self, session, ai_response):
        """Create AI message from MagLabs response"""
        return ChatMessage.objects.create(
            session=session,
            role='assistant',
            content=ai_response.get('content', ''),
            message_type='text',
            ai_metadata=ai_response
        )
    
    def _build_conversation_history(self, session):
        """Build conversation history for MagLabs API"""
        messages = session.messages.order_by('sequence_number')
        
        conversation = []
        
        # Add system message if template exists
        if session.template:
            conversation.append({
                'role': 'system',
                'content': session.template.content
            })
        
        # Add conversation messages
        for message in messages:
            conversation.append({
                'role': message.role,
                'content': message.content
            })
        
        return conversation
    
    def _update_session_metadata(self, session, ai_response):
        """Update session with AI response metadata"""
        # Update MagLabs session ID
        if ai_response.get('session_id'):
            session.maglabs_session_id = ai_response['session_id']
        
        # Update conversation progress
        session.current_stage = ai_response.get('stage', session.current_stage)
        session.stage_progress = ai_response.get('stage_progress', session.stage_progress)
        session.conversation_health = ai_response.get('conversation_health', session.conversation_health)
        
        # Update business context
        if ai_response.get('business_context'):
            session.business_context.update(ai_response['business_context'])
        
        # Update token usage
        usage = ai_response.get('metadata', {}).get('usage', {})
        if usage.get('total_tokens'):
            session.total_tokens_used += usage['total_tokens']
        
        # Update activity timestamp
        session.last_activity_at = timezone.now()
        
        session.save(update_fields=[
            'maglabs_session_id', 'current_stage', 'stage_progress',
            'conversation_health', 'business_context', 'total_tokens_used',
            'last_activity_at', 'updated_at'
        ])
```

### Serializer Patterns
```python
# Serializers with Dynamic Fields
# apps/ideas/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import ChatSession, ChatMessage, ChatTemplate

class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """Serializer that allows dynamic field selection"""
    def __init__(self, *args, **kwargs):
        fields = kwargs.pop('fields', None)
        exclude = kwargs.pop('exclude', None)
        
        super().__init__(*args, **kwargs)
        
        if fields is not None:
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)
        
        if exclude is not None:
            for field_name in exclude:
                self.fields.pop(field_name, None)

class ChatMessageSerializer(DynamicFieldsModelSerializer):
    """Serializer for chat messages with AI metadata"""
    time_ago = serializers.SerializerMethodField()
    formatted_content = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'role', 'content', 'formatted_content', 'message_type',
            'ai_metadata', 'sequence_number', 'created_at', 'time_ago',
            'is_processed', 'processing_status', 'error_message'
        ]
        read_only_fields = ['id', 'sequence_number', 'created_at']
    
    def get_time_ago(self, obj):
        """Get human-readable time since message creation"""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
    
    def get_formatted_content(self, obj):
        """Get formatted message content (with markdown support)"""
        # Add markdown processing if needed
        return obj.content

class ChatSessionListSerializer(DynamicFieldsModelSerializer):
    """Lightweight serializer for session lists"""
    message_preview = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'title', 'status', 'interview_mode', 'current_stage',
            'message_count', 'progress_percentage', 'conversation_health',
            'message_preview', 'last_activity', 'created_at'
        ]
    
    def get_message_preview(self, obj):
        """Get preview of last message"""
        last_message = obj.messages.order_by('-sequence_number').first()
        if last_message:
            content = last_message.content
            return content[:100] + '...' if len(content) > 100 else content
        return "No messages yet"
    
    def get_last_activity(self, obj):
        """Get human-readable last activity time"""
        return ChatMessageSerializer().get_time_ago(
            type('obj', (), {'created_at': obj.last_activity_at})()
        )
    
    def get_progress_percentage(self, obj):
        """Get stage progress as percentage"""
        return int(obj.stage_progress * 100)

class ChatSessionDetailSerializer(DynamicFieldsModelSerializer):
    """Detailed serializer for individual sessions"""
    messages = ChatMessageSerializer(many=True, read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    # AI Metadata fields for easy access
    stage_completion = serializers.SerializerMethodField()
    quality_metrics = serializers.SerializerMethodField()
    ai_state = serializers.SerializerMethodField()
    next_actions = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'title', 'status', 'user_name', 'template_name',
            'maglabs_session_id', 'current_stage', 'stage_progress',
            'conversation_health', 'business_context', 'interview_mode',
            'interview_type', 'target_stages', 'completed_stages',
            'context_metadata', 'message_count', 'total_tokens_used',
            'is_idea_submitted', 'created_at', 'updated_at', 'last_activity_at',
            'messages', 'stage_completion', 'quality_metrics', 'ai_state', 'next_actions'
        ]
        read_only_fields = [
            'id', 'maglabs_session_id', 'message_count', 'total_tokens_used',
            'created_at', 'updated_at', 'last_activity_at'
        ]
    
    def get_latest_ai_metadata(self, obj):
        """Get latest AI metadata from most recent assistant message"""
        latest_ai_message = obj.messages.filter(
            role='assistant'
        ).order_by('-sequence_number').first()
        
        return latest_ai_message.ai_metadata if latest_ai_message else {}
    
    def get_stage_completion(self, obj):
        """Get stage completion data"""
        metadata = self.get_latest_ai_metadata(obj)
        return metadata.get('stage_completion', {})
    
    def get_quality_metrics(self, obj):
        """Get quality metrics data"""
        metadata = self.get_latest_ai_metadata(obj)
        return metadata.get('quality_metrics', {})
    
    def get_ai_state(self, obj):
        """Get AI transparency state"""
        metadata = self.get_latest_ai_metadata(obj)
        return metadata.get('ai_state', {})
    
    def get_next_actions(self, obj):
        """Get next actions recommendations"""
        metadata = self.get_latest_ai_metadata(obj)
        return metadata.get('next_actions', {})

class ChatSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new chat sessions"""
    template_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = ChatSession
        fields = [
            'title', 'interview_mode', 'interview_type', 
            'interview_goals', 'template_id'
        ]
    
    def validate_template_id(self, value):
        """Validate template exists and is active"""
        if value:
            try:
                template = ChatTemplate.objects.get(id=value, is_active=True)
                return template
            except ChatTemplate.DoesNotExist:
                raise serializers.ValidationError("Invalid or inactive template")
        return None
    
    def create(self, validated_data):
        """Create session with template configuration"""
        template = validated_data.pop('template_id', None)
        
        session = ChatSession.objects.create(
            template=template,
            **validated_data
        )
        
        # Configure interview settings from template
        if template:
            session.interview_mode = True
            session.interview_type = template.maglabs_interview_type
            session.target_stages = template.expected_stages
            session.save(update_fields=[
                'interview_mode', 'interview_type', 'target_stages'
            ])
        
        return session
```

## 🗄️ Database Management

### Migration Management
```python
# Custom Migration for Multi-tenant Setup
# apps/tenants/migrations/0002_setup_initial_tenant.py

from django.db import migrations
from django_tenants.utils import schema_context

def create_public_tenant(apps, schema_editor):
    """Create the public tenant"""
    Tenant = apps.get_model('tenants', 'Tenant')
    Domain = apps.get_model('tenants', 'Domain')
    
    # Create public tenant
    tenant = Tenant.objects.create(
        name='System',
        schema_name='public',
    )
    
    # Create domain
    Domain.objects.create(
        domain='localhost',
        tenant=tenant,
        is_primary=True
    )

def reverse_create_public_tenant(apps, schema_editor):
    """Remove public tenant"""
    Tenant = apps.get_model('tenants', 'Tenant')
    Tenant.objects.filter(schema_name='public').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('tenants', '0001_initial'),
    ]
    
    operations = [
        migrations.RunPython(
            create_public_tenant,
            reverse_create_public_tenant
        ),
    ]

# Management Commands
# apps/tenants/management/commands/create_tenant.py

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.tenants.models import Tenant, Domain

class Command(BaseCommand):
    help = 'Create a new tenant'
    
    def add_arguments(self, parser):
        parser.add_argument('--name', required=True, help='Tenant name')
        parser.add_argument('--domain', required=True, help='Tenant domain')
        parser.add_argument('--schema', required=True, help='Database schema name')
    
    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                # Create tenant
                tenant = Tenant.objects.create(
                    name=options['name'],
                    schema_name=options['schema']
                )
                
                # Create domain
                domain = Domain.objects.create(
                    domain=options['domain'],
                    tenant=tenant,
                    is_primary=True
                )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully created tenant '{tenant.name}' "
                        f"with domain '{domain.domain}'"
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error creating tenant: {e}")
            )

# Database Utilities
# apps/common/db_utils.py

from django.db import connection
from django_tenants.utils import schema_context, get_tenant_model

def get_tenant_schemas():
    """Get list of all tenant schemas"""
    Tenant = get_tenant_model()
    return list(Tenant.objects.values_list('schema_name', flat=True))

def execute_on_all_tenants(sql_query, exclude_public=True):
    """Execute SQL query on all tenant schemas"""
    schemas = get_tenant_schemas()
    
    if exclude_public:
        schemas = [s for s in schemas if s != 'public']
    
    results = {}
    
    for schema in schemas:
        with schema_context(schema):
            with connection.cursor() as cursor:
                cursor.execute(sql_query)
                results[schema] = cursor.fetchall()
    
    return results

def get_tenant_stats():
    """Get statistics for all tenants"""
    from apps.ideas.models import ChatSession, ChatMessage
    
    stats = {}
    
    for schema in get_tenant_schemas():
        if schema == 'public':
            continue
            
        with schema_context(schema):
            stats[schema] = {
                'sessions': ChatSession.objects.count(),
                'messages': ChatMessage.objects.count(),
                'active_sessions': ChatSession.objects.filter(status='active').count(),
                'total_tokens': ChatSession.objects.aggregate(
                    total=models.Sum('total_tokens_used')
                )['total'] or 0
            }
    
    return stats
```

### Database Performance
```python
# Query Optimization Examples
# apps/ideas/querysets.py

from django.db import models
from django.db.models import Prefetch, Count, Sum, Q

class ChatSessionQuerySet(models.QuerySet):
    """Optimized queries for chat sessions"""
    
    def with_message_stats(self):
        """Annotate with message statistics"""
        return self.annotate(
            total_messages=Count('messages'),
            user_messages=Count('messages', filter=Q(messages__role='user')),
            ai_messages=Count('messages', filter=Q(messages__role='assistant')),
            last_message_date=models.Max('messages__created_at')
        )
    
    def with_recent_messages(self, limit=5):
        """Prefetch recent messages"""
        recent_messages = Prefetch(
            'messages',
            queryset=ChatMessage.objects.order_by('-sequence_number')[:limit],
            to_attr='recent_messages'
        )
        return self.prefetch_related(recent_messages)
    
    def active_sessions(self):
        """Filter active sessions"""
        return self.filter(status='active')
    
    def for_user(self, user):
        """Filter sessions for specific user"""
        return self.filter(user=user)
    
    def with_health_issues(self):
        """Filter sessions with conversation health issues"""
        return self.filter(
            conversation_health__in=['poor', 'fair']
        )

class ChatMessageQuerySet(models.QuerySet):
    """Optimized queries for chat messages"""
    
    def with_ai_metadata(self):
        """Filter messages that have AI metadata"""
        return self.filter(ai_metadata__isnull=False).exclude(ai_metadata={})
    
    def recent_ai_responses(self, days=7):
        """Get recent AI responses"""
        from django.utils import timezone
        cutoff = timezone.now() - timezone.timedelta(days=days)
        
        return self.filter(
            role='assistant',
            created_at__gte=cutoff
        ).order_by('-created_at')

# Database Indexes
# apps/ideas/models.py

class ChatSession(models.Model):
    # ... fields ...
    
    class Meta:
        db_table = 'chat_sessions'
        indexes = [
            # User-based queries
            models.Index(fields=['user', 'status'], name='idx_user_status'),
            models.Index(fields=['user', '-last_activity_at'], name='idx_user_activity'),
            
            # Time-based queries
            models.Index(fields=['-last_activity_at'], name='idx_last_activity'),
            models.Index(fields=['-created_at'], name='idx_created_at'),
            
            # Status queries
            models.Index(fields=['status', '-last_activity_at'], name='idx_status_activity'),
            
            # Health monitoring
            models.Index(fields=['conversation_health'], name='idx_health'),
            
            # MagLabs integration
            models.Index(fields=['maglabs_session_id'], name='idx_maglabs_session'),
        ]

class ChatMessage(models.Model):
    # ... fields ...
    
    class Meta:
        db_table = 'chat_messages'
        indexes = [
            # Session-based queries
            models.Index(fields=['session', 'sequence_number'], name='idx_session_sequence'),
            models.Index(fields=['session', '-created_at'], name='idx_session_created'),
            
            # Role-based queries
            models.Index(fields=['role', '-created_at'], name='idx_role_created'),
            
            # AI metadata queries
            models.Index(fields=['role'], name='idx_role'),
            
            # Time-based queries
            models.Index(fields=['-created_at'], name='idx_created_desc'),
        ]

# Performance Monitoring
# apps/common/performance.py

import time
import logging
from django.db import connection
from django.conf import settings

logger = logging.getLogger('performance')

class QueryCountDebugMiddleware:
    """Middleware to log query counts in development"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        if settings.DEBUG:
            initial_queries = len(connection.queries)
            start_time = time.time()
            
            response = self.get_response(request)
            
            end_time = time.time()
            query_count = len(connection.queries) - initial_queries
            duration = end_time - start_time
            
            if query_count > 10 or duration > 1.0:  # Log slow requests
                logger.warning(
                    f"Slow request: {request.path} - "
                    f"{query_count} queries in {duration:.2f}s"
                )
                
                if query_count > 20:  # Log queries for very slow requests
                    for query in connection.queries[-query_count:]:
                        logger.debug(f"Query: {query['sql'][:200]}...")
            
            return response
        else:
            return self.get_response(request)
```

## 🐳 Docker Development Workflow

### Development Environment
```bash
# Development Workflow Commands

# 1. Start Development Environment
docker-compose up -d

# 2. Watch Logs
docker-compose logs -f backend frontend

# 3. Execute Commands in Containers
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser

# 4. Access Database
docker-compose exec postgres psql -U maglabs -d maglabs

# 5. Restart Specific Services
docker-compose restart backend
docker-compose restart frontend

# 7. Rebuild and Start
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 8. Clean Up
docker-compose down -v  # Remove volumes
docker system prune -a  # Clean up images
```

### Hot Reload Setup
```yaml
# docker-compose.override.yml (for development)
version: '3.8'

services:
  backend:
    volumes:
      - ./backend:/app:cached
      - /app/venv  # Exclude virtual environment
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.development
      - DEBUG=true
    command: python manage.py runserver 0.0.0.0:8000

  frontend:
    volumes:
      - ./frontend:/app:cached
      - /app/node_modules  # Exclude node_modules
    environment:
      - NODE_ENV=development
      - VITE_HMR_HOST=localhost
    command: npm run dev -- --host 0.0.0.0

  nginx:
    volumes:
      - ./nginx/conf.d/default.conf:/etc/nginx/conf.d/default.conf:ro
```

### Docker Best Practices
```dockerfile
# Multi-stage Build Example (Frontend)
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Security: Run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

# Multi-stage Build Example (Backend)
FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r django && useradd -r -g django django

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Development stage
FROM base AS development
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt
COPY . .
RUN chown -R django:django /app
USER django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Production stage
FROM base AS production
RUN pip install gunicorn==21.2.0
COPY . .
RUN mkdir -p /app/logs /app/staticfiles
RUN chown -R django:django /app
USER django

# Collect static files
RUN python manage.py collectstatic --noinput

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
```

## 🧪 Testing Strategy

### Backend Testing
```python
# Test Configuration (config/settings/test.py)
from .base import *

# Test Database
DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': 'test_maglabs',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Fast testing settings
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Test-specific settings
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Model Tests (apps/ideas/tests/test_models.py)
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.ideas.models import ChatSession, ChatMessage, ChatTemplate

User = get_user_model()

class ChatSessionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.template = ChatTemplate.objects.create(
            name='Test Template',
            key='test_template',
            content='Test instructions'
        )
    
    def test_session_creation(self):
        """Test basic session creation"""
        session = ChatSession.objects.create(
            title='Test Session',
            user=self.user,
            template=self.template
        )
        
        self.assertEqual(session.title, 'Test Session')
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.template, self.template)
        self.assertEqual(session.status, 'active')
        self.assertEqual(session.message_count, 0)
    
    def test_progress_percentage(self):
        """Test progress percentage calculation"""
        session = ChatSession.objects.create(
            title='Test Session',
            user=self.user,
            stage_progress=0.75
        )
        
        self.assertEqual(session.progress_percentage, 75)
    
    def test_update_activity(self):
        """Test activity timestamp update"""
        session = ChatSession.objects.create(
            title='Test Session',
            user=self.user
        )
        
        original_activity = session.last_activity_at
        session.update_activity()
        
        self.assertGreater(session.last_activity_at, original_activity)

class ChatMessageModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.session = ChatSession.objects.create(
            title='Test Session',
            user=self.user
        )
    
    def test_message_creation(self):
        """Test message creation with auto-increment sequence"""
        message1 = ChatMessage.objects.create(
            session=self.session,
            role='user',
            content='Hello'
        )
        
        message2 = ChatMessage.objects.create(
            session=self.session,
            role='assistant',
            content='Hi there!'
        )
        
        self.assertEqual(message1.sequence_number, 1)
        self.assertEqual(message2.sequence_number, 2)
        
        # Check session message count update
        self.session.refresh_from_db()
        self.assertEqual(self.session.message_count, 2)
    
    def test_message_metadata(self):
        """Test AI metadata storage"""
        ai_metadata = {
            'stage': 'user_profiling',
            'confidence': 0.85,
            'suggestions': ['Ask about background']
        }
        
        message = ChatMessage.objects.create(
            session=self.session,
            role='assistant',
            content='Tell me about yourself',
            ai_metadata=ai_metadata
        )
        
        self.assertEqual(message.ai_metadata['stage'], 'user_profiling')
        self.assertEqual(message.ai_metadata['confidence'], 0.85)

# API Tests (apps/ideas/tests/test_views.py)
import json
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

class ChatSessionAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.template = ChatTemplate.objects.create(
            name='Test Template',
            key='test_template',
            content='Test instructions'
        )
    
    def test_create_session(self):
        """Test creating a new chat session"""
        data = {
            'title': 'New Session',
            'interview_mode': True,
            'template_id': str(self.template.id)
        }
        
        response = self.client.post('/api/chat/sessions/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Session')
        self.assertTrue(response.data['interview_mode'])
    
    def test_list_sessions(self):
        """Test listing user sessions"""
        ChatSession.objects.create(
            title='Session 1',
            user=self.user
        )
        ChatSession.objects.create(
            title='Session 2',
            user=self.user
        )
        
        response = self.client.get('/api/chat/sessions/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    @patch('services.ai_services.maglabs_service.MagLabsService.send_message')
    def test_send_message(self, mock_send_message):
        """Test sending a message to AI"""
        # Setup mock response
        mock_send_message.return_value = {
            'content': 'AI response',
            'session_id': 'mock-session-id',
            'stage': 'user_profiling',
            'stage_progress': 0.1,
            'metadata': {'usage': {'total_tokens': 100}}
        }
        
        session = ChatSession.objects.create(
            title='Test Session',
            user=self.user
        )
        
        data = {
            'content': 'Hello AI',
            'message_type': 'text'
        }
        
        response = self.client.post(
            f'/api/chat/sessions/{session.id}/send_message/',
            data
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_message']['content'], 'Hello AI')
        self.assertEqual(response.data['ai_message']['content'], 'AI response')
        
        # Verify session was updated
        session.refresh_from_db()
        self.assertEqual(session.maglabs_session_id, 'mock-session-id')
        self.assertEqual(session.total_tokens_used, 100)

# Integration Tests (apps/ideas/tests/test_integration.py)
from django.test import TransactionTestCase
from django.db import transaction

class ChatWorkflowIntegrationTest(TransactionTestCase):
    """Test complete chat workflow"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.template = ChatTemplate.objects.create(
            name='Business Idea Template',
            key='business_idea',
            content='Help the user develop their business idea',
            maglabs_interview_type='business_idea',
            expected_stages=['user_profiling', 'problem_capture']
        )
    
    def test_complete_chat_workflow(self):
        """Test complete chat workflow from creation to completion"""
        # 1. Create session
        session = ChatSession.objects.create(
            title='My Business Idea',
            user=self.user,
            template=self.template,
            interview_mode=True
        )
        
        # 2. Add user message
        user_message = ChatMessage.objects.create(
            session=session,
            role='user',
            content='I want to build a food delivery app'
        )
        
        # 3. Simulate AI response
        ai_metadata = {
            'stage': 'problem_capture',
            'stage_progress': 0.3,
            'conversation_health': 'good',
            'business_context': {
                'problem_clarity_score': 0.6,
                'market_understanding_score': 0.4
            }
        }
        
        ai_message = ChatMessage.objects.create(
            session=session,
            role='assistant',
            content='That\'s interesting! What problem does your app solve?',
            ai_metadata=ai_metadata
        )
        
        # 4. Update session metadata
        session.current_stage = 'problem_capture'
        session.stage_progress = 0.3
        session.conversation_health = 'good'
        session.business_context = ai_metadata['business_context']
        session.save()
        
        # 5. Verify state
        self.assertEqual(session.message_count, 2)
        self.assertEqual(session.current_stage, 'problem_capture')
        self.assertEqual(session.progress_percentage, 30)
        
        # 6. Verify messages are ordered correctly
        messages = list(session.messages.all())
        self.assertEqual(messages[0].content, 'I want to build a food delivery app')
        self.assertEqual(messages[1].content, 'That\'s interesting! What problem does your app solve?')
```

### Frontend Testing
```typescript
// Test Setup (vitest.config.ts)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

// Test Setup File (src/test/setup.ts)
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Component Tests (src/components/chat/__tests__/ChatInterface.test.tsx)
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatInterface } from '../ChatInterface';
import { chatApi } from '@/services/chatApi';

// Mock the chat API
vi.mock('@/services/chatApi', () => ({
  chatApi: {
    getChatSession: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ChatInterface', () => {
  const mockSession = {
    id: '123',
    title: 'Test Session',
    status: 'active',
    current_stage: 'user_profiling',
    stage_progress: 0.3,
    conversation_health: 'good',
    messages: [
      {
        id: '1',
        role: 'user' as const,
        content: 'Hello',
        sequence_number: 1,
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        role: 'assistant' as const,
        content: 'Hi there!',
        sequence_number: 2,
        created_at: '2024-01-01T10:01:00Z',
        ai_metadata: {
          stage: 'user_profiling',
          confidence: 0.8,
        },
      },
    ],
  };

  beforeEach(() => {
    vi.mocked(chatApi.getChatSession).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat interface with messages', async () => {
    render(
      <ChatInterface sessionId="123" />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });

  it('sends message when form is submitted', async () => {
    const mockSendMessage = vi.mocked(chatApi.sendMessage);
    mockSendMessage.mockResolvedValue({
      user_message: {
        id: '3',
        role: 'user',
        content: 'Test message',
        sequence_number: 3,
        created_at: '2024-01-01T10:02:00Z',
      },
      ai_message: {
        id: '4',
        role: 'assistant',
        content: 'AI response',
        sequence_number: 4,
        created_at: '2024-01-01T10:02:30Z',
        ai_metadata: {},
      },
      session: mockSession,
    });

    render(
      <ChatInterface sessionId="123" />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('123', {
        content: 'Test message',
        message_type: 'text',
      });
    });
  });

  it('displays loading state while sending message', async () => {
    const mockSendMessage = vi.mocked(chatApi.sendMessage);
    mockSendMessage.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <ChatInterface sessionId="123" />,
      { wrapper: createWrapper() }
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    expect(sendButton).toBeDisabled();
    expect(screen.getByText(/sending/i)).toBeInTheDocument();
  });
});

// Hook Tests (src/hooks/__tests__/useConversationHealth.test.ts)
import { renderHook } from '@testing-library/react';
import { useConversationHealth } from '../useConversationHealth';

describe('useConversationHealth', () => {
  it('returns default values when session is null', () => {
    const { result } = renderHook(() => useConversationHealth(null));

    expect(result.current).toEqual({
      health: 'unknown',
      momentum: 0,
      velocity: 0,
      issues: [],
      suggestions: [],
    });
  });

  it('extracts health data from session metadata', () => {
    const mockSession = {
      id: '123',
      ai_metadata: {
        conversation_health: 'good',
        conversation_momentum: 0.75,
        progress_velocity: 0.8,
        flow_issues: ['issue1'],
        quality_metrics: {
          intervention_suggestions: ['suggestion1', 'suggestion2'],
        },
      },
    };

    const { result } = renderHook(() => 
      useConversationHealth(mockSession as any)
    );

    expect(result.current).toEqual({
      health: 'good',
      momentum: 0.75,
      velocity: 0.8,
      issues: ['issue1'],
      suggestions: ['suggestion1', 'suggestion2'],
    });
  });
});

// E2E Tests (e2e/chat-workflow.spec.ts)
import { test, expect } from '@playwright/test';

test.describe('Chat Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test('should create new chat session and send message', async ({ page }) => {
    // Create new session
    await page.click('[data-testid="new-chat-button"]');
    
    // Fill session details
    await page.fill('[data-testid="session-title"]', 'Test Business Idea');
    await page.selectOption('[data-testid="template-select"]', 'business_idea');
    await page.click('[data-testid="create-session-button"]');
    
    // Wait for chat interface
    await page.waitForSelector('[data-testid="chat-interface"]');
    
    // Send first message
    await page.fill('[data-testid="message-input"]', 'I want to build a food delivery app');
    await page.click('[data-testid="send-button"]');
    
    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-message"]');
    
    // Verify message appears
    await expect(page.locator('[data-testid="user-message"]')).toContainText(
      'I want to build a food delivery app'
    );
    
    // Verify AI response
    await expect(page.locator('[data-testid="ai-message"]')).toBeVisible();
    
    // Verify progress meter updates
    await expect(page.locator('[data-testid="progress-meter"]')).toBeVisible();
  });

  test('should display conversation health indicators', async ({ page }) => {
    // Navigate to existing session
    await page.click('[data-testid="session-item"]');
    
    // Verify health indicators are visible
    await expect(page.locator('[data-testid="health-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="momentum-meter"]')).toBeVisible();
    await expect(page.locator('[data-testid="velocity-indicator"]')).toBeVisible();
    
    // Check if AI transparency panel can be opened
    await page.click('[data-testid="ai-transparency-toggle"]');
    await expect(page.locator('[data-testid="ai-transparency-panel"]')).toBeVisible();
  });
});
```

## 🔍 Debugging Guide

### Backend Debugging
```python
# Debug Settings (config/settings/development.py)
DEBUG = True
DEBUG_TOOLBAR_CONFIG = {
    'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
}

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/django.log',
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'maglabs': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/maglabs.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'apps': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'services.ai_services': {
            'handlers': ['maglabs', 'console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Debug Tools
# apps/common/debug.py

import logging
import time
import functools
from django.conf import settings

logger = logging.getLogger(__name__)

def debug_api_call(func):
    """Decorator to debug API calls"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if settings.DEBUG:
            start_time = time.time()
            logger.debug(f"Starting {func.__name__} with args: {args}, kwargs: {kwargs}")
            
            try:
                result = func(*args, **kwargs)
                end_time = time.time()
                logger.debug(f"{func.__name__} completed in {end_time - start_time:.2f}s")
                return result
            except Exception as e:
                end_time = time.time()
                logger.error(f"{func.__name__} failed after {end_time - start_time:.2f}s: {e}")
                raise
        else:
            return func(*args, **kwargs)
    
    return wrapper

def log_tenant_context(func):
    """Decorator to log tenant context"""
    @functools.wraps(func)
    def wrapper(request, *args, **kwargs):
        from django_tenants.utils import get_tenant
        
        tenant = get_tenant(request)
        logger.debug(f"Request for tenant: {tenant.schema_name}")
        
        return func(request, *args, **kwargs)
    
    return wrapper

# Management Command for Debugging
# apps/common/management/commands/debug_tenant.py

from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context, get_tenant_model
from apps.ideas.models import ChatSession, ChatMessage

class Command(BaseCommand):
    help = 'Debug tenant data'
    
    def add_arguments(self, parser):
        parser.add_argument('--schema', required=True, help='Tenant schema name')
    
    def handle(self, *args, **options):
        schema_name = options['schema']
        
        try:
            Tenant = get_tenant_model()
            tenant = Tenant.objects.get(schema_name=schema_name)
            
            with schema_context(schema_name):
                sessions = ChatSession.objects.count()
                messages = ChatMessage.objects.count()
                
                self.stdout.write(f"Tenant: {tenant.name}")
                self.stdout.write(f"Schema: {schema_name}")
                self.stdout.write(f"Sessions: {sessions}")
                self.stdout.write(f"Messages: {messages}")
                
                # Show recent sessions
                recent_sessions = ChatSession.objects.order_by('-created_at')[:5]
                
                self.stdout.write("\nRecent Sessions:")
                for session in recent_sessions:
                    self.stdout.write(
                        f"  {session.id}: {session.title} ({session.message_count} messages)"
                    )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error debugging tenant {schema_name}: {e}")
            )

# Debug Views for Development
# apps/common/debug_views.py

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django_tenants.utils import get_tenant
from apps.ideas.models import ChatSession, ChatMessage

@require_http_methods(["GET"])
def debug_tenant_info(request):
    """Debug endpoint for tenant information"""
    if not settings.DEBUG:
        return JsonResponse({'error': 'Debug mode not enabled'}, status=403)
    
    tenant = get_tenant(request)
    
    data = {
        'tenant_name': tenant.name,
        'schema_name': tenant.schema_name,
        'session_count': ChatSession.objects.count(),
        'message_count': ChatMessage.objects.count(),
        'request_headers': dict(request.headers),
        'request_meta': {
            'HTTP_X_TENANT_NAME': request.META.get('HTTP_X_TENANT_NAME'),
            'HTTP_HOST': request.META.get('HTTP_HOST'),
        }
    }
    
    return JsonResponse(data)

@require_http_methods(["GET"])
def debug_session_metadata(request, session_id):
    """Debug endpoint for session metadata"""
    if not settings.DEBUG:
        return JsonResponse({'error': 'Debug mode not enabled'}, status=403)
    
    try:
        session = ChatSession.objects.get(id=session_id)
        
        # Get latest AI message metadata
        latest_ai_message = session.messages.filter(
            role='assistant'
        ).order_by('-sequence_number').first()
        
        data = {
            'session': {
                'id': str(session.id),
                'title': session.title,
                'current_stage': session.current_stage,
                'stage_progress': session.stage_progress,
                'conversation_health': session.conversation_health,
                'maglabs_session_id': session.maglabs_session_id,
                'business_context': session.business_context,
            },
            'latest_ai_metadata': latest_ai_message.ai_metadata if latest_ai_message else None,
            'message_count': session.message_count,
            'total_tokens': session.total_tokens_used,
        }
        
        return JsonResponse(data)
        
    except ChatSession.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)
```

### Frontend Debugging
```typescript
// Debug Utilities (src/utils/debug.ts)
export const DEBUG = import.meta.env.DEV;

export const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

export const debugError = (message: string, error?: any) => {
  if (DEBUG) {
    console.error(`[DEBUG ERROR] ${message}`, error);
  }
};

export const debugApiCall = (endpoint: string, method: string, data?: any) => {
  if (DEBUG) {
    console.group(`[API] ${method} ${endpoint}`);
    if (data) {
      console.log('Request data:', data);
    }
    console.groupEnd();
  }
};

// React DevTools Integration
export const debugComponent = (componentName: string, props?: any, state?: any) => {
  if (DEBUG && typeof window !== 'undefined') {
    (window as any).__REACT_DEVTOOLS_DEBUG__ = {
      component: componentName,
      props,
      state,
      timestamp: new Date().toISOString(),
    };
  }
};

// Debug Provider (src/providers/DebugProvider.tsx)
import React, { createContext, useContext, useEffect, useState } from 'react';

interface DebugContextType {
  isDebugMode: boolean;
  debugInfo: Record<string, any>;
  addDebugInfo: (key: string, value: any) => void;
  clearDebugInfo: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    // Enable debug mode with URL parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    const debugStored = localStorage.getItem('debug-mode');
    
    if (debugParam === 'true' || debugStored === 'true') {
      setIsDebugMode(true);
    }
  }, []);

  const addDebugInfo = (key: string, value: any) => {
    setDebugInfo(prev => ({ ...prev, [key]: value }));
  };

  const clearDebugInfo = () => {
    setDebugInfo({});
  };

  return (
    <DebugContext.Provider value={{
      isDebugMode,
      debugInfo,
      addDebugInfo,
      clearDebugInfo,
    }}>
      {children}
      {isDebugMode && <DebugPanel />}
    </DebugContext.Provider>
  );
};

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};

// Debug Panel Component
const DebugPanel: React.FC = () => {
  const { debugInfo, clearDebugInfo } = useDebug();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        Debug {isOpen ? '▼' : '▲'}
      </button>
      
      {isOpen && (
        <div className="mt-2 bg-black text-green-400 p-4 rounded-lg shadow-lg max-w-md max-h-96 overflow-auto font-mono text-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Debug Info</h3>
            <button
              onClick={clearDebugInfo}
              className="text-red-400 hover:text-red-300"
            >
              Clear
            </button>
          </div>
          
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// API Client with Debug Logging
export class DebugApiClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    debugApiCall(endpoint, options.method || 'GET', options.body);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      const data = await response.json();
      
      if (DEBUG) {
        console.log(`[API Response] ${endpoint}:`, data);
      }
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return data;
    } catch (error) {
      debugError(`API call failed: ${endpoint}`, error);
      throw error;
    }
  }
}

// Debug Hook for Chat State
export const useChatDebug = (sessionId: string) => {
  const { addDebugInfo } = useDebug();
  const { data: session } = useChatSession(sessionId);
  
  useEffect(() => {
    if (session) {
      addDebugInfo('currentSession', {
        id: session.id,
        title: session.title,
        stage: session.current_stage,
        progress: session.stage_progress,
        health: session.conversation_health,
        messageCount: session.message_count,
        tokensUsed: session.total_tokens_used,
      });
    }
  }, [session, addDebugInfo]);
  
  useEffect(() => {
    addDebugInfo('chatMetrics', {
      sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }, [sessionId, addDebugInfo]);
};
```

This comprehensive developer reference covers all aspects of working with the MagLabs multi-tenant application, from architecture and setup to testing and debugging. It serves as both a learning resource for new developers and a reference guide for experienced team members.