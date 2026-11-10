import React from 'react';
import { Activity, ShieldAlert, BarChart3, Database, Stethoscope, Cpu } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, modelInfo, isRetraining }) {
  return (
    <header className="header-glass">
      <div className="header-content">
        <div className="logo-badge">
          <div className="logo-icon">
            <Activity size={24} />
          </div>
          <div className="title-group">
            <h1>ICU Mortality Risk Engine</h1>
            <p>Logistic Regression Clinical Decision Support · MIMIC-III & eICU-CRD</p>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'predictor' ? 'active' : ''}`}
            onClick={() => setActiveTab('predictor')}
          >
            <Stethoscope size={16} />
            <span>Patient Assessment</span>
          </button>
          
          <button
            className={`nav-tab-btn ${activeTab === 'explainer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explainer')}
          >
            <ShieldAlert size={16} />
            <span>Odds Ratios & Features</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <BarChart3 size={16} />
            <span>ROC & Calibration</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'dataset' ? 'active' : ''}`}
            onClick={() => setActiveTab('dataset')}
          >
            <Database size={16} />
            <span>PhysioNet Cohorts</span>
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isRetraining ? (
            <span className="badge badge-amber">
              <span className="animate-spin">⟳</span> Retraining...
            </span>
          ) : (
            <span className="badge badge-blue">
              <Cpu size={12} />
              {modelInfo?.dataset_name ? modelInfo.dataset_name.split(' ')[0] : 'MIMIC-III'} (AUC: {modelInfo?.metrics?.roc_auc || '0.88'})
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
