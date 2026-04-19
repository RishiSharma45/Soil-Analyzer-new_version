const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  let reply = "I didn't understand. Try asking about soil, crops, or fertilizer.";

  const msg = message.toLowerCase();

  if (msg.includes("ph")) {
  reply = "Soil pH tells acidity or alkalinity. Ideal range is 6 to 7.";
}
else if (msg.includes("acidic")) {
  reply = "Acidic soil is good for crops like potato, tea.";
}
else if (msg.includes("alkaline")) {
  reply = "Alkaline soil supports crops like barley and cotton.";
}
else if (msg.includes("fertilizer")) {
  reply = "Use nitrogen-rich fertilizers for growth.";
}
else if (msg.includes("moisture")) {
  reply = "Soil moisture should be balanced.";
}
else if (msg.includes("crop") || msg.includes("crops")) {
  reply = "Common crops include wheat, rice, maize depending on soil.";
}
else if (msg.includes("soil")) {
  reply = "Soil is essential for plant growth. It provides nutrients and support.";
}
else if (msg.includes("hi") || msg.includes("hello") || msg.includes("hy")) {
  reply = "Hello! Ask me about soil, crops, or fertilizer.";
}

  res.json({ reply });
});

app.listen(3003, () => console.log("Chatbot AI Service running"));