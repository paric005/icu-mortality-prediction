import React from 'react';
import { ShieldAlert, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ModelExplainerView({ oddsRatios, datasetName }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Educational Banner on Logistic Regression in Medicine */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))' }}>
        <div className="card-title">
          <BookOpen size={20} color="#38bdf8" />
          Clinical Transparency: Why Logistic Regression in the ICU?
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '1000px' }}>
          Unlike black-box neural networks, <strong>Logistic Regression</strong> is the foundational methodology behind validated clinical scoring systems like APACHE-IV, SAPS-II, and OASIS. Its mathematical formulation yields direct, interpretable <strong>Odds Ratios (\(e^\beta\))</strong>. For every 1-standard deviation increase in a physiological parameter, the odds of in-hospital ICU mortality multiply by exactly its Odds Ratio, allowing intensivists to audit and justify every risk score.
        </p>
      </div>

      {/* Odds Ratio Forest Plot & Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div className="card-title">
              <ShieldAlert size={18} color="#38bdf8" />
              Standardized Odds Ratios & 95% Confidence Intervals
            </div>
            <div className="card-subtitle" style={{ marginBottom: 0 }}>
              Trained on {datasetName || 'PhysioNet MIMIC-III'} · Reference line at OR = 1.0 (Neutral)
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fb7185' }}>
              ● OR &gt; 1.0 (Harmful / Increases Risk)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399' }}>
              ● OR &lt; 1.0 (Protective / Lowers Risk)
            </span>
          </div>
        </div>

        {/* Visual Forest Representation */}
        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ width: '22%' }}>FEATURE</div>
            <div style={{ width: '18%' }}>ODDS RATIO (95% CI)</div>
            <div style={{ width: '60%', textAlign: 'center' }}>0.5 ──── 0.8 ──── 1.0 (NEUTRAL) ──── 1.5 ──── 2.5+</div>
          </div>

          {oddsRatios?.map((item) => {
            const or = item.odds_ratio;
            const isRisk = or > 1.0;
            // Map OR to percentage position on 0.2 to 3.0 scale
            // log scale or linear clip
            const minScale = 0.2;
            const maxScale = 3.0;
            const normPos = Math.min(Math.max((or - minScale) / (maxScale - minScale), 0), 1) * 100;
            const lowerPos = Math.min(Math.max((item.ci_lower - minScale) / (maxScale - minScale), 0), 1) * 100;
            const upperPos = Math.min(Math.max((item.ci_upper - minScale) / (maxScale - minScale), 0), 1) * 100;
            const centerNeutralPos = ((1.0 - minScale) / (maxScale - minScale)) * 100;

            return (
              <div key={item.feature} style={{ display: 'flex', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.8rem' }}>
                <div style={{ width: '22%', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.feature.toUpperCase()}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>
                    {item.normal_range}
                  </span>
                </div>

                <div style={{ width: '18%', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isRisk ? '#fb7185' : '#34d399' }}>
                  <strong>{or.toFixed(2)}</strong> [{item.ci_lower.toFixed(2)} - {item.ci_upper.toFixed(2)}]
                </div>

                <div style={{ width: '60%', position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
                  {/* Neutral line */}
                  <div style={{ position: 'absolute', left: `${centerNeutralPos}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                  
                  {/* Confidence Interval Line */}
                  <div style={{
                    position: 'absolute',
                    left: `${lowerPos}%`,
                    width: `${Math.max(upperPos - lowerPos, 2)}%`,
                    height: '2px',
                    background: isRisk ? 'rgba(244, 63, 94, 0.5)' : 'rgba(16, 185, 129, 0.5)'
                  }} />

                  {/* Point Estimate Dot */}
                  <div style={{
                    position: 'absolute',
                    left: `calc(${normPos}% - 5px)`,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: isRisk ? '#f43f5e' : '#10b981',
                    boxShadow: isRisk ? '0 0 8px rgba(244,63,94,0.6)' : '0 0 8px rgba(16,185,129,0.6)'
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Coefficient Detail Table */}
        <div className="table-responsive">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Standardized β (Weight)</th>
                <th>Odds Ratio (OR)</th>
                <th>95% Confidence Interval</th>
                <th>Risk Direction</th>
                <th>Physiological Significance</th>
              </tr>
            </thead>
            <tbody>
              {oddsRatios?.map((item) => (
                <tr key={item.feature}>
                  <td style={{ fontWeight: 600 }}>{item.feature.toUpperCase()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {item.coefficient > 0 ? `+${item.coefficient}` : item.coefficient}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.odds_ratio > 1 ? '#fb7185' : '#34d399' }}>
                    {item.odds_ratio}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    [{item.ci_lower} — {item.ci_upper}]
                  </td>
                  <td>
                    <span className={`badge ${item.odds_ratio > 1 ? 'badge-rose' : 'badge-emerald'}`}>
                      {item.risk_impact}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {item.feature === 'mech_vent' && 'Invasive respiratory failure indicator'}
                    {item.feature === 'age' && 'Frailty and comorbid vulnerability'}
                    {item.feature === 'creatinine' && 'Renal dysfunction & acute tubular necrosis'}
                    {item.feature === 'bun' && 'Azotemia, hypoperfusion, catabolism'}
                    {item.feature === 'gcs' && 'Neurological suppression / brain trauma'}
                    {item.feature === 'map' && 'Hypotension / septic shock vascular collapse'}
                    {item.feature === 'spo2' && 'Hypoxemia / acute respiratory distress'}
                    {item.feature === 'heart_rate' && 'Tachycardia from sympathetic overdrive'}
                    {item.feature === 'resp_rate' && 'Tachypnea / respiratory muscle fatigue'}
                    {item.feature === 'wbc' && 'Systemic inflammatory response syndrome (SIRS)'}
                    {item.feature === 'temp_c' && 'Severe hypothermia or hyperpyrexia'}
                    {item.feature === 'potassium' && 'Fatal cardiac arrhythmia hazard'}
                    {item.feature === 'glucose' && 'Stress hyperglycemia / ketoacidosis'}
                    {item.feature === 'sodium' && 'Osmolar imbalance / neurodysfunction'}
                    {item.feature === 'platelets' && 'Disseminated intravascular coagulation (DIC)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
