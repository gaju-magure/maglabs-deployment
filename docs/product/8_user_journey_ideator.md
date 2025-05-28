
# 🧑‍💡 **Employee (Ideator) Journey**

The **Employee** is the core contributor who brings ideas or pain points from the ground level. The goal is to make ideation simple, engaging, and rewarding using conversational AI, gamification, and visibility.

---

## 🚪 1. **Login & Access**

* **Via SSO** (Okta, Azure AD, etc.)
* User lands on **"My Ideas"** dashboard
* Role: `employee_ideator`
* Permissions: Submit, view own ideas, interact on content wall, participate in gamification

✅ **Result:** Personalized entry point with quick access to idea tools

---

## ➕ 2. **Start Submission**

**Prompted with two clear options:**

* 🧠 **Submit an Idea**
* ❗ **Report a Problem**

System then transitions into a  **Conversational AI interface** .

---

## 💬 3. **Conversational AI Refinement**

A **Gen AI chatbot** (e.g., using OpenAI GPT-4-turbo) engages the user:

### Example Chat:

> **AI:** "What’s the core of your idea?"
>
> **User:** "Approval processes are slow."
>
> **AI:** "Which team or department? How long does it take now?"
>
> **User:** "Finance team takes 7 days for CapEx approvals."

🎯 **Output:**

* Structured title
* Clear problem statement
* Business impact
* Affected stakeholders

✅ **Result:** Unclear thoughts become well-formed ideas/problems

---

## 📊 4. **AI-Powered Scoring (Instant Feedback)**

After submission:

* AI assigns scores for:
  * **Clarity** (how well articulated)
  * **Value** (business impact)
  * **Complexity** (feasibility)
* Visual feedback (radar or bar chart)

🎯 *Example Scores:*

* Clarity: 9/10
* Value: 8/10
* Complexity: 5/10

✅ **Result:** User knows how strong their submission is, and how to improve it

---

## 🪄 5. **Suggestions & Tips**

AI suggests improvements:

> "To increase your idea’s impact, consider proposing an automation tool such as Power Automate."

And even:

* “Add metrics (e.g., cost of delay per day)”
* “Mention if other teams face the same”

✅ **Result:** Continuous learning experience for employees

---

## 🏆 6. **Gamification & Badges**

Every submission or interaction:

* 🎯 Earns points
* 🏅 Unlocks badges (e.g., “First Idea”, “AI Whisperer”)
* 📈 Appears on leaderboards (team-wise, company-wide)

Examples:

| Badge            | Trigger                       |
| ---------------- | ----------------------------- |
| "Top Ideator"    | 5+ submissions with Value > 7 |
| "Most Discussed" | Idea with 10+ comments        |
| "Most Upvoted"   | 20+ peer upvotes              |

✅ **Result:** Boosts motivation and creates fun competition

---

## 🌐 7. **Content Wall Interaction**

After submission:

* Idea is posted to **Content Wall** (based on visibility settings)
* Employees can:
  * Comment
  * Upvote
  * Get AI-generated summaries of others’ ideas

✅ **Result:** Transparent innovation culture and peer collaboration

---

## 📋 8. **Track & View My Submissions**

* **My Dashboard** shows:
  * Submitted ideas
  * AI scores
  * Status (Under Review, Approved, Prototype, Archived)
  * Engagement metrics (comments, upvotes)
  * Admin/C-suite feedback (if any)

✅ **Result:** Visibility into personal innovation footprint

---

## 🧾 9. **Example Journey: End to End**

1. **Amandeep** , from IT, logs in via SSO
2. Chooses **"Report a Problem"**
3. Talks to the AI:
   * “Too many tool logins”
   * AI clarifies: “SSO not implemented across tools?”
4. Final submission:
   > “Lack of unified login causes productivity loss. 4 tools require separate login.”
   >
5. AI scores:
   * Clarity: 9
   * Value: 7
   * Complexity: 6
6. Idea posted to wall, earns 12 upvotes
7. Appears on **“Top Ideas This Month”** list
8. Gets badge: 🏅 “Well Articulated”
9. C-Suite sees it, marks for implementation

✅ **Result:** Problem becomes opportunity → solution → impact

---

## 🎯 Summary Capabilities

| Capability          | Description                 |
| ------------------- | --------------------------- |
| Submit Idea/Problem | With AI refinement          |
| Track Submissions   | Status, score, feedback     |
| Earn Rewards        | Badges, points, leaderboard |
| Collaborate         | Comment, upvote, improve    |
| Learn               | Feedback from AI and peers  |

---

## 🛡️ Access Control & Visibility

* Can see only:
  * Own submissions
  * Ideas from team/department (configurable)
  * Public (highlighted) ideas across organization
