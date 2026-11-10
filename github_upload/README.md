# ICU Mortality Prediction System
### Logistic Regression Clinical Decision Support on PhysioNet MIMIC-III & eICU-CRD

A full-stack clinical machine learning application for predicting intensive care unit (ICU) in-hospital mortality. Built with a **Python Flask** REST API and an interactive **React** frontend dashboard.

---

## Clinical & Machine Learning Architecture

### 1. PhysioNet Datasets
* **MIMIC-III** (*Medical Information Mart for Intensive Care III*): Benchmark single-center repository from Beth Israel Deaconess Medical Center (~40,000 admissions).
* **eICU-CRD** (*eICU Collaborative Research Database*): Multi-center telehealth database spanning >200,000 admissions across 208 hospitals throughout the US.
* Generates statistically calibrated physiological cohorts matching published clinical literature (Harutyunyan et al., Johnson et al., Pollard et al.) and provides automated ingestion for real PhysioNet CSV extracts dropped into `data/`.

### 2. Machine Learning Model: Logistic Regression
* **Explainability & Trust**: Unlike black-box neural networks, Logistic Regression provides direct, mathematically rigorous **Odds Ratios ($OR = e^\beta$)** and 95% Confidence Intervals for every physiological parameter.
* **Acuity Benchmarks**: Compares predicted risk against classical critical care severity scores:
  * **OASIS** (*Oxford Acute Severity of Illness Score*)
  * **SOFA** (*Sequential Organ Failure Assessment*)
* **Calibration & Discrimination**:
  * ROC-AUC: **~0.88** (high discriminative performance)
  * Calibration via Brier Score minimization
  * Balanced class weighting to prevent undertriage of deteriorating patients.

---

## Project Structure

```
icu-mortality-prediction/
├── backend/
│   ├── app.py                # Flask REST API with CORS and SPA serving
│   ├── model.py              # Logistic Regression pipeline, Odds Ratios, OASIS/SOFA
│   ├── data_generator.py     # MIMIC-III & eICU-CRD cohort generation & ingestion
│   ├── sample_patients.py    # Pre-configured clinical ICU case presets
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Header & navigation tabs
│   │   │   ├── PredictorView.jsx       # Patient triage & risk attribution waterfall
│   │   │   ├── ModelExplainerView.jsx  # Odds Ratios forest plot & coefficients
│   │   │   ├── PerformanceView.jsx     # ROC, PR & Calibration curves, Confusion Matrix
│   │   │   └── DatasetExplorerView.jsx # MIMIC-III vs eICU stats, retrain controls, table
│   │   ├── App.jsx                     # State management and API orchestration
│   │   └── index.css                   # Dark clinical styling & components
│   ├── dist/                 # Optimized production build (bundled)
│   ├── package.json
│   └── vite.config.js        # Vite dev server with proxy to Flask
├── data/
│   ├── mimic3_cohort.csv     # MIMIC-III admission cohort
│   └── eicu_cohort.csv       # eICU-CRD admission cohort
└── run_project.py            # Single-command launcher for both servers
```

---

## Quick Start (Run Locally)

### Option A: Single Command Launcher (Recommended)
From the project directory:
```bash
python run_project.py
```
This will start the Flask backend on port `5000`, the React dev server on port `3000`, and automatically open the application in your browser.

---

### Option B: Run Backend & Frontend Separately

#### 1. Start the Flask Backend
```bash
cd backend
python app.py
```
* Backend runs on: `http://localhost:5000`
* (Because the React frontend is pre-built into `frontend/dist`, visiting `http://localhost:5000` will also serve the full application!)

#### 2. Start the React Frontend (Dev mode with Hot-Reloading)
```bash
cd frontend
npm run dev
```
* Frontend runs on: `http://localhost:3000` (proxies `/api` calls to port 5000)

---

## REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and feature schema |
| `GET` | `/api/model/summary` | Active model metrics (AUC, Brier), Odds Ratios, and 95% CIs |
| `POST` | `/api/predict` | Predicts mortality probability, risk tier, recommendations, and feature attribution |
| `POST` | `/api/retrain` | Retrains model on `mimic3`, `eicu`, or `combined` with custom regularization `C` |
| `GET` | `/api/patients/samples` | Returns 4 preset clinical case scenarios |
| `GET` | `/api/cohort/preview` | Preview raw dataset rows for MIMIC-III or eICU |
| `POST` | `/api/batch-predict` | Batch evaluates an array of ICU admissions |
