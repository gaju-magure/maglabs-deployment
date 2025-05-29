const express = require('express');
const router = express.Router();
const refineIdea = require('../openai/refineIdea');
const scoreIdea = require('../openai/scoreIdea');

router.post('/refine', async (req, res) => {
  try {
    const result = await refineIdea(req.body.conversation);
    res.send(result);
  } catch (e) {
    res.status(500).send('Refinement failed', e);
    console.log(e);
  }
});

router.post('/score', async (req, res) => {
  try {
    const result = await scoreIdea(req.body.idea);
    res.json(result);
  } catch (e) {
    res.status(500).send('Scoring failed');
  }
});

module.exports = router;
