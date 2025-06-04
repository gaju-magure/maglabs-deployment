# 💡 Ideation POC | Idea Iteration Loop

This is a Proof-of-Concept (POC) for an AI-driven idea refinement and scoring engine using OpenAI. It allows users to submit business ideas, refine them using a conversational interface, and score them based on clarity, value, and complexity.

---

## ✨ Features

- Submit a rough idea through a simple web UI.
- AI-powered refinement of user input via OpenAI Chat API.
- AI-generated scoring for each idea (clarity, value, complexity).
- Express.js backend using Axios to connect to OpenAI.
- Lightweight and easy to extend.

---

## 📦 Tech Stack

- Node.js
- Express.js
- OpenAI GPT-4 (`chat/completions`)
- Axios

---

## 🚀 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone git@github.com:magurelabs/maglabs-ideation.git
   cd  maglabs-ideation/poc-ideation
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```
3. **Set your environment variables**
   Create a `.env` file in the root directory:

   ```env
   OPENAI_API_KEY=sk-xxxxx
   ```
4. **Run the app**

   ```bash
   node server.js
   ```
5. **Access the UI**

   Open your browser and visit:

   ```
   http://localhost:3000
   ```

---

## 🔧 File Structure

```bash
.
├── server.js              # Express server with routes
├── openai/
│   ├── refineIdea.js      # Conversational idea refinement
│   └── scoreIdea.js       # AI-based scoring logic
├── public/
│   └── index.html         # Basic UI form
├── .env                   # API keys and configs
└── README.md              # This file
```

---

## 🧠 How It Works

1. User enters a rough idea in the UI.
2. The backend sends it to OpenAI for refinement.
3. Refined idea is scored by a second AI call.
4. Scores are returned as JSON (Clarity, Value, Complexity).

---

## 📝 Example Output

```json
{
  "clarity": 8,
  "value": 9,
  "complexity": 4
}
```

---

## 📌 Notes

* Uses `gpt-4` — you can switch to `gpt-3.5-turbo` for cost savings.
* Make sure your OpenAI key is valid and has access to chat-based models.
* POC is not production-ready — no validation or rate limiting yet.

---

## 📮 Future Enhancements

* WIP implementing simple chat feature
