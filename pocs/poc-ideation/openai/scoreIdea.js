const axios = require('axios');

module.exports = async function scoreIdea(idea) {
  const messages = [
    {
      role: 'system',
      content: `
        You are an AI idea evaluator.
        Score the following idea from 1 to 10 based on:
        - clarity
        - value
        - complexity
        Reply only in JSON.
      `
    },
    {
      role: 'user',
      content: idea
    }
  ];

  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages,
      max_tokens: 100,
      temperature: 0.3,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  try {
    return JSON.parse(res.data.choices[0].message.content);
  } catch (e) {
    throw new Error('Failed to parse scoring JSON');
  }
};
