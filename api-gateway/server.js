const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/analyze", async (req, res) => {
try {
const { ph, moisture, crop, userId } = req.body;

// Call Soil Service
const soilRes = await axios.post("https://soil-service.onrender.com/soil", {
  ph,
  moisture,
  crop,
  userId: req.body.userId 
});

const soilData = soilRes.data;

// Call Recommendation Service
const recRes = await axios.post("https://recommendation-service-3z9l.onrender.com/recommend", {
  soilType: soilData.soilType
});

const recData = recRes.data;

res.json({
  soil: soilData,
  recommendation: recData
});


}  catch (err) {
console.log("ERROR FROM SERVICE:", err.message);
res.status(500).json({ error: "Service error" });
}

});


app.get("/history", async (req, res) => {
  try {
    const response = await axios.get("https://soil-service.onrender.com/history");
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Error fetching history" });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const response = await axios.post(
      "https://chatbot-service-c6fe.onrender.com/chat",
      req.body
    );

    res.json(response.data);

  } catch (err) {
    console.log("CHAT ERROR:", err.message);
    res.status(500).json({ reply: "Chat service error" });
  }
});

// Delete all
app.delete("/history", async (req, res) => {
  const response = await axios.delete("https://soil-service.onrender.com/history");
  res.json(response.data);
});

// Delete one
app.delete("/history/:id", async (req, res) => {
  const response = await axios.delete(`https://soil-service.onrender.com/history/${req.params.id}`);
  res.json(response.data);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`API Gateway running on ${PORT}`));
