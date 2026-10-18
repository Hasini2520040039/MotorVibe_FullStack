import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "data", "motors.json");
const db = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

function getMotor(id) {
  return db.motors.find(m => m.id === id);
}
function getReadings(id) {
  return db.readings.filter(r => r.motorId === id).sort((a,b) => new Date(a.timestamp)-new Date(b.timestamp));
}
function latest(id) {
  const list = getReadings(id);
  return list[list.length - 1] || null;
}
function assess(reading) {
  if (!reading) return { status: "UNKNOWN", health: 0, confidence: 0, recommendation: "No readings available." };
  const v = Number(reading.vibration), t = Number(reading.temperature);
  let status = "HEALTHY";
  if (v >= 5 || t >= 75) status = "CRITICAL";
  else if (v >= 3.5 || t >= 65) status = "WARNING";
  const health = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, v - 2) * 12 - Math.max(0, t - 60) * 2)));
  const recommendation = status === "HEALTHY"
    ? "No immediate action. Continue routine monitoring."
    : status === "WARNING"
      ? "Schedule an inspection soon; check vibration, bearings and alignment."
      : "Stop the equipment if safe to do so and arrange an immediate inspection.";
  return { status, health, confidence: status === "HEALTHY" ? 94 : status === "WARNING" ? 88 : 91, recommendation };
}

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "MotorVibe API", mode: "demo-data" }));
app.get("/api/motors", (_req, res) => {
  res.json(db.motors.map(m => ({ ...m, latestReading: latest(m.id), prediction: assess(latest(m.id)) })));
});
app.get("/api/motors/:id", (req, res) => {
  const motor = getMotor(req.params.id);
  if (!motor) return res.status(404).json({ error: "Motor not found" });
  res.json({ ...motor, latestReading: latest(motor.id), prediction: assess(latest(motor.id)) });
});
app.get("/api/motors/:id/readings", (req, res) => {
  if (!getMotor(req.params.id)) return res.status(404).json({ error: "Motor not found" });
  const limit = Math.max(1, Math.min(200, Number.parseInt(req.query.limit || "30", 10) || 30));
  res.json(getReadings(req.params.id).slice(-limit));
});
app.get("/api/motors/:id/alerts", (req, res) => {
  if (!getMotor(req.params.id)) return res.status(404).json({ error: "Motor not found" });
  res.json(db.alerts.filter(a => a.motorId === req.params.id));
});
app.get("/api/motors/:id/prediction", (req, res) => {
  if (!getMotor(req.params.id)) return res.status(404).json({ error: "Motor not found" });
  res.json({ motorId: req.params.id, prediction: assess(latest(req.params.id)), latestReading: latest(req.params.id) });
});
app.post("/api/motors/:id/readings/simulate", (req, res) => {
  const motor = getMotor(req.params.id);
  if (!motor) return res.status(404).json({ error: "Motor not found" });
  const prev = latest(motor.id) || { vibration: motor.baselineVibration, temperature: motor.baselineTemperature, rpm: motor.ratedRpm, current: motor.ratedCurrent * 0.7 };
  const reading = {
    id: randomUUID(), motorId: motor.id, timestamp: new Date().toISOString(),
    vibration: Math.max(0.2, +(prev.vibration + (Math.random() - 0.5) * 0.8).toFixed(2)),
    temperature: +(prev.temperature + (Math.random() - 0.5) * 1.8).toFixed(1),
    rpm: Math.max(0, Math.round(prev.rpm + (Math.random() - 0.5) * 24)),
    current: Math.max(0, +(prev.current + (Math.random() - 0.5) * 0.6).toFixed(1))
  };
  db.readings.push(reading);
  const prediction = assess(reading);
  if (prediction.status !== "HEALTHY") {
    db.alerts.unshift({ id: randomUUID(), motorId: motor.id, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), level: prediction.status.toLowerCase(), message: `Simulated reading: vibration ${reading.vibration} mm/s; status ${prediction.status}` });
    db.alerts = db.alerts.slice(0, 30);
  }
  res.status(201).json({ reading, prediction, simulated: true });
});
app.get("/api/summary", (_req, res) => {
  const motors = db.motors.map(m => ({ ...m, latestReading: latest(m.id), prediction: assess(latest(m.id)) }));
  res.json({
    totalMotors: motors.length,
    healthy: motors.filter(m => m.prediction.status === "HEALTHY").length,
    warning: motors.filter(m => m.prediction.status === "WARNING").length,
    critical: motors.filter(m => m.prediction.status === "CRITICAL").length,
    motors
  });
});

app.listen(PORT, () => console.log(`MotorVibe API running at http://localhost:${PORT}`));
