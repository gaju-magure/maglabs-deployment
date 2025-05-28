const axios = require('axios');

module.exports = async function scoreIdea(idea) {
  const messages = [
    {
      role: 'system',
      content: `
        You are an expert business analyst AI. Your job is to evaluate idea submissions.
        Rate from 1 to 10:
        - Clarity (how well explained is the idea)
        - Value (business impact potential)
        - Complexity (difficulty to implement)

        Respond ONLY in valid JSON:
        {
          "clarity": number,
          "value": number,
          "complexity": number
        }
      `
    },
    {
      role: 'user',
      content: `Evaluate this idea: "${idea}"`
    }
  ];

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages,
      max_tokens: 100,
      temperature: 0.3
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  try {
    const reply = response.data.choices[0].message.content.trim();
    return JSON.parse(reply);
  } catch (err) {
    console.error('Raw AI response:', response.data.choices[0].message.content);
    throw new Error('Failed to parse AI response: ' + err.message);
  }
};
