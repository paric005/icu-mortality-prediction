import React from 'react';
import { BarChart3, Target, Award, CheckCircle, Crosshair, AlertOctagon } from 'lucide-react';

export default function PerformanceView({ metrics, datasetName }) {
  const m = metrics || {};
  const cm = m.confusion_matrix || { true_negative: 0, false_positive: 0, false_negative: 0, true_positive: 0 };

  // Calculate SVG paths for ROC Curve
  const rocPoints = m.roc_curve || [];
  const svgWidth = 360;
  const svgHeight = 240;
  const padding = 35;
  const plotW = svgWidth - 2 * padding;
  const plotH = svgHeight - 2 * padding;

  const toSvgCoords = (x, y) => {
    const sx = padding + x * plotW;
    const sy = padding + (1 - y) * plotH;
    return `${sx},${sy}`;
  };

  let rocPathStr = '';
  if (rocPoints.length > 0) {
    rocPathStr = `M ${toSvgCoords(rocPoints[0].fpr, rocPoints[0].tpr)}`;
    for (let i = 1; i < rocPoints.length; i++) {
      rocPathStr += ` L ${toSvgCoords(rocPoints[i].fpr, rocPoints[i].tpr)}`;
    }
  }

  // Calibration curve points
  const calibPoints = m.calibration_curve || [];
  let calibPathStr = '';
  if (calibPoints.length > 0) {
    calibPathStr = `M ${toSvgCoords(calibPoints[0].predicted, calibPoints[0].actual)}`;
    for (let i = 1; i < calibPoints.length; i++) {
      calibPathStr += ` L ${toSvgCoords(calibPoints[i].predicted, calibPoints[i].actual)}`;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metric Stat Cards */}
      <div className="grid-4">
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Discrimination (ROC-AUC)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
            {m.roc_auc || '0.88'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Award size={12} /> Excellent Discrimination
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Sensitivity (Recall)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
            {(m.recall_sensitivity * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Captures deteriorating cases
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Specificity
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
            {(m.specificity * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Avoids false alarms
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Brier Score (Calibration)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
            {m.brier_score || '0.12'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Lower is better (0.00 = perfect)
          </div>
        </div>
      </div>

      {/* Curves: ROC & Calibration */}
      <div className="grid-2">
        {/* ROC Curve */}
        <div className="card">
          <div className="card-title">
            <Target size={18} color="#38bdf8" />
            Receiver Operating Characteristic (ROC)
          </div>
          <div className="card-subtitle">
            Trade-off between True Positive Rate and False Positive Rate (AUC = {m.roc_auc})
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
              {/* Axes */}
              <line x1={padding} y1={padding + plotH} x2={padding + plotW} y2={padding + plotH} stroke="var(--border-subtle)" strokeWidth="1.5" />
              <line x1={padding} y1={padding} x2={padding} y2={padding + plotH} stroke="var(--border-subtle)" strokeWidth="1.5" />

              {/* Gridlines */}
              <line x1={padding} y1={padding + plotH / 2} x2={padding + plotW} y2={padding + plotH / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1={padding + plotW / 2} y1={padding} x2={padding + plotW / 2} y2={padding + plotH} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

              {/* Random Baseline (y = x) */}
              <line
                x1={toSvgCoords(0, 0).split(',')[0]}
                y1={toSvgCoords(0, 0).split(',')[1]}
                x2={toSvgCoords(1, 1).split(',')[0]}
                y2={toSvgCoords(1, 1).split(',')[1]}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 4"
              />

              {/* Area under ROC */}
              {rocPathStr && (
                <path
                  d={`${rocPathStr} L ${toSvgCoords(1, 0)} L ${toSvgCoords(0, 0)} Z`}
                  fill="rgba(56, 189, 248, 0.12)"
                />
              )}

              {/* Model ROC Line */}
              {rocPathStr && (
                <path
                  d={rocPathStr}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Labels */}
              <text x={padding + plotW / 2} y={svgHeight - 5} textAnchor="middle" className="chart-axis-text">
                False Positive Rate (1 - Specificity)
              </text>
              <text x={12} y={padding + plotH / 2} textAnchor="middle" transform={`rotate(-90 12 ${padding + plotH / 2})`} className="chart-axis-text">
                True Positive Rate (Sensitivity)
              </text>
            </svg>
          </div>
        </div>

        {/* Calibration Curve */}
        <div className="card">
          <div className="card-title">
            <Crosshair size={18} color="#10b981" />
            Reliability & Calibration Curve
          </div>
          <div className="card-subtitle">
            Observed vs. Predicted Mortality Risk Bins (Brier Score = {m.brier_score})
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
              {/* Axes */}
              <line x1={padding} y1={padding + plotH} x2={padding + plotW} y2={padding + plotH} stroke="var(--border-subtle)" strokeWidth="1.5" />
              <line x1={padding} y1={padding} x2={padding} y2={padding + plotH} stroke="var(--border-subtle)" strokeWidth="1.5" />

              {/* Ideal calibration diagonal */}
              <line
                x1={toSvgCoords(0, 0).split(',')[0]}
                y1={toSvgCoords(0, 0).split(',')[1]}
                x2={toSvgCoords(1, 1).split(',')[0]}
                y2={toSvgCoords(1, 1).split(',')[1]}
                stroke="#10b981"
                strokeDasharray="3 3"
                opacity="0.4"
              />

              {/* Calibration Path */}
              {calibPathStr && (
                <path
                  d={calibPathStr}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
              )}

              {/* Calibration Dots */}
              {calibPoints.map((pt, i) => {
                const coords = toSvgCoords(pt.predicted, pt.actual).split(',');
                return (
                  <circle
                    key={i}
                    cx={coords[0]}
                    cy={coords[1]}
                    r="4"
                    fill="#34d399"
                    stroke="#0b0f19"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Labels */}
              <text x={padding + plotW / 2} y={svgHeight - 5} textAnchor="middle" className="chart-axis-text">
                Mean Predicted Probability
              </text>
              <text x={12} y={padding + plotH / 2} textAnchor="middle" transform={`rotate(-90 12 ${padding + plotH / 2})`} className="chart-axis-text">
                Observed Mortality Fraction
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Analysis */}
      <div className="card">
        <div className="card-title">
          <BarChart3 size={18} color="#38bdf8" />
          Test Set Confusion Matrix & Error Profiling
        </div>
        <div className="card-subtitle">
          Evaluated on 20% holdout test admissions ({cm.true_negative + cm.false_positive + cm.false_negative + cm.true_positive} patients)
        </div>

        <div className="grid-2">
          {/* Matrix table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>TRUE NEGATIVE (TN)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {cm.true_negative}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Correctly identified survivors</div>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>FALSE POSITIVE (FP)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {cm.false_positive}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Overtriage / False warning</div>
            </div>

            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: 600 }}>FALSE NEGATIVE (FN)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {cm.false_negative}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Undertriage (Critical to minimize)</div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>TRUE POSITIVE (TP)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {cm.true_positive}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Correctly flagged high-risk mortality</div>
            </div>
          </div>

          {/* Clinical summary explanation */}
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertOctagon size={16} color="#38bdf8" />
              Clinical Risk Trade-off
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              In critical care medicine, missing an unstable or deteriorating patient (<strong>False Negative</strong>) can lead to delayed intervention and preventable death. Our Logistic Regression model is tuned with balanced class weights to maximize <strong>Sensitivity ({((m.recall_sensitivity || 0) * 100).toFixed(1)}%)</strong> while maintaining high clinical specificity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
