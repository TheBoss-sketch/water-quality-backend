const express = require("express");
const cors = require("cors");

const app = express();

//  MIDDLEWARE 
app.use(cors());            
app.use(express.json());

// STORE LATEST DATA
let latestData = {
  temperature: null,
  turbidity: null,
  quality: "Unknown",
  score: null,
};

// ESP32 POSTS DATA HERE 
app.post("/data", (req, res) => {
  const { temperature, turbidity } = req.body;

  let score = 100;

// Turbidity penalties
if (turbidity < 1400) score -= 50;
else if (turbidity < 1700) score -= 25;

// Temperature penalties
if (temperature > 35) score -= 20;
else if (temperature > 30) score -= 10;

// Clamp score
score = Math.max(0, Math.min(100, score));

// Decide quality based on score
let quality = "Good";
if (score < 50) quality = "Poor";
else if (score < 75) quality = "Moderate";

  score = Math.max(0, Math.min(100, score));

  latestData = {
    temperature,
    turbidity,
    quality,
    score,
  };

  res.status(200).json({ message: "Data received" });
});

// FRONTEND FETCHES HERE 
app.get("/data", (req, res) => {
  res.json(latestData);
});

// HEALTH CHECK 
app.get("/", (req, res) => {
  res.send("Water Quality Backend Running");
});

// START SERVER 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
