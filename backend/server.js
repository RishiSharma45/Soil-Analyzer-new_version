const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/analyze", (req, res) => {
const { ph, moisture } = req.body;

let result = "";

if (ph < 6) result = "Soil is Acidic 🌿";
else if (ph > 7) result = "Soil is Alkaline 🌱";
else result = "Soil is Neutral 🌾";

if (moisture < 30) result += " | Low Moisture 💧";
else result += " | Good Moisture 💦";

res.json({ result });
});

app.listen(3000, () => {
console.log("Server running on http://localhost:3000");
});
