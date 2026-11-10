import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PredictorView from './components/PredictorView';
import ModelExplainerView from './components/ModelExplainerView';
import PerformanceView from './components/PerformanceView';
import DatasetExplorerView from './components/DatasetExplorerView';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('predictor');
  const [modelInfo, setModelInfo] = useState(null);
  const [samples, setSamples] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [notification, setNotification] = useState(null);

  // Show temporary toast notification
  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch initial model metadata and sample patients
  const fetchModelInfo = async () => {
    try {
      const res = await fetch('/api/model/summary');
      if (res.ok) {
        const data = await res.json();
        setModelInfo(data);
      }
    } catch (err) {
      console.error('Failed to load model summary:', err);
    }
  };

  const fetchSamples = async () => {
    try {
      const res = await fetch('/api/patients/samples');
      if (res.ok) {
        const data = await res.json();
        setSamples(data);
      }
    } catch (err) {
      console.error('Failed to load sample patients:', err);
    }
  };

  useEffect(() => {
    fetchModelInfo();
    fetchSamples();
  }, []);

  // Handle single patient prediction
  const handlePredict = async (patientData) => {
    setIsPredicting(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      if (res.ok) {
        const result = await res.json();
        setPrediction(result);
      } else {
        notify('Prediction request failed', 'error');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      notify('Connection error to Flask backend', 'error');
    } finally {
      setIsPredicting(false);
    }
  };

  // Handle retraining model
  const handleRetrain = async (params) => {
    setIsRetraining(true);
    try {
      const res = await fetch('/api/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const result = await res.json();
        setModelInfo({
          dataset_name: result.dataset_name,
          dataset_stats: result.dataset_stats,
          metrics: result.metrics,
          odds_ratios: result.odds_ratios
        });
        notify(`Model successfully retrained on ${result.dataset_name} (AUC: ${result.metrics.roc_auc})`);
      } else {
        notify('Failed to retrain model', 'error');
      }
    } catch (err) {
      console.error('Retrain error:', err);
      notify('Error contacting backend server', 'error');
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        modelInfo={modelInfo}
        isRetraining={isRetraining}
      />

      <main className="app-container">
        {notification && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: notification.type === 'error' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${notification.type === 'error' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              color: notification.type === 'error' ? '#fb7185' : '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{notification.msg}</span>
          </div>
        )}

        {activeTab === 'predictor' && (
          <PredictorView
            samples={samples}
            onPredict={handlePredict}
            prediction={prediction}
            isPredicting={isPredicting}
          />
        )}

        {activeTab === 'explainer' && (
          <ModelExplainerView
            oddsRatios={modelInfo?.odds_ratios}
            datasetName={modelInfo?.dataset_name}
          />
        )}

        {activeTab === 'performance' && (
          <PerformanceView
            metrics={modelInfo?.metrics}
            datasetName={modelInfo?.dataset_name}
          />
        )}

        {activeTab === 'dataset' && (
          <DatasetExplorerView
            modelInfo={modelInfo}
            onRetrain={handleRetrain}
            isRetraining={isRetraining}
          />
        )}
      </main>
    </div>
  );
}
