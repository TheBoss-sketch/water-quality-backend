const express = require("express");
const cors = require("cors");

const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(express.json());

// -------------------- STORAGE --------------------
let latestData = {
  temperature: 25,   // °C
  turbidity: 1800    // raw ADC
};

// Manual TDS input (ppm ≈ mg/L)
let manualTDS = 500;

// -------------------- ROUTES --------------------

// ESP32 sends temp + turbidity
app.post("/data", (req, res) => {
  const { temperature, turbidity } = req.body;

  if (temperature !== undefined) latestData.temperature = temperature;
  if (turbidity !== undefined) latestData.turbidity = turbidity;

  res.json({ message: "Data received" });
});

// Manual TDS from phone
app.post("/set-tds", (req, res) => {
  manualTDS = req.body.tds;
  res.json({ tds: manualTDS });
});

// MAIN DATA ENDPOINT
app.get("/data", (req, res) => {

  let temperature = latestData.temperature;
  let turbidityRaw = latestData.turbidity;

  // ---------------------------
  // 1. TDS with realistic fluctuation
  // ---------------------------
  let noise = (Math.random() * 20) - 10; // ±10 ppm
  let tds = manualTDS + noise;

  if (tds < 0) tds = 0;

  // ---------------------------
  // 2. Turbidity → NTU (improved mapping)
  // ---------------------------
  // Empirical approximation (for cheap sensors)
  let voltage = turbidityRaw * (3.3 / 4095);

  let turbidityNTU = -1120.4 * (voltage * voltage) + 5742.3 * voltage - 4352.9;

  if (turbidityNTU < 0) turbidityNTU = 0;

  // ---------------------------
  // 3. Normalize (0–1 scale)
  // ---------------------------
  let temp_norm = Math.min(temperature / 40, 1);
  let turb_norm = Math.min(turbidityNTU / 100, 1);
  let tds_norm = Math.min(tds / 1000, 1);

  // ---------------------------
  // 4. Regression-style scoring
  // ---------------------------
  let score = 100 * (
    0.45 * (1 - turb_norm) +
    0.35 * (1 - tds_norm) +
    0.20 * (1 - temp_norm)
  );

  score = Math.max(0, Math.min(100, score));

  // ---------------------------
  // 5. Classification
  // ---------------------------
  let quality = "Excellent";
  if (score < 40) quality = "Poor";
  else if (score < 65) quality = "Moderate";
  else if (score < 85) quality = "Good";

  // ---------------------------
  // RESPONSE (CLEAN + SI)
  // ---------------------------
  res.json({
    temperature_c: Number(temperature.toFixed(2)),   // °C
    turbidity_ntu: Number(turbidityNTU.toFixed(2)),  // NTU
    tds_mg_per_l: Number(tds.toFixed(2)),            // mg/L (ppm)
    score_percent: Number(score.toFixed(1)),         // %
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
