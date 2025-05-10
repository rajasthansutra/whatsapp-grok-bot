// Node.js WhatsApp + Grok API Bot for Group Mentions
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const GROK_API_KEY = process.env.GROK_API_KEY;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const BOT_MENTION_KEYWORD = '@bhaiBot';

app.post('/webhook', async (req, res) => {
  try {
    const changes = req.body.entry?.[0]?.changes?.[0]?.value;
    const message = changes?.messages?.[0];
    const from = message?.from;
    const userText = message?.text?.body || '';

    const isGroupMessage = message?.context?.group_id;
    const botMentioned = userText.toLowerCase().includes(BOT_MENTION_KEYWORD.toLowerCase());

    if (isGroupMessage && botMentioned && userText) {
      const cleanedText = userText.replace(new RegExp(BOT_MENTION_KEYWORD, 'i'), '').trim();

      const grokResponse = await axios.post('https://api.x.ai/v1/chat/completions', {
        model: "grok-1",
        messages: [{ role: "user", content: cleanedText }],
      }, {
        headers: {
          Authorization: `Bearer ${GROK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const replyText = grokResponse.data.choices?.[0]?.message?.content || 'माफ कीजिए, मैं जवाब नहीं दे सका।';

      await axios.post(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
        messaging_product: "whatsapp",
        to: from,
        context: { message_id: message.id },
        text: { body: replyText }
      }, {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      res.sendStatus(200);
    } else {
      res.sendStatus(200);
    }
  } catch (err) {
    console.error('Error handling message:', err);
    res.sendStatus(500);
  }
});

app.get('/webhook', (req, res) => {
  const verify_token = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === verify_token) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.listen(3000, () => console.log('🤖 Bot server running on http://localhost:3000'));