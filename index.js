<!DOCTYPE html>
<html>
<head>
  <title>Smart Water Quality Monitor</title>
  <meta charset="UTF-8">

  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f4f6f8;
      text-align: center;
    }

    h1 {
      margin-top: 20px;
    }

    .card {
      background: white;
      width: 300px;
      margin: 20px auto;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    .good { color: green; }
    .moderate { color: orange; }
    .poor { color: red; }
    .excellent { color: blue; }
  </style>
</head>

<body>

  <h1>Smart Water Quality Monitor</h1>
  <p>ESP32 + Cloud Backend</p>

  <div class="card">
    <h3>Temperature</h3>
    <p id="temp">-- °C</p>
  </div>

  <div class="card">
    <h3>Turbidity</h3>
    <p id="turbidity">-- NTU</p>
  </div>

  <div class="card">
    <h3>Total Dissolved Solids</h3>
    <p id="tds">-- mg/L</p>
  </div>

  <div class="card">
    <h3>Overall Water Quality</h3>
    <p id="quality">--</p>
    <p id="score">Score: -- %</p>
  </div>

  <script>

    const backendURL = "https://water-quality-backend-gl86.onrender.com/data";

    async function fetchData() {
      try {
        const response = await fetch(backendURL);
        const data = await response.json();

        // Assign values
        document.getElementById("temp").innerText = data.temperature_c + " °C";
        document.getElementById("turbidity").innerText = data.turbidity_ntu + " NTU";
        document.getElementById("tds").innerText = data.tds_mg_per_l + " mg/L";
        document.getElementById("score").innerText = "Score: " + data.score_percent + " %";

        const qualityElem = document.getElementById("quality");
        qualityElem.innerText = data.quality;

        // Color coding
        qualityElem.className = "";
        if (data.quality === "Excellent") qualityElem.classList.add("excellent");
        else if (data.quality === "Good") qualityElem.classList.add("good");
        else if (data.quality === "Moderate") qualityElem.classList.add("moderate");
        else qualityElem.classList.add("poor");

      } catch (err) {
        console.error("Fetch error:", err);
      }
    }

    // Auto refresh every 2 seconds
    setInterval(fetchData, 2000);

    fetchData();

  </script>

</body>
</html>
