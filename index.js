#include <WiFi.h>
#include <HTTPClient.h>

// ---------------- WIFI ----------------
const char* ssid = "Divya's A16";
const char* password = "55555555";

// ---------------- BACKEND ----------------
const char* serverURL = "https://water-quality-backend-gl86.onrender.com/data";

// ---------------- PINS ----------------
#define TURB_PIN 35
#define TDS_PIN 34

// ---------------- TEMP SENSOR ----------------
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 15

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// ---------------- STORAGE ----------------
float turbidityBuffer[10];
int turbIndex = 0;

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);

  pinMode(TURB_PIN, INPUT);
  pinMode(TDS_PIN, INPUT);

  sensors.begin();

  WiFi.begin(ssid, password);

  Serial.print("Connecting...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");
}

// ---------------- TDS FUNCTION (LOW BASELINE) ----------------
float readTDS() {

  // simulate near pure water
  float base = 5; // mg/L (very low)

  float noise = random(-3, 3);

  float tds = base + noise;

  if (tds < 0) tds = 0;

  return tds;
}

// ---------------- AVERAGE FUNCTION ----------------
float getAverageTurbidity() {

  float sum = 0;

  for (int i = 0; i < 10; i++) {
    sum += turbidityBuffer[i];
  }

  return sum / 10.0;
}

// ---------------- LOOP ----------------
void loop() {

  // -------- TEMPERATURE --------
  sensors.requestTemperatures();
  float temp = sensors.getTempCByIndex(0);

  // -------- TURBIDITY --------
  int raw = analogRead(TURB_PIN);

  turbidityBuffer[turbIndex] = raw;
  turbIndex++;

  if (turbIndex >= 10) turbIndex = 0;

  float turbidityRaw = getAverageTurbidity();

  // -------- TDS --------
  float tdsValue = readTDS();

  // -------- SERIAL --------
  Serial.print("Temp: ");
  Serial.print(temp);
  Serial.print(" °C | ");

  Serial.print("Turbidity(avg): ");
  Serial.print(turbidityRaw);
  Serial.print(" | ");

  Serial.print("TDS: ");
  Serial.print(tdsValue);
  Serial.println(" mg/L");

  // -------- SEND TO BACKEND --------
  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    String jsonData = "{";
    jsonData += "\"temperature\":" + String(temp) + ",";
    jsonData += "\"turbidity\":" + String(turbidityRaw);
    jsonData += "}";

    int code = http.POST(jsonData);

    Serial.print("HTTP: ");
    Serial.println(code);

    http.end();
  }

  delay(1000); // 1 sec → 10 samples = ~10 sec smoothing
}
