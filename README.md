# MotorVibe — Full-Stack Predictive Maintenance Demo

A beginner-friendly full-stack project with:
- React + Vite frontend dashboard
- Node.js + Express REST API backend
- Static demo motor dataset stored as JSON
- Simulated live readings (clearly labelled as simulated)
- Motor selection, health score, trend chart, alerts and threshold-based status prediction

> Important: This project uses a static illustrative dataset and simulated readings. It is not connected to physical sensors and does not use a trained machine-learning model. The fault verdict is a transparent rule-based demo.

## Requirements
- Node.js 18+ (recommended)
- npm
- Internet connection for installing packages

## 1. Start the backend
Open a terminal in `MotorVibe_FullStack/backend`:

```bash
npm install
npm run dev
```

API runs at `http://localhost:5000`.
Try `http://localhost:5000/api/health` and `http://localhost:5000/api/motors`.

## 2. Start the frontend
Open a second terminal in `MotorVibe_FullStack/frontend`:

```bash
npm install
npm run dev
```

Open the local URL Vite prints, usually `http://localhost:5173`.

## API routes
- `GET /api/health` — backend status
- `GET /api/motors` — list motors
- `GET /api/motors/:id` — one motor and latest reading
- `GET /api/motors/:id/readings?limit=30` — static readings/history
- `GET /api/motors/:id/alerts` — alerts for a motor
- `GET /api/motors/:id/prediction` — threshold-based status and recommended action
- `POST /api/motors/:id/readings/simulate` — create one simulated reading
- `GET /api/summary` — dashboard summary

## Dataset
`backend/data/motors.json` is the small static dataset. It contains illustrative motor metadata, historical readings, and sample alerts. Replace it with real labelled data when you have a verified dataset.

## Suggested next improvements
1. Add a database (SQLite/PostgreSQL/MongoDB) to persist readings.
2. Add login and roles before using in a real deployment.
3. Train and validate a machine-learning model using a labelled industrial dataset.
4. Connect certified vibration/temperature/current sensors for real-time measurements.
5. Add tests, input validation, logging, and deployment configuration.

## Project structure
```text
MotorVibe_FullStack/
├── README.md
├── backend/
│   ├── data/motors.json
│   ├── package.json
│   └── server.js
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        └── style.css
```
