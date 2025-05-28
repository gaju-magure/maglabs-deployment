const axios = require('axios');

module.exports = async function refineIdea(input) {
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are an AI business assistant helping users refine their ideas.' },
                { role: 'user', content: input }
            ],
            max_tokens: 150,
            temperature: 0.7
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    console.log(response);
    return response.data.choices[0].message.content.trim();
};
