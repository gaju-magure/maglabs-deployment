# Implementation Roadmap

This document outlines the technical implementation plan for upgrading the Magure Idea Hub to a full-featured, multi-agent AI platform.

## Phase 1: Foundation (Weeks 1-2)

### 1.1 Taxonomy Source of Truth
**Epic:** Convert idea categories from markdown to structured data  
**Priority:** P0 (Blocking)  
**Estimate:** 3 days

**Tasks:**
- [ ] **feat/taxonomy-yaml** - Parse `docs/explanation/idiea-categories.md` into structured YAML
- [ ] **feat/db-categories** - Create Supabase migration `00005_create_categories_table.sql`
- [ ] **feat/api-categories** - Implement `GET /api/v1/categories` endpoint
- [ ] **test/categories** - Unit and integration tests for category management
- [ ] **docs/taxonomy** - Update API documentation

**Acceptance Criteria:**
- Categories loaded from database, not hardcoded
- Frontend CategorySelector fetches from API
- Category metadata includes capture_fields, screen_rules, eval_weights
- RLS policies protect category access by organization

### 1.2 ROI Service Infrastructure
**Epic:** Implement ROI calculation and value score normalization  
**Priority:** P0 (Blocking)  
**Estimate:** 4 days

**Tasks:**
- [ ] **feat/roi-service** - Create `services/roi_service.py` with calculation logic
- [ ] **feat/value-bands-api** - Implement `PATCH /api/v1/ideas/{id}/value` endpoint
- [ ] **feat/nightly-job** - Supabase cron function for percentile recalculation
- [ ] **feat/value-score-table** - Migration for `idea_value_scores` history table
- [ ] **test/roi-pipeline** - Comprehensive test suite for ROI calculations

**Acceptance Criteria:**
- Users can submit value band selections via UI
- ROI index calculated using documented formula
- Nightly job recalculates percentile-based value scores
- Value score history maintained for analytics

### 1.3 LiteLLM Integration
**Epic:** Replace direct Gemini SDK with provider abstraction  
**Priority:** P1 (High)  
**Estimate:** 3 days

**Tasks:**
- [ ] **refactor/litellm-core** - Replace `ai_service.py` Gemini calls with LiteLLM
- [ ] **feat/provider-config** - Environment variable mapping for multiple providers
- [ ] **feat/model-selection** - Category-specific model selection logic
- [ ] **test/ai-providers** - Test suite for multiple AI providers
- [ ] **docs/ai-config** - Documentation for AI provider configuration

**Acceptance Criteria:**
- Support for Gemini, OpenAI, Anthropic via single interface
- Category-specific model selection (e.g., Claude for legal review)
- Graceful fallbacks when primary provider fails
- Token usage and cost tracking

## Phase 2: CrewAI Orchestration (Weeks 3-4)

### 2.1 CrewAI Foundation
**Epic:** Bootstrap CrewAI infrastructure and basic flows  
**Priority:** P0 (Blocking)  
**Estimate:** 5 days

**Tasks:**
- [ ] **feat/crewai-setup** - Add CrewAI dependency and basic configuration
- [ ] **feat/agent-definitions** - Define core agents (Intake, Enrichment, Categorization)
- [ ] **feat/capture-flow** - Implement Capture flow with basic orchestration
- [ ] **feat/crew-triggers** - API endpoints to trigger CrewAI flows
- [ ] **test/crewai-basic** - Basic flow execution tests

**Acceptance Criteria:**
- CrewAI agents can be instantiated and execute basic tasks
- Capture flow processes new idea submissions
- Agents use LiteLLM for AI provider abstraction
- Flow state tracked in database

### 2.2 Advanced Workflows
**Epic:** Implement Screening, Evaluation, and Approval flows  
**Priority:** P1 (High)  
**Estimate:** 6 days

**Tasks:**
- [ ] **feat/screening-flow** - Automated screening with duplicate detection
- [ ] **feat/evaluation-flow** - Human-in-the-loop evaluation workflow
- [ ] **feat/approval-flow** - Final approval and routing logic
- [ ] **feat/agent-specialization** - Category-specific agent behavior
- [ ] **feat/webhooks** - Async webhook system for flow callbacks

**Acceptance Criteria:**
- Ideas automatically progress through screening
- Human evaluators receive notifications for review
- Approval routing based on category governance rules
- Real-time UI updates via Supabase subscriptions

## Phase 3: Frontend Integration (Weeks 5-6)

### 3.1 API Migration
**Epic:** Migrate frontend from localStorage to API persistence  
**Priority:** P1 (High)  
**Estimate:** 4 days

