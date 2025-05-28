
# 🧭 Magure Admin Journey (Super Admin of the Platform)

The **Magure Admin** (also referred to as Platform Admin or Super Admin) is responsible for  **managing the entire multi-tenant platform** , configuring tenant-specific settings, scoring logic, AI prompt management, analytics, and compliance controls.

---

## 🔐 1. **Login via Admin SSO (Optional)**

* **Action:** Log in via the dedicated Magure Admin panel (e.g., `admin.maglabs.ai`)
* **Tech:** SSO (OIDC / SAML) or secure password login
* **Outcome:** Magure dashboard access with full tenant visibility

---

## 🏢 2. **Tenant Management**

### ➕ Create a New Tenant

* **Input:**
  * Company Name
  * Logo & Brand colors
  * Industry type
  * ERP/CRM systems used
  * Estimated employee count
* **Actions:**
  * Assign a Tenant Admin (e.g., Acme Admin)
  * Choose enabled modules (e.g., Gamification ON, Wall OFF)
  * Configure SSO for the tenant (SAML, OAuth)

✅ Result: A separate, isolated tenant environment is provisioned

---

## ⚙️ 3. **Platform Feature Configuration (Per Tenant)**

* Enable/disable modules:
  * 🧩 Ideation / Problem submission
  * 🧠 AI refinement
  * 🧪 Scoring engine
  * 🏆 Gamification
  * 🧱 Content wall
* Toggle features per tenant based on plan/subscription or customer preference

✅ Result: Each tenant’s environment is personalized and isolated.

---

## 🧠 4. **Prompt Management (AI Layer)**

* **Actions:**
  * Customize or upload prompt templates:
    * Idea refinement
    * Business context probing
    * Tech recommendation
  * Assign prompt variants based on tenant’s vertical (e.g., Finance, Manufacturing)

✅ Result: Each tenant can have domain-specific GenAI behavior.

---

## 🧮 5. **Scoring Engine Configuration**

* **Actions:**
  * Adjust scoring weights per tenant:
    * Clarity (40%), Value (40%), Complexity (20%)
    * Sustainability-focused tenant: Increase Value weight
  * Manage thresholds for "high impact" ideas

✅ Result: AI-scored ideas align with business priorities per tenant.

---

## 📊 6. **Analytics Dashboard**

* **Metrics:**
  * Total ideas submitted
  * Engagement rate (by department/region)
  * AI scoring distribution
  * Leaderboard across tenants (internal only)
* **Views:**
  * Filter by time range, tenant, module usage
  * Export analytics for presentations

✅ Result: Insightful overview of platform usage, innovation engagement

---

## 🔐 7. **Compliance & Audit Controls**

* **Actions:**
  * View audit logs (who submitted what, AI interaction logs)
  * Configure data retention policies per tenant
  * Define export controls for tenant data
* **Docs:**
  * Attach data privacy documents (e.g., UAE Privacy Handbook compliance)

✅ Result: Platform stays compliant across regions and industries

---

## 📣 8. **Platform-wide Notifications**

* Send platform-wide notices (e.g., downtime, updates)
* Alert tenant admins via email/in-app banners
* Manage email templates and triggers

---

## 👤 9. **Magure Admin Actions Summary**

| Function             | Example Task                                        |
| -------------------- | --------------------------------------------------- |
| Tenant Provisioning  | Onboard Acme Inc with their own admin and modules   |
| Feature Toggle       | Disable gamification for GovTech Corp               |
| Prompt Customization | Use “Healthcare” prompt set for MediCorp tenant   |
| Score Logic Tuning   | Increase “Value” weight for ESG-focused companies |
| Analytics            | Check who submitted most ideas across all tenants   |
| Compliance           | Review audit trail for idea scoring on Jan 1, 2025  |

---

## 🔄 Real Life Example Workflow

1. **Admin logs in** at `admin.maglabs.ai`
2. Clicks “Create Tenant” → Onboards “NeoBank Ltd.”
3. Uploads logo and sets scoring logic to value-heavy
4. Enables SSO via Okta (client provides metadata)
5. Customizes prompts to align with FinTech domain
6. Logs in a week later → sees 40% engagement from NeoBank employees
7. Downloads CSV report for pitch deck
