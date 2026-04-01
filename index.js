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

// TDS (starts low)
let manualTDS = 5;

// ---------------- ROUTES ----------------

// ESP32 sends temp + turbidity
app.post("/data", (req, res) => {
  const { temperature, turbidity } = req.body;

  if (temperature !== undefined) latestData.temperature = temperature;
  if (turbidity !== undefined) latestData.turbidity = turbidity;

  res.json({ message: "ok" });
});

// Control panel sets TDS
app.post("/set-tds", (req, res) => {
  manualTDS = req.body.tds;
  res.json({ tds: manualTDS });
});

// MAIN OUTPUT
app.get("/data", (req, res) => {

  let temperature = latestData.temperature;
  let raw = latestData.turbidity;

  // ---------------- TDS ----------------
  let tds = manualTDS + (Math.random() * 2 - 1);
  if (tds < 0) tds = 0;

  // ---------------- TURBIDITY (FIXED LOGIC) ----------------
  // YOUR CALIBRATION
let CLEAN = 1360;     // update this when needed
let RANGE = 200;      // keep this constant

let DIRTY = CLEAN - RANGE;

let ntu = (CLEAN - raw) * (100 / RANGE);

if (ntu < 0) ntu = 0;
if (ntu > 100) ntu = 100;

  // ---------------- NORMALIZATION ----------------
  let temp_norm = Math.min(temperature / 40, 1);
  let turb_norm = Math.min(ntu / 100, 1);
  let tds_norm = Math.min(tds / 1000, 1);

  // ---------------- SCORE ----------------
  let score = 100 * (
    0.5 * (1 - turb_norm) +
    0.3 * (1 - tds_norm) +
    0.2 * (1 - temp_norm)
  );

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  // ---------------- QUALITY ----------------
  let quality = "Excellent";
  if (score < 40) quality = "Poor";
  else if (score < 65) quality = "Moderate";
  else if (score < 85) quality = "Good";

  // ---------------- RESPONSE ----------------
  res.json({
    temperature_c: Number(temperature.toFixed(2)),
    turbidity_ntu: Number(ntu.toFixed(2)),
    tds_mg_per_l: Number(tds.toFixed(2)),
    score_percent: Number(score.toFixed(1)),
    quality
  });

});

// Health check
app.get("/", (req, res) => {
  res.send("Backend running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running");
});