**Tasks:**
- [ ] **refactor/fe-api-sync** - Replace localStorage with API calls
- [ ] **feat/realtime-updates** - Supabase real-time subscriptions
- [ ] **feat/auth-integration** - Complete Supabase Auth integration
- [ ] **feat/error-handling** - Comprehensive error handling and retry logic
- [ ] **test/fe-integration** - End-to-end testing with real backend

**Acceptance Criteria:**
- Ideas persist across browser sessions and devices
- Real-time updates when ideas change status
- Proper authentication and authorization
- Graceful handling of network errors

### 3.2 Enhanced UX
**Epic:** Improve user experience with new features  
**Priority:** P2 (Medium)  
**Estimate:** 3 days

**Tasks:**
- [ ] **feat/dynamic-categories** - Dynamic category loading from API
- [ ] **feat/roi-wizard** - Enhanced ROI band selection UI
- [ ] **feat/status-tracking** - Visual pipeline progress indicators
- [ ] **feat/notifications** - In-app notifications for status changes
- [ ] **feat/dashboard-metrics** - Basic analytics dashboard

**Acceptance Criteria:**
- Category selector populated from database
- ROI wizard shows real-time calculations
- Users can track idea progress visually
- Key metrics displayed on dashboard

## Phase 4: Production Readiness (Weeks 7-8)

### 4.1 Monitoring & Observability
**Epic:** Production monitoring and debugging capabilities  
**Priority:** P1 (High)  
**Estimate:** 3 days

**Tasks:**
- [ ] **feat/structured-logging** - Comprehensive logging throughout application
- [ ] **feat/metrics-collection** - Application metrics and performance monitoring
- [ ] **feat/error-tracking** - Error tracking and alerting system
- [ ] **feat/flow-observability** - CrewAI flow monitoring and debugging
- [ ] **docs/operations** - Operational runbooks and troubleshooting guides

### 4.2 Security & Performance
**Epic:** Production security and performance optimization  
**Priority:** P1 (High)  
**Estimate:** 4 days

**Tasks:**
- [ ] **feat/rate-limiting** - API rate limiting and abuse protection
- [ ] **feat/input-validation** - Enhanced input validation and sanitization
- [ ] **feat/security-headers** - Security headers and CORS configuration
- [ ] **perf/query-optimization** - Database query optimization
- [ ] **perf/caching** - Caching strategy for API responses

### 4.3 CI/CD Pipeline
**Epic:** Automated testing and deployment  
**Priority:** P1 (High)  
**Estimate:** 3 days

**Tasks:**
- [ ] **ci/github-actions** - GitHub Actions pipeline setup
- [ ] **ci/automated-testing** - Comprehensive test automation
- [ ] **ci/deployment** - Automated deployment to staging/production
- [ ] **ci/quality-gates** - Code quality and security scanning
- [ ] **docs/deployment** - Deployment documentation and procedures

## Risk Mitigation

### Technical Risks
1. **CrewAI Learning Curve** - Mitigate with proof-of-concept and documentation
2. **LiteLLM Provider Issues** - Implement robust fallback mechanisms
3. **Database Performance** - Monitor query performance and optimize indexes
4. **Real-time Updates** - Test Supabase subscriptions under load

### Timeline Risks
1. **Scope Creep** - Strict feature prioritization and MVP focus
2. **Integration Complexity** - Incremental integration with rollback plans
3. **Testing Overhead** - Parallel test development with feature work

## Success Metrics

### Phase 1 Success Criteria
- [ ] Categories loaded dynamically from database
- [ ] ROI calculations working with nightly normalization
- [ ] Multiple AI providers functional via LiteLLM

### Phase 2 Success Criteria
- [ ] Ideas automatically progress through CrewAI flows
- [ ] Human evaluators can complete reviews via UI
- [ ] Real-time status updates functioning

### Phase 3 Success Criteria
- [ ] Frontend completely migrated from localStorage
- [ ] Users can submit and track ideas end-to-end
- [ ] Authentication and authorization working

### Phase 4 Success Criteria
- [ ] Production deployment with monitoring
- [ ] Performance meets requirements (< 2s page load)
- [ ] CI/CD pipeline fully automated

## Dependencies

### External Dependencies
- Supabase platform stability and performance
- LiteLLM provider availability and reliability
- CrewAI framework updates and bug fixes

### Internal Dependencies
- Database schema finalization
- Category taxonomy completion
- UI/UX design decisions

This roadmap provides a structured approach to implementing the enhanced Magure Idea Hub while maintaining system stability and ensuring quality deliverables.
