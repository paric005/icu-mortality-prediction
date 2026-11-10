import React, { useState, useEffect } from 'react';
import { Database, Sliders, RefreshCw, FileText, ExternalLink, Check, AlertCircle } from 'lucide-react';

export default function DatasetExplorerView({ modelInfo, onRetrain, isRetraining }) {
  const [selectedDataset, setSelectedDataset] = useState('mimic3');
  const [cParam, setCParam] = useState(1.0);
  const [balanceWeights, setBalanceWeights] = useState(true);
  const [cohortPreview, setCohortPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Fetch dataset preview
  const fetchPreview = async (ds) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/cohort/preview?dataset=${ds}`);
      const data = await res.json();
      setCohortPreview(data);
    } catch (err) {
      console.error('Failed to load cohort preview:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview(selectedDataset);
  }, [selectedDataset]);

  const handleRetrainSubmit = (e) => {
    e.preventDefault();
    onRetrain({
      dataset: selectedDataset,
      C: cParam,
      balance_weights: balanceWeights
    });
  };

  const stats = modelInfo?.dataset_stats || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner: PhysioNet MIMIC-III & eICU CRD Context */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(20, 30, 48, 0.8), rgba(15, 23, 42, 0.95))' }}>
        <div className="card-title">
          <Database size={20} color="#38bdf8" />
          PhysioNet ICU Data Sources: MIMIC-III & eICU-CRD
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '0.25rem' }}>
              MIMIC-III (Medical Information Mart for Intensive Care III)
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Single-center repository comprising ~40,000 distinct critical care patients admitted to Beth Israel Deaconess Medical Center (Boston, MA). Features comprehensive high-resolution charted vitals, labs, and invasive ventilation records.
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: '#06b6d4', marginBottom: '0.25rem' }}>
              eICU Collaborative Research Database (eICU-CRD)
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Multi-center telehealth ICU database covering &gt;200,000 admissions across 208 distinct hospitals across the United States. Provides broad geographical diversity and cross-hospital generalizability.
            </p>
          </div>
        </div>
      </div>

      {/* Retrain Control Panel & Dataset Stats */}
      <div className="grid-2">
        {/* Retraining Panel */}
        <div className="card">
          <div className="card-title">
            <Sliders size={18} color="#38bdf8" />
            Active Training Configuration & Retraining
          </div>
          <div className="card-subtitle">
            Re-fit Logistic Regression model with custom regularization & dataset
          </div>

          <form onSubmit={handleRetrainSubmit}>
            <div className="form-group">
              <label className="form-label">
                <span>Select PhysioNet Benchmark Cohort</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  className={`btn ${selectedDataset === 'mimic3' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                  onClick={() => setSelectedDataset('mimic3')}
                >
                  MIMIC-III
                </button>
                <button
                  type="button"
                  className={`btn ${selectedDataset === 'eicu' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                  onClick={() => setSelectedDataset('eicu')}
                >
                  eICU-CRD
                </button>
                <button
                  type="button"
                  className={`btn ${selectedDataset === 'combined' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                  onClick={() => setSelectedDataset('combined')}
                >
                  Combined
                </button>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">
                  <span>Regularization Inverse (C)</span>
                  <span className="unit">{cParam}</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="5.0"
                  step="0.05"
                  value={cParam}
                  style={{ width: '100%' }}
                  onChange={(e) => setCParam(parseFloat(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>0.05 (Heavy L2)</span>
                  <span>5.0 (Weak L2)</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Class Balancing</span>
                  <span className="unit">{balanceWeights ? 'Balanced' : 'None'}</span>
                </label>
                <div className="toggle-row" style={{ height: '44px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Weight ~10:1 ratio
                  </span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={balanceWeights}
                      onChange={(e) => setBalanceWeights(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
              disabled={isRetraining}
            >
              <RefreshCw size={16} className={isRetraining ? 'animate-spin' : ''} />
              {isRetraining ? 'Retraining on Cohort...' : `Train Model on ${selectedDataset.toUpperCase()}`}
            </button>
          </form>
        </div>

        {/* Dataset Stats */}
        <div className="card">
          <div className="card-title">
            <Database size={18} color="#38bdf8" />
            Currently Loaded Cohort Profile
          </div>
          <div className="card-subtitle">
            Statistical breakdown of active training cohort
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Patients</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {stats.total_patients ? stats.total_patients.toLocaleString() : '--'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Standardized admission stays</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>In-Hospital Mortality</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fb7185', fontFamily: 'var(--font-mono)' }}>
                {stats.mortality_rate ? `${(stats.mortality_rate * 100).toFixed(1)}%` : '--'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{stats.mortality_cases || 0} non-survivors</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mean Age</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {stats.mean_age ? `${stats.mean_age.toFixed(1)} yrs` : '--'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Adult ICU population</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mech. Ventilation</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                {stats.mech_vent_pct ? `${stats.mech_vent_pct.toFixed(1)}%` : '--'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Invasive airway support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Raw Data Preview Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div className="card-title">
              <FileText size={18} color="#38bdf8" />
              PhysioNet Cohort Records Preview ({selectedDataset.toUpperCase()})
            </div>
            <div className="card-subtitle" style={{ marginBottom: 0 }}>
              Inspecting raw admission rows with clinical labels (0 = Survived, 1 = Deceased)
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing first 25 records
          </span>
        </div>

        {isLoadingPreview ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Loading records...
          </div>
        ) : (
          <div className="table-responsive">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Age</th>
                  <th>HR</th>
                  <th>MAP</th>
                  <th>RR</th>
                  <th>Temp</th>
                  <th>SpO2</th>
                  <th>GCS</th>
                  <th>WBC</th>
                  <th>Creat</th>
                  <th>Vent</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {cohortPreview?.rows?.map((row, idx) => {
                  const isDeceased = row.in_hospital_mortality === 1;
                  return (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#38bdf8' }}>
                        {row.patient_id}
                      </td>
                      <td>{row.age}</td>
                      <td>{row.heart_rate}</td>
                      <td>{row.map}</td>
                      <td>{row.resp_rate}</td>
                      <td>{row.temp_c}°C</td>
                      <td>{row.spo2}%</td>
                      <td>{row.gcs}</td>
                      <td>{row.wbc}</td>
                      <td>{row.creatinine}</td>
                      <td>{row.mech_vent === 1 ? 'Yes' : 'No'}</td>
                      <td>
                        <span className={`badge ${isDeceased ? 'badge-rose' : 'badge-emerald'}`}>
                          {isDeceased ? 'Deceased' : 'Survived'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
