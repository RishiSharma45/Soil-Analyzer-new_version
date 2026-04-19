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
const soilRes = await axios.post("http://localhost:3001/soil", {
  ph,
  moisture,
  crop,
  userId: req.body.userId 
});

const soilData = soilRes.data;

// Call Recommendation Service
const recRes = await axios.post("http://localhost:3002/recommend", {
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
    const response = await axios.get("http://127.0.0.1:3001/history");
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Error fetching history" });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const response = await axios.post(
      "http://127.0.0.1:3003/chat",
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
  const response = await axios.delete("http://127.0.0.1:3001/history");
  res.json(response.data);
});

// Delete one
app.delete("/history/:id", async (req, res) => {
  const response = await axios.delete(`http://127.0.0.1:3001/history/${req.params.id}`);
  res.json(response.data);
});

app.listen(3000, () => console.log("API Gateway running on 3000"));
