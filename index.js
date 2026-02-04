const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());  
app.use(express.json());

let latestData = {
  pH: "--",
  TDS: "--",
  Turbidity: "--",
  Temperature: "--"
};

app.post("/data", (req, res) => {
  latestData = req.body;
  res.json({ status: "received" });
});

app.get("/data", (req, res) => {
  res.json(latestData);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
