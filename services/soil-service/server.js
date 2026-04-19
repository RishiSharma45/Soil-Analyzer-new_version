const express = require("express");
const cors = require("cors");

const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/soilDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const SoilSchema = new mongoose.Schema({
  ph: Number,
  moisture: Number,
  soilType: String,
  healthScore: Number,
  crop: String,
  userId: String,
  date: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  googleId: String
});

const User = mongoose.model("User", UserSchema);

const Soil = mongoose.model("Soil", SoilSchema);

const app = express();
app.use(cors());
app.use(express.json());

app.post("/soil", async (req, res) => {
  const { ph, moisture, crop } = req.body;
  console.log("Incoming Data:", req.body);

  let type = "";

if (ph < 6) type = "Acidic";
else if (ph >= 6 && ph <= 7.5) type = "Neutral";
else type = "Alkaline";
  let health = 0;

// 🌡️ pH score (0–50)
if (ph >= 6 && ph <= 7.5) health += 50;
else if (ph >= 5 && ph < 6) health += 35;
else if (ph > 7.5 && ph <= 8.5) health += 35;
else health += 20;

// 💧 moisture score (0–40)
if (moisture >= 40 && moisture <= 70) health += 40;
else if (moisture >= 30 && moisture < 40) health += 25;
else if (moisture > 70 && moisture <= 85) health += 25;
else health += 10;

// 🌾 crop-based adjustment (0–10)
if (crop) {
  const c = crop.toLowerCase();

  if (c === "rice") {
    if (moisture > 70) health += 10;
    else health -= 5;
  }

  if (c === "wheat") {
    if (moisture >= 40 && moisture <= 60) health += 10;
    else health -= 5;
  }

  if (c === "cotton") {
    if (ph >= 6 && ph <= 7) health += 10;
    else health -= 5;
  }
  if (c === "jawar" || c === "jowar") {
  if (moisture >= 30 && moisture <= 60) health += 10;
  else health -= 5;
}
}

// clamp between 0–100
health = Math.max(0, Math.min(health, 100));

  let suggestion = "";

 if (crop) {
  suggestion = `Optimized for ${crop}`;
} else {
  if (type === "Acidic") suggestion = "Best for potato, tea";
  else if (type === "Neutral") suggestion = "Ideal for wheat, rice";
  else suggestion = "Suitable for cotton, barley";
}

  



  // SAVE TO DB
  const newSoil = new Soil({
    ph,
    moisture,
    soilType: type,
    healthScore: health,
    crop,   
   userId: req.body.userId || null   // 👈 ADD THIS
});

  await newSoil.save();

  res.json({
    soilType: type,
    healthScore: health,
    moisture,
    crop,
    suggestion
  });
});
app.get("/history", async (req, res) => {
  try {
    const data = await Soil.find({ userId: req.query.userId || null }).sort({ date: -1 }).limit(10);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// DELETE ALL HISTORY
app.delete("/history", async (req, res) => {
  await Soil.deleteMany({});
  res.json({ message: "All history deleted" });
});

// DELETE SINGLE ITEM
app.delete("/history/:id", async (req, res) => {
  await Soil.findByIdAndDelete(req.params.id);
  res.json({ message: "Item deleted" });
});

app.listen(3001, () => console.log("Soil Service running on 3001"));
