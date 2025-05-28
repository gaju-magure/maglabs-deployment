require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const refineIdea = require('./openai/refineIdea');
const scoreIdea = require('./openai/scoreIdea');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/submit-idea', async (req, res) => {
  const { input } = req.body;

  if (!input) return res.status(400).json({ error: 'Input is required' });

  try {
    const refined = await refineIdea(input);
    const scores = await scoreIdea(refined);

    res.json({
      original: input,
      refined,
      scores,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process idea' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
