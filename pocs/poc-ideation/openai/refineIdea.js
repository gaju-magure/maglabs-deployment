const axios = require('axios');

module.exports = async function refineIdea(conversation) {
  const messages = [
    {
      role: 'system',
      content: 'You are an AI business analyst helping users refine vague ideas. Ask follow-up questions if needed and summarize a clearer version.'
    },
    ...conversation
  ];

  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages,
      max_tokens: 300,
      temperature: 0.7
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return res.data.choices[0].message.content.trim();
};