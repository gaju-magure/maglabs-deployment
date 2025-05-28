# 👑 **Tenant Admin (Company Super Admin) Journey**

The **Tenant Admin** is responsible for managing everything  **within their organization’s instance** : onboarding users, configuring AI settings, managing ideas, and driving engagement.

---

## 🔐 1. **Secure Login / SSO**

* **Path:** `tenant-name.maglabs.ai/admin`
* **Auth:**
  * Via company SSO (SAML/OAuth)
  * Or email/password with 2FA (fallback)
* **Outcome:** Access to company-specific admin panel

---

## 🏢 2. **Tenant Profile Setup**

### 🔧 Initial Configuration

* Upload branding (logo, colors)
* Define business vertical (for AI prompt tuning)
* Add company metadata:
  * Industry type
  * Employee size
  * Existing systems (CRM, ERP, HCM)
* Set time zone and language preferences

✅ **Result:** Tailored GenAI experience for the company

---

## 👥 3. **User Management**

* **Actions:**
  * Add employees manually or via bulk upload
  * Integrate with identity provider (e.g., Okta, Azure AD)
  * Assign roles:
    * **Ideator (default)**
    * **Reviewer / Evaluator**
    * **Department Admins**
* **Permissions:**
  * Configure who can view what (department, region)

✅ **Result:** Controlled access and secure segmentation

---



## 🧠 4. **Prompt Management (Optional)**

* View pre-loaded prompts by Magure Admin
* **Customize** prompts for:
  * Submission clarification
  * Refinement questions
  * Business context interrogation
* Save prompt sets per department (Sales, Ops, IT)

✅ **Result:** AI speaks the tenant’s language

---

## 🧮 5. **AI Scoring Tuning**

* Adjust scoring weights:
  * **Clarity:** 30–50%
  * **Value:** 30–60%
  * **Complexity:** 10–40%
* Configure thresholds for "High Potential" flags
* Enable/disable AI suggestions

✅ **Result:** Tailored evaluation model

---

## 🧩 6. **Feature Toggles / Module Controls**

* Enable or disable:
  * Gamification
  * Leaderboards
  * Content Wall
  * Anonymous submissions
* Choose submission types:
  * **Ideas**
  * **Problem Statements**
* Limit who can score (AI-only, human, both)

✅ **Result:** Experience fits company culture

---

## 📣 7. **Campaign Management (Optional)**

* Create time-bound ideation campaigns
  * e.g., "Q1 Cost Saving Drive"
* Assign tags, themes, target departments
* Send nudges to low-engagement teams

✅ **Result:** Targeted innovation drives

---

## 🧾 8. **Submission Moderation & Oversight**

* View all employee submissions
* Filter by:
  * Status (Pending, Reviewed, Implemented)
  * Score thresholds
  * Department
* Override or validate AI scores
* Comment or tag for review/escalation

✅ **Result:** Hands-on innovation governance

---

## 🏆 9. **Gamification Management**

* Configure:
  * Points for actions (submissions, votes, comments)
  * Milestones and badges
* Moderate leaderboard (reset, hide)
* Recognize top contributors

✅ **Result:** Keeps employees engaged

---

## 📊 10. **Analytics Dashboard**

* Metrics:
  * Submissions over time
  * Departmental engagement
  * Average scores by category
  * Implementation rates
* Export data for leadership

✅ **Result:** Track ROI on innovation

---

## 🛡️ 11. **Compliance / Audit View**

* View:
  * Submission history logs
  * AI scoring logs
  * Who viewed / reviewed what
* Download export of activity logs

✅ **Result:** Audit readiness and policy alignment

---

## 🧪 Real-World Journey (Story Flow)

1. **Priya (Tenant Admin at FinSolve Inc)** logs in
2. Uploads logo + selects “Fintech” domain
3. Configures SSO via Okta + adds 5 dept leads
4. Enables “Problem Statement” only mode for 2 weeks
5. Creates “Jan ’25 Innovation Challenge”
6. AI auto-scores 140 submissions → Priya filters top 10
7. Shares dashboard in town hall to showcase contributors
8. Adjusts scoring weight mid-cycle for better impact

---

## ✍️ Summary of Responsibilities

| Area            | Actions                                          |
| --------------- | ------------------------------------------------ |
| User Management | Add, assign roles, sync with SSO                 |
| AI Settings     | Adjust prompts and scoring logic                 |
| Feature Toggles | Enable/disable modules                           |
| Campaigns       | Create, manage, track                            |
| Moderation      | Review & validate submissions                    |
| Analytics       | View metrics and performance by dept, tag, score |
| Compliance      | Audit logs, export activities                    |
