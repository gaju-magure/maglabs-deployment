
## 🧠 **How to Use OpenAI in This Platform**

We'll focus on these use cases:

1. **Conversational Idea Refinement**
2. **AI Scoring of Ideas**
3. **Executive Suggestions (use cases, tech stack)**
4. **Prompt Management & Versioning**

---

## 🔁 1. Conversational Refinement using `chat/completions`

### ✅ OpenAI Feature Used:

* `gpt-4` or `gpt-3.5-turbo`
* `chat/completions` endpoint

### 🔧 API Flow

```ts
POST https://api.openai.com/v1/chat/completions
Headers:
  Authorization: Bearer YOUR_OPENAI_KEY
  Content-Type: application/json

Body:
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a digital innovation coach that helps users refine their ideas or problems by asking business-relevant follow-up questions..."
    },
    {
      "role": "user",
      "content": "There's too much paperwork in approvals."
    }
  ],
  "temperature": 0.7
}
```

### 💬 Sample System Prompt (configurable per tenant)

```plaintext
You are a helpful assistant trained in business innovation.

When users submit vague problems or ideas, your job is to:
- Ask follow-up questions to gather context
- Guide the user to explain pain points, systems involved, and outcomes expected
- Be concise, professional, and business-friendly
```

---

## 📊 2. AI Scoring using GPT (structured output)

### ✅ OpenAI Feature Used:

* `function_call` or structured output
* `gpt-4` with JSON schema

### 🔧 Example Prompt with Scoring

```json
{
  "model": "gpt-4",
  "messages": [
    { "role": "system", "content": "You are an AI innovation evaluator scoring employee ideas on Clarity, Value, and Complexity..." },
    { "role": "user", "content": "Idea: Automate purchase approvals using low-code tools like Power Automate." }
  ],
  "functions": [
    {
      "name": "score_idea",
      "description": "Score the idea on clarity, value, and complexity",
      "parameters": {
        "type": "object",
        "properties": {
          "clarityScore": { "type": "integer" },
          "valueScore": { "type": "integer" },
          "complexityScore": { "type": "integer" },
          "justification": { "type": "string" }
        },
        "required": ["clarityScore", "valueScore", "complexityScore", "justification"]
      }
    }
  ],
  "function_call": { "name": "score_idea" }
}
```

---

## 🧠 3. C-Suite Suggestion Prompt

### ✅ Purpose

* Recommend use cases
* Suggest tech stacks
* List potential integration paths

### 🧾 Prompt

```plaintext
You are an enterprise solution architect.

Given this submission:
"Automate manual invoice approvals in SAP."

Please respond with:
1. Recommended Use Cases
2. Suggested Tools
3. Integration Details

Your output must be in JSON like:

{
  "useCases": ["Invoice Automation", "SAP Workflow Optimization"],
  "tools": ["Power Automate", "SAP Workflow", "Zapier"],
  "integrationNotes": "Use SAP BAPI for integration, triggered by document upload event."
}
```

---

## 🧰 4. Prompt Versioning & Configuration

Store each prompt as a DB record:

| Field          | Description                              |
| -------------- | ---------------------------------------- |
| `id`         | UUID                                     |
| `promptType` | e.g.`refiner`,`scorer`,`suggestor` |
| `version`    | e.g.`v1`,`v2.1`                      |
| `tenantId`   | For multi-tenant prompt isolation        |
| `promptText` | The actual system/user prompt            |
| `model`      | e.g.`gpt-4`                            |
| `createdBy`  | Admin who configured it                  |
| `createdAt`  | Timestamp                                |

---

## 🛡️ Best Practices with OpenAI

1. **Latency Handling**
   * Use `gpt-3.5-turbo` for fast response if GPT-4 is slow
   * Cache static suggestions with Redis if needed
2. **Error Handling**
   * Retry with exponential backoff on 429 or 500s
   * Log prompt + response + score in DB
3. **Cost Optimization**
   * Use smaller models (e.g., `gpt-3.5-turbo`) for lower-priority scoring
   * Cache results for similar ideas across tenants
4. **Data Governance**
   * Avoid sending PII
   * Use OpenAI’s `logit_bias` or token filtering to guide safe outputs
   * Store every interaction audit trail

---

## 🧪 Sample Final Output for One Idea

```json
{
  "refinedIdea": "Finance approvals for PO > $1000 are delayed 7 days due to SAP workflow. This causes vendor friction.",
  "clarityScore": 9,
  "valueScore": 8,
  "complexityScore": 4,
  "justification": "Very clear problem, strong value impact, moderate integration challenge.",
  "suggestedUseCases": ["Automated invoice workflow", "Approval time tracking"],
  "tools": ["Power Automate", "SAP Connector", "Nintex"],
  "integrationNotes": "Integrate via SAP REST API. Trigger on PO creation."
}
```

---
