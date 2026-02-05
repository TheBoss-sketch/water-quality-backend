const express = require("express");
const app = express();

app.use(express.json());

// Store latest data
let latestData = {
  temperature: null,
  turbidity: null,
  quality: "Unknown",
  score: null,
};

// ESP32 sends data here
app.post("/data", (req, res) => {
  const { temperature, turbidity } = req.body;

  let quality = "Good";
  let score = 100;

  // Turbidity logic (raw ADC)
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

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  latestData = {
    temperature,
    turbidity,
    quality,
    score,
  };

  res.status(200).json({ message: "Data received" });
});

// Frontend fetches data here
app.get("/data", (req, res) => {
  res.json(latestData);
});

// Health check
app.get("/", (req, res) => {
  res.send("Water Quality Backend Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
