const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/recommend", (req, res) => {
const { soilType } = req.body;

let crops = [];

if (soilType === "Acidic") crops = ["Potato", "Tea"];
else if (soilType === "Neutral") crops = ["Wheat", "Rice"];
else crops = ["Barley", "Cotton"];

res.json({ crops });
});

app.listen(3002, () => console.log("Recommendation Service running on 3002"));
