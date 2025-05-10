// WhatsApp 1-on-1 Chatbot using Grok API
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
app.use(bodyParser.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const GROK_API_KEY = process.env.GROK_API_KEY;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (entry && entry.text && entry.from) {
    const userMessage = entry.text.body;
    const userNumber = entry.from;

    try {
      // Grok API call
      const grokRes = await axios.post("https://api.x.ai/v1/chat/completions", {
        model: "grok-1",
        messages: [{ role: "user", content: userMessage }]
      }, {
        headers: {
          Authorization: `Bearer ${GROK_API_KEY}`,
          "Content-Type": "application/json"
        }
      });

      const reply = grokRes.data.choices?.[0]?.message?.content || "माफ कीजिए, मैं जवाब नहीं दे सका।";

      // WhatsApp reply
      await axios.post(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
        messaging_product: "whatsapp",
        to: userNumber,
        text: { body: reply }
      }, {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      res.sendStatus(200);
    } catch (err) {
      console.error("❌ Error:", err.message);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(200);
  }
});

// Webhook verification
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.listen(3000, () => console.log("🤖 WhatsApp Chatbot running on port 3000"));
