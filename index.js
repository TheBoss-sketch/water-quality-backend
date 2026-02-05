const express = require("express");
const cors = require("cors");

const app = express();

// ---- MIDDLEWARE ----
app.use(cors());            
app.use(express.json());

// ---- STORE LATEST DATA ----
let latestData = {
  temperature: null,
  turbidity: null,
  quality: "Unknown",
  score: null,
};

// ---- ESP32 POSTS DATA HERE ----
app.post("/data", (req, res) => {
  const { temperature, turbidity } = req.body;

  let quality = "Good";
  let score = 100;

  // Turbidity logic
  if (turbidity < 1400) {
    quality = "Poor";
    score -= 50;
  } else if (turbidity < 1700) {
    quality = "Moderate";
    score -= 25;
  }

  // Temperature logic
  if (temperature > 35) {
    quality = "Poor";
    score -= 20;
  } else if (temperature > 30) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  latestData = {
    temperature,
    turbidity,
    quality,
    score,
  };

  res.status(200).json({ message: "Data received" });
});

// ---- FRONTEND FETCHES HERE ----
app.get("/data", (req, res) => {
  res.json(latestData);
});

// ---- HEALTH CHECK ----
app.get("/", (req, res) => {
  res.send("Water Quality Backend Running");
});

// ---- START SERVER ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
