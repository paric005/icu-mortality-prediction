"""
Flask REST API for ICU Mortality Prediction (MIMIC-III & eICU-CRD)
=================================================================
Serves Logistic Regression clinical risk scoring, model metrics,
dataset switching, and patient inference.
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd

from model import ICUMortalityModel
from sample_patients import SAMPLE_PATIENTS
from data_generator import CLINICAL_FEATURES, REFERENCE_RANGES

DIST_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'dist')
app = Flask(__name__, static_folder=DIST_FOLDER, static_url_path='/')
# Enable CORS for local Vite dev server and production builds
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Data directory
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')

# Instantiate and train default model (MIMIC-III benchmark)
print("[Backend] Initializing ICU Mortality Model with MIMIC-III...")
icu_model = ICUMortalityModel(DATA_DIR)
icu_model.train(dataset_choice='mimic3', C=1.0, balance_weights=True)
print("[Backend] Model trained successfully.")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_trained': icu_model.is_trained,
        'dataset': icu_model.dataset_name,
        'features': CLINICAL_FEATURES
    })

@app.route('/api/model/summary', methods=['GET'])
def get_model_summary():
    """Return model performance metrics, coefficients, and odds ratios."""
    return jsonify({
        'dataset_name': icu_model.dataset_name,
        'dataset_stats': icu_model.dataset_stats,
        'metrics': icu_model.metrics,
        'odds_ratios': icu_model.odds_ratios,
        'reference_ranges': REFERENCE_RANGES
    })

@app.route('/api/predict', methods=['POST'])
def predict_mortality():
    """Predict mortality probability and clinical recommendations for a patient."""
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'error': 'No input JSON provided'}), 400
            
        prediction = icu_model.predict_patient(data)
        return jsonify(prediction)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/retrain', methods=['POST'])
def retrain_model():
    """Retrain model with specified dataset ('mimic3', 'eicu', 'combined') and parameters."""
    try:
        params = request.get_json(force=True) or {}
        dataset = params.get('dataset', 'mimic3')
        c_param = float(params.get('C', 1.0))
        balance_weights = bool(params.get('balance_weights', True))
        
        metrics = icu_model.train(dataset_choice=dataset, C=c_param, balance_weights=balance_weights)
        
        return jsonify({
            'message': f'Model retrained successfully on {icu_model.dataset_name}',
            'dataset_name': icu_model.dataset_name,
            'dataset_stats': icu_model.dataset_stats,
            'metrics': metrics,
            'odds_ratios': icu_model.odds_ratios
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/patients/samples', methods=['GET'])
def get_samples():
    """Return realistic pre-defined patient cases."""
    return jsonify(SAMPLE_PATIENTS)

@app.route('/api/cohort/preview', methods=['GET'])
def get_cohort_preview():
    """Return small slice of the cohort dataset for data exploration table."""
    try:
        dataset = request.args.get('dataset', 'mimic3')
        df = icu_model.load_data(dataset)
        sample = df.head(25).to_dict(orient='records')
        return jsonify({
            'dataset': dataset,
            'total_rows': len(df),
            'columns': list(df.columns),
            'rows': sample
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/batch-predict', methods=['POST'])
def batch_predict():
    """Process multiple patients and return summarized risk breakdown."""
    try:
        data = request.get_json(force=True)
        patients = data.get('patients', [])
        if not patients:
            return jsonify({'error': 'No patients array provided'}), 400
            
        results = []
        tier_counts = {'Low Risk': 0, 'Moderate Risk': 0, 'High Risk': 0, 'Critical Risk': 0}
        
        for pt in patients:
            pred = icu_model.predict_patient(pt)
            tier_counts[pred['tier']] = tier_counts.get(pred['tier'], 0) + 1
            results.append({
                'patient_id': pt.get('patient_id', 'Unknown'),
                'probability': pred['probability'],
                'percentage': pred['percentage'],
                'tier': pred['tier'],
                'oasis_score': pred['clinical_benchmarks']['oasis_score'],
                'sofa_score': pred['clinical_benchmarks']['estimated_sofa']
            })
            
        return jsonify({
            'total_analyzed': len(results),
            'tier_distribution': tier_counts,
            'predictions': results
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    if os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
    return jsonify({
        'message': 'ICU Mortality Prediction API is running. To serve frontend, build it in frontend/ or run npm run dev.',
        'endpoints': ['/api/health', '/api/model/summary', '/api/predict', '/api/retrain', '/api/patients/samples']
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[Backend] Starting Flask server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
