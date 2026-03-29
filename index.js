const express = require("express");
const cors = require("cors");

const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(express.json());

// -------------------- STORAGE --------------------
let latestData = {
  temperature: 25,
  turbidity: 1800
};

// Manual TDS input
let manualTDS = 500;

// -------------------- ROUTES --------------------

// ESP32 sends temp + turbidity
app.post("/data", (req, res) => {
  const { temperature, turbidity } = req.body;

  latestData.temperature = temperature;
  latestData.turbidity = turbidity;

  res.json({ message: "Data received" });
});

// Manual TDS input from frontend
app.post("/set-tds", (req, res) => {
  manualTDS = req.body.tds;
  res.json({ tds: manualTDS });
});

// Main data endpoint for frontend
app.get("/data", (req, res) => {

  let temperature = latestData.temperature;
  let turbidityRaw = latestData.turbidity;

  // ---------------------------
  // 1. Add fluctuation to TDS
  // ---------------------------
  let noise = (Math.random() * 20) - 10; // -10 to +10
  let tds = manualTDS + noise;

  // ---------------------------
  // 2. Convert turbidity → NTU
  // ---------------------------
  let turbidityNTU = (2000 - turbidityRaw) * 0.5;

  if (turbidityNTU < 0) turbidityNTU = 0;

  // ---------------------------
  // 3. Normalize values
  // ---------------------------
  let t_norm = Math.min(temperature / 40, 1);
  let turb_norm = Math.min(turbidityNTU / 100, 1);
  let tds_norm = Math.min(tds / 1000, 1);

  // ---------------------------
  // 4. Regression-style scoring
  // ---------------------------
  let score = 100 * (
    0.4 * (1 - turb_norm) +
    0.3 * (1 - tds_norm) +
    0.3 * (1 - t_norm)
  );

  score = Math.max(0, Math.min(100, score));

  // ---------------------------
  // 5. Classification
  // ---------------------------
  let quality = "Good";
  if (score < 50) quality = "Poor";
  else if (score < 75) quality = "Moderate";

  // ---------------------------
  // RESPONSE
  // ---------------------------
  res.json({
    temperature,
    turbidityRaw,
    turbidityNTU: Number(turbidityNTU.toFixed(2)),
    tds: Number(tds.toFixed(2)),
    score: Number(score.toFixed(1)),
    quality
  });
});

// Health check
app.get("/", (req, res) => {
  res.send("Backend running");
});

// -------------------- SERVER --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
