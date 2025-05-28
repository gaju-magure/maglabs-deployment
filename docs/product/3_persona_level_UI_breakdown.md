
# 👤 **1. Employee (Ideator)**

### 🔓 Access

* Auth via SSO
* Role: `ROLE_IDEATOR`
* Redirects to: `/dashboard/submit`

### 🧭 Primary Views

* Submit Idea / Problem Form
* Conversational AI Chat UI
* Personal Submissions (with AI Scores)
* Content Wall

### 🧰 Functional Modules

| Feature                       | Description                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| **Submit Idea/Problem** | Starts with a 2-option prompt. Launches AI chat with prompts like "What’s the current bottleneck?" |
| **AI Refinement**       | Uses OpenAI/Gemini chat completion + custom prompts per tenant to structure the input.              |
| **View AI Scores**      | Clarity, Value, Complexity scores rendered via radar chart.                                         |
| **Gamification**        | Earns points for submissions, feedback, votes. Shows badges like “AI Whisperer”.                  |
| **Content Wall Feed**   | View ideas from peers. Upvote and comment. Uses Feed API with filter/search.                        |

### 📦 Backend Endpoints

| Action                    | Endpoint                        |
| ------------------------- | ------------------------------- |
| Submit Idea               | `POST /ideas`                 |
| AI Conversation           | `POST /ai/refine`             |
| Fetch My Submissions      | `GET /ideas/me`               |
| Get My Gamification Stats | `GET /gamification/me`        |
| Post to Content Wall      | `POST /wall/comments/:ideaId` |

---

# 💼 **2. C-Suite / Digital Transformation**

### 🔓 Access

* Auth via SSO
* Role: `ROLE_EXECUTIVE`
* Redirects to: `/dashboard/insights`

### 🧭 Primary Views

* Executive Dashboard (High-scoring ideas, filters)
* AI Recommendations (use case, tech, integration)
* Approve / Tag Ideas

### 🧰 Functional Modules

| Feature                         | Description                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| **Filter Submissions**    | Filters: Department, Score threshold, Tags                        |
| **AI-Generated Insights** | Shows recommended stack, feasibility, related use cases           |
| **Decision Layer**        | Mark as "For Review", "Prototype", or "Not Feasible"              |
| **Download Reports**      | Export high-impact ideas to CSV/PDF or via Slack webhook          |
| **Track Trends**          | Weekly idea growth, strategic theme performance, engagement stats |

### 📦 Backend Endpoints

| Action              | Endpoint                           |
| ------------------- | ---------------------------------- |
| View All Ideas      | `GET /ideas?score>7&sort=value`  |
| View AI Suggestions | `GET /ideas/:id/recommendations` |
| Approve Idea        | `PATCH /ideas/:id/status`        |
| Export Reports      | `GET /reports?type=exec_summary` |
| Filtered Dashboard  | `GET /dashboard/exec?filters={}` |

---

# 🛠️ **3. Magure (Tenant Admin / Super Admin)**

### 🔓 Access

* Auth via SSO or Password Auth (Admin Interface)
* Roles: `ROLE_TENANT_ADMIN`, `ROLE_PLATFORM_ADMIN`
* Redirects to: `/admin/tenants` or `/admin/config`

### 🧭 Primary Views

* Tenant Overview
* Feature Toggles per Tenant
* Prompt Builder
* AI Weight Adjustments
* User Role Management

### 🧰 Functional Modules

| Feature                             | Description                                                     |
| ----------------------------------- | --------------------------------------------------------------- |
| **Tenant Config Dashboard**   | Customize branding, prompt templates, feature toggles.          |
| **Score Weights Editor**      | Adjust Clarity/Value/Complexity multipliers per tenant.         |
| **Prompt Editor**             | Modify AI prompts per module (submission, scoring, suggestion). |
| **SSO/SSO Offboarding Tools** | Connect tenant IdP using SAML/OIDC; remove expired sessions.    |
| **Usage/Analytics**           | Graph of engagement, idea volume, AI interactions per tenant.   |

### 📦 Backend Endpoints

| Action                  | Endpoint                                  |
| ----------------------- | ----------------------------------------- |
| View Tenant Config      | `GET /admin/tenants/:id`                |
| Update Scoring Weights  | `PATCH /admin/tenants/:id/scoring`      |
| Modify Prompt Templates | `PUT /admin/tenants/:id/prompts`        |
| Add/Edit Tenant Users   | `POST /admin/tenants/:id/users`         |
| Get Engagement Metrics  | `GET /analytics/tenants/:id/engagement` |

---

## 🔐 RBAC Summary

| Role                    | Capabilities                        |
| ----------------------- | ----------------------------------- |
| `ROLE_IDEATOR`        | Submit, View, Comment, Earn points  |
| `ROLE_EXECUTIVE`      | Filter, Review, Tag ideas           |
| `ROLE_TENANT_ADMIN`   | Config tenant prompts, weights, SSO |
| `ROLE_PLATFORM_ADMIN` | View and manage all tenants         |
