const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ---------------- STORAGE ----------------
let latestData = {
  temperature: 25,
  turbidity: 1400
};

// Manual TDS (starts LOW)
let manualTDS = 5;

// ---------------- ROUTES ----------------

// ESP32 input
app.post("/data", (req, res) => {
  const { temperature, turbidity } = req.body;

  if (temperature !== undefined) latestData.temperature = temperature;
  if (turbidity !== undefined) latestData.turbidity = turbidity;

  res.json({ message: "ok" });
});

// Control panel input
app.post("/set-tds", (req, res) => {
  manualTDS = req.body.tds;
  res.json({ tds: manualTDS });
});

// MAIN OUTPUT
app.get("/data", (req, res) => {

  let temperature = latestData.temperature;
  let turbidityRaw = latestData.turbidity;

  // -------- TDS (small fluctuation) --------
  let tds = manualTDS + (Math.random() * 4 - 2);
  if (tds < 0) tds = 0;

  // -------- TURBIDITY CALIBRATION --------
  let clean = 1418;
  let dirty = 1200;

  let turbidityNTU = (turbidityRaw - dirty) * (100 / (clean - dirty));

  if (turbidityNTU < 0) turbidityNTU = 0;

  // invert scale → clean = low NTU
  turbidityNTU = 100 - turbidityNTU;

  // -------- NORMALIZATION --------
  let temp_norm = Math.min(temperature / 40, 1);
  let turb_norm = Math.min(turbidityNTU / 100, 1);
  let tds_norm = Math.min(tds / 1000, 1);

  // -------- SCORING --------
  let score = 100 * (
    0.5 * (1 - turb_norm) +
    0.3 * (1 - tds_norm) +
    0.2 * (1 - temp_norm)
  );

  score = Math.max(0, Math.min(100, score));

  let quality = "Excellent";
  if (score < 40) quality = "Poor";
  else if (score < 65) quality = "Moderate";
  else if (score < 85) quality = "Good";

  // -------- RESPONSE --------
  res.json({
    temperature_c: Number(temperature.toFixed(2)),
    turbidity_ntu: Number(turbidityNTU.toFixed(2)),
    tds_mg_per_l: Number(tds.toFixed(2)),
    score_percent: Number(score.toFixed(1)),
    quality
  });

});

// health
app.get("/", (req, res) => {
  res.send("Backend running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running");
});
