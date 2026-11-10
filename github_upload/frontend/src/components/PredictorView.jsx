import React, { useState, useEffect } from 'react';
import { 
  Heart, Activity, Thermometer, Wind, Brain, Droplets, 
  AlertTriangle, CheckCircle, Info, RefreshCw, Zap, TrendingUp, TrendingDown 
} from 'lucide-react';

export default function PredictorView({ samples, onPredict, prediction, isPredicting }) {
  const [patientData, setPatientData] = useState({
    age: 65,
    heart_rate: 85,
    map: 78,
    resp_rate: 18,
    temp_c: 37.0,
    spo2: 96,
    gcs: 15,
    wbc: 9.5,
    creatinine: 1.1,
    bun: 18,
    glucose: 125,
    potassium: 4.2,
    sodium: 138,
    platelets: 210,
    mech_vent: 0
  });

  const [selectedPresetId, setSelectedPresetId] = useState('');

  // Auto-run initial prediction on mount
  useEffect(() => {
    onPredict(patientData);
  }, []);

  const handleInputChange = (field, value) => {
    const updated = {
      ...patientData,
      [field]: field === 'mech_vent' ? (value ? 1 : 0) : Number(value)
    };
    setPatientData(updated);
    setSelectedPresetId('');
  };

  const handlePresetSelect = (preset) => {
    setSelectedPresetId(preset.id);
    setPatientData(preset.clinical_data);
    onPredict(preset.clinical_data);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onPredict(patientData);
  };

  // Color selection based on severity
  const getSeverityBadgeClass = (tier) => {
    if (tier === 'Low Risk') return 'badge-emerald';
    if (tier === 'Moderate Risk') return 'badge-amber';
    if (tier === 'High Risk') return 'badge-orange';
    return 'badge-rose';
  };

  const getGaugeColor = (pct) => {
    if (pct < 12) return '#10b981';
    if (pct < 28) return '#f59e0b';
    if (pct < 55) return '#f97316';
    return '#f43f5e';
  };

  const pct = prediction?.percentage || 0;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Preset Patient Cases */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              PhysioNet Clinical Case Benchmarks:
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Click any patient to test live risk assessment
          </span>
        </div>

        <div className="grid-4">
          {samples.map((s) => (
            <button
              key={s.id}
              className="btn-preset"
              style={{
                borderColor: selectedPresetId === s.id ? '#38bdf8' : 'var(--border-subtle)',
                background: selectedPresetId === s.id ? 'rgba(56, 189, 248, 0.12)' : undefined
              }}
              onClick={() => handlePresetSelect(s)}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {s.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                {s.description.substring(0, 75)}...
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input Form vs Risk Output */}
      <div className="grid-predict">
        {/* Left Column: Clinical Parameters */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div className="card-title">
                <Activity size={18} color="#38bdf8" />
                ICU Physiological & Laboratory Inputs
              </div>
              <div className="card-subtitle" style={{ marginBottom: 0 }}>
                First 24-hour admission parameters used for mortality logistic regression
              </div>
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => onPredict(patientData)}
              disabled={isPredicting}
            >
              <RefreshCw size={14} className={isPredicting ? 'animate-spin' : ''} />
              Re-Calculate
            </button>
          </div>

          <form onSubmit={handleFormSubmit}>
            {/* Section 1: Demographics & Hemodynamics */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                1. Hemodynamics & Temperature
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">
                    <span>Patient Age</span>
                    <span className="unit">yrs</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={patientData.age}
                    min="18"
                    max="100"
                    onChange={(e) => handleInputChange('age', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Heart Rate (HR)</span>
                    <span className="unit">60-100 bpm</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={patientData.heart_rate}
                    min="30"
                    max="220"
                    onChange={(e) => handleInputChange('heart_rate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Mean Art. Press. (MAP)</span>
                    <span className="unit">70-105 mmHg</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={patientData.map}
                    min="30"
                    max="160"
                    onChange={(e) => handleInputChange('map', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">
                    <span>Resp. Rate</span>
                    <span className="unit">12-20 bpm</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={patientData.resp_rate}
                    min="6"
                    max="60"
                    onChange={(e) => handleInputChange('resp_rate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Core Temp</span>
                    <span className="unit">36.5-37.5 °C</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={patientData.temp_c}
                    min="30.0"
                    max="43.0"
                    onChange={(e) => handleInputChange('temp_c', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>SpO2 Oxygen Sat.</span>
                    <span className="unit">95-100 %</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={patientData.spo2}
                    min="50"
                    max="100"
                    onChange={(e) => handleInputChange('spo2', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Neurological & Mechanical Ventilation */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                2. Neurological & Airway Support
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">
                    <span>Glasgow Coma Scale (GCS)</span>
                    <span className="unit">3 to 15</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={patientData.gcs}
                    min="3"
                    max="15"
                    onChange={(e) => handleInputChange('gcs', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Invasive Mechanical Ventilation</span>
                    <span className="unit">{patientData.mech_vent ? 'Yes (Ventilated)' : 'No'}</span>
                  </label>
                  <div className="toggle-row">
                    <span style={{ fontSize: '0.85rem', color: patientData.mech_vent ? '#38bdf8' : 'var(--text-secondary)' }}>
                      {patientData.mech_vent ? 'Endotracheal / Tracheostomy' : 'Spontaneous Breathing'}
                    </span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={patientData.mech_vent === 1}
                        onChange={(e) => handleInputChange('mech_vent', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Critical Lab Biomarkers */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                3. Critical Laboratory Biomarkers
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">
                    <span>WBC Count</span>
                    <span className="unit">4.0-11.0 10^9/L</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={patientData.wbc}
                    onChange={(e) => handleInputChange('wbc', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Serum Creatinine</span>
                    <span className="unit">0.6-1.2 mg/dL</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={patientData.creatinine}
                    onChange={(e) => handleInputChange('creatinine', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>BUN</span>
                    <span className="unit">7-20 mg/dL</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={patientData.bun}
                    onChange={(e) => handleInputChange('bun', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-4">
                <div className="form-group">
                  <label className="form-label">
                    <span>Glucose</span>
                    <span className="unit">70-140</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={patientData.glucose}
                    onChange={(e) => handleInputChange('glucose', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Potassium (K+)</span>
                    <span className="unit">3.5-5.0</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={patientData.potassium}
                    onChange={(e) => handleInputChange('potassium', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Sodium (Na+)</span>
                    <span className="unit">135-145</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={patientData.sodium}
                    onChange={(e) => handleInputChange('sodium', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Platelets</span>
                    <span className="unit">150-450</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={patientData.platelets}
                    onChange={(e) => handleInputChange('platelets', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                <Activity size={18} />
                Evaluate Mortality Risk with Logistic Regression
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Prediction Score & Feature Attribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Result Card */}
          <div className="risk-hero-box">
            <div className="risk-circle">
              <svg viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={getGaugeColor(pct)}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
                />
              </svg>
              <div className="risk-circle-inner">
                <span className="risk-pct" style={{ color: getGaugeColor(pct) }}>
                  {pct}%
                </span>
                <span className="risk-label-small">Mortality Probability</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <span className={`badge ${getSeverityBadgeClass(prediction?.tier)}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
                {prediction?.tier || 'Assessing...'}
              </span>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'left', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Info size={14} color="#38bdf8" />
                Clinical Action Guidance:
              </div>
              {prediction?.recommendation || 'Input patient parameters to generate guidance.'}
            </div>

            {/* Classical Benchmark Scores (OASIS & SOFA) */}
            <div className="grid-2" style={{ marginTop: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OASIS Score</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {prediction?.clinical_benchmarks?.oasis_score ?? '--'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Oxford Acute Severity</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SOFA Estimate</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {prediction?.clinical_benchmarks?.estimated_sofa ?? '--'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Organ Failure Score</div>
              </div>
            </div>
          </div>

          {/* Feature Attribution Card */}
          <div className="card">
            <div className="card-title" style={{ fontSize: '0.95rem' }}>
              <TrendingUp size={16} color="#38bdf8" />
              Patient-Specific Risk Drivers (Log-Odds Impact)
            </div>
            <div className="card-subtitle">
              Relative deviation from average ICU patient ($z_i \times \beta_i$)
            </div>

            <div>
              {prediction?.contributions?.slice(0, 7).map((c) => {
                const isHarmful = c.contribution > 0;
                const absVal = Math.min(Math.abs(c.contribution) * 40, 100);
                
                return (
                  <div key={c.feature} className="attrib-bar-container">
                    <div className="attrib-name" title={c.feature}>
                      {c.feature.toUpperCase()}
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                        ({c.value} {c.unit})
                      </span>
                    </div>

                    <div className="attrib-track">
                      <div
                        className="attrib-fill"
                        style={{
                          width: `${absVal}%`,
                          backgroundColor: isHarmful ? '#f43f5e' : '#10b981',
                          marginLeft: isHarmful ? '50%' : `${50 - absVal}%`,
                        }}
                      />
                    </div>

                    <div className="attrib-val" style={{ color: isHarmful ? '#fb7185' : '#34d399' }}>
                      {c.contribution > 0 ? `+${c.contribution}` : c.contribution}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
