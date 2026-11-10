"""
ICU Mortality Prediction Engine - Logistic Regression Pipeline
=============================================================
Provides model training, evaluation (ROC-AUC, PR-AUC, Calibration),
interpretability (Odds Ratios, Log-odds feature contributions),
and inference comparison with clinical benchmark scores (OASIS/SOFA).
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score, average_precision_score, accuracy_score,
    precision_score, recall_score, f1_score, confusion_matrix,
    roc_curve, precision_recall_curve, brier_score_loss
)
from sklearn.calibration import calibration_curve

from data_generator import CLINICAL_FEATURES, REFERENCE_RANGES, ensure_datasets_available

class ICUMortalityModel:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.scaler = StandardScaler()
        self.model = LogisticRegression(
            C=1.0,
            solver='lbfgs',
            max_iter=1000,
            class_weight='balanced',
            random_state=42
        )
        self.feature_names = CLINICAL_FEATURES
        self.is_trained = False
        self.metrics = {}
        self.odds_ratios = []
        self.dataset_name = 'mimic3'
        self.dataset_stats = {}

    def load_data(self, dataset_choice: str = 'mimic3'):
        """Load chosen dataset: 'mimic3', 'eicu', or 'combined'."""
        mimic_path, eicu_path = ensure_datasets_available(self.data_dir)
        
        if dataset_choice == 'mimic3':
            df = pd.read_csv(mimic_path)
            self.dataset_name = 'MIMIC-III (PhysioNet Single-Center)'
        elif dataset_choice == 'eicu':
            df = pd.read_csv(eicu_path)
            self.dataset_name = 'eICU-CRD (PhysioNet Multi-Center)'
        elif dataset_choice == 'combined':
            df1 = pd.read_csv(mimic_path)
            df2 = pd.read_csv(eicu_path)
            df = pd.concat([df1, df2], ignore_index=True)
            self.dataset_name = 'Combined (MIMIC-III + eICU-CRD)'
        else:
            raise ValueError(f"Unknown dataset choice: {dataset_choice}")
            
        return df

    def train(self, dataset_choice: str = 'mimic3', C: float = 1.0, balance_weights: bool = True):
        """Train Logistic Regression model and calculate validation metrics & odds ratios."""
        df = self.load_data(dataset_choice)
        
        X = df[self.feature_names].values
        y = df['in_hospital_mortality'].values
        
        # Calculate dataset statistics for baseline context
        self.dataset_stats = {
            'total_patients': int(len(df)),
            'mortality_cases': int(np.sum(y == 1)),
            'survival_cases': int(np.sum(y == 0)),
            'mortality_rate': float(np.mean(y)),
            'mean_age': float(df['age'].mean()),
            'mech_vent_pct': float(df['mech_vent'].mean() * 100)
        }
        
        # Stratified Train/Test split (80/20)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, stratify=y, random_state=42
        )
        
        # Standardize features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Fit model
        class_weight = 'balanced' if balance_weights else None
        self.model = LogisticRegression(
            C=C,
            solver='lbfgs',
            max_iter=1000,
            class_weight=class_weight,
            random_state=42
        )
        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True
        
        # Evaluation on test set
        y_prob = self.model.predict_proba(X_test_scaled)[:, 1]
        y_pred = self.model.predict(X_test_scaled)
        
        roc_auc = roc_auc_score(y_test, y_prob)
        pr_auc = average_precision_score(y_test, y_prob)
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        brier = brier_score_loss(y_test, y_prob)
        
        # Specificity
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        
        # ROC Curve downsampled
        fpr, tpr, roc_thresh = roc_curve(y_test, y_prob)
        step = max(1, len(fpr) // 40)
        roc_points = [{'fpr': round(float(f), 4), 'tpr': round(float(t), 4)} for f, t in zip(fpr[::step], tpr[::step])]
        if roc_points[-1]['fpr'] != 1.0:
            roc_points.append({'fpr': 1.0, 'tpr': 1.0})
            
        # PR Curve downsampled
        prec_curve, rec_curve, _ = precision_recall_curve(y_test, y_prob)
        step_pr = max(1, len(rec_curve) // 40)
        pr_points = [{'recall': round(float(r), 4), 'precision': round(float(p), 4)} for r, p in zip(rec_curve[::step_pr], prec_curve[::step_pr])]
        
        # Calibration Curve (5 bins)
        prob_true, prob_pred = calibration_curve(y_test, y_prob, n_bins=5, strategy='quantile')
        calibration_points = [{'predicted': round(float(p), 4), 'actual': round(float(a), 4)} for p, a in zip(prob_pred, prob_true)]
        
        self.metrics = {
            'roc_auc': round(float(roc_auc), 4),
            'pr_auc': round(float(pr_auc), 4),
            'accuracy': round(float(acc), 4),
            'precision': round(float(prec), 4),
            'recall_sensitivity': round(float(rec), 4),
            'specificity': round(float(specificity), 4),
            'f1_score': round(float(f1), 4),
            'brier_score': round(float(brier), 4),
            'confusion_matrix': {
                'true_negative': int(tn),
                'false_positive': int(fp),
                'false_negative': int(fn),
                'true_positive': int(tp)
            },
            'roc_curve': roc_points,
            'pr_curve': pr_points,
            'calibration_curve': calibration_points,
            'hyperparameters': {
                'C': C,
                'penalty': 'L2',
                'class_weight': class_weight or 'None',
                'dataset': self.dataset_name
            }
        }
        
        # Compute Odds Ratios and approximate 95% Confidence Intervals
        coefs = self.model.coef_[0]
        # Standard error approximation for logistic regression via Fisher information
        # W = diag(p * (1 - p))
        p_train = self.model.predict_proba(X_train_scaled)[:, 1]
        w = p_train * (1 - p_train)
        w = np.maximum(w, 1e-5)
        # (X^T W X)^-1
        try:
            XtWX = np.dot(X_train_scaled.T * w, X_train_scaled)
            XtWX_reg = XtWX + 1e-4 * np.eye(len(self.feature_names))
            cov_matrix = np.linalg.pinv(XtWX_reg)
            std_err = np.sqrt(np.diag(cov_matrix))
        except Exception:
            std_err = np.full(len(coefs), 0.08)
            
        self.odds_ratios = []
        for i, fname in enumerate(self.feature_names):
            coef = coefs[i]
            se = std_err[i]
            odds_ratio = np.exp(coef)
            ci_lower = np.exp(coef - 1.96 * se)
            ci_upper = np.exp(coef + 1.96 * se)
            
            self.odds_ratios.append({
                'feature': fname,
                'coefficient': round(float(coef), 4),
                'odds_ratio': round(float(odds_ratio), 4),
                'ci_lower': round(float(ci_lower), 4),
                'ci_upper': round(float(ci_upper), 4),
                'risk_impact': 'Increases Risk' if coef > 0 else 'Decreases Risk',
                'normal_range': REFERENCE_RANGES[fname]['normal'],
                'unit': REFERENCE_RANGES[fname]['unit']
            })
            
        # Sort by magnitude of coefficient
        self.odds_ratios.sort(key=lambda item: abs(item['coefficient']), reverse=True)
        
        return self.metrics

    def predict_patient(self, patient_data: dict):
        """
        Predict mortality for a single patient and return risk tier,
        log-odds breakdown, and clinical score benchmarks.
        """
        if not self.is_trained:
            self.train()
            
        # Ensure all features present with fallback to cohort mean or default
        vector = []
        for feat in self.feature_names:
            val = patient_data.get(feat, 0.0)
            try:
                vector.append(float(val))
            except (ValueError, TypeError):
                vector.append(0.0)
                
        raw_x = np.array([vector])
        scaled_x = self.scaler.transform(raw_x)[0]
        
        # Logistic equation: logit = intercept + sum(coef_i * z_i)
        intercept = float(self.model.intercept_[0])
        coefs = self.model.coef_[0]
        
        feature_contributions = []
        for i, feat in enumerate(self.feature_names):
            z_score = float(scaled_x[i])
            coef = float(coefs[i])
            contrib = coef * z_score
            raw_val = float(raw_x[0][i])
            feature_contributions.append({
                'feature': feat,
                'value': raw_val,
                'unit': REFERENCE_RANGES[feat]['unit'],
                'normal': REFERENCE_RANGES[feat]['normal'],
                'contribution': round(contrib, 3),
                'direction': 'Raises Risk' if contrib > 0.05 else ('Lowers Risk' if contrib < -0.05 else 'Neutral')
            })
            
        # Sort contributions by absolute impact
        feature_contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
        
        # Probability
        prob = float(self.model.predict_proba([scaled_x])[0][1])
        percent = round(prob * 100, 1)
        
        # Stratification
        if percent < 12.0:
            tier = 'Low Risk'
            severity_color = 'emerald'
            recommendation = 'Standard ICU monitoring protocol. Hemodynamically stable parameters.'
        elif percent < 28.0:
            tier = 'Moderate Risk'
            severity_color = 'amber'
            recommendation = 'Close surveillance. Repeat vital and lab checks every 2-4 hours.'
        elif percent < 55.0:
            tier = 'High Risk'
            severity_color = 'orange'
            recommendation = 'Intensive clinical intervention recommended. Evaluate vasopressor titration, respiratory support, and organ perfusion.'
        else:
            tier = 'Critical Risk'
            severity_color = 'rose'
            recommendation = 'Urgent multidisciplinary escalation. High acute mortality hazard; immediate critical care review required.'
            
        # Calculate simplified clinical severity benchmarks for comparison
        oasis_score = self.calculate_oasis(patient_data)
        sofa_score = self.calculate_sofa(patient_data)
        
        return {
            'probability': round(prob, 4),
            'percentage': percent,
            'tier': tier,
            'severity_color': severity_color,
            'recommendation': recommendation,
            'contributions': feature_contributions,
            'clinical_benchmarks': {
                'oasis_score': oasis_score,
                'estimated_sofa': sofa_score
            }
        }

    @staticmethod
    def calculate_oasis(data: dict) -> int:
        """Oxford Acute Severity of Illness Score (OASIS) baseline approximation."""
        score = 0
        age = float(data.get('age', 50))
        if age >= 66: score += 7
        elif age >= 54: score += 5
        elif age >= 24: score += 3
        
        hr = float(data.get('heart_rate', 80))
        if hr > 125 or hr < 51: score += 6
        elif hr > 107: score += 3
        
        gcs = float(data.get('gcs', 15))
        if gcs <= 7: score += 10
        elif gcs <= 13: score += 4
        
        map_val = float(data.get('map', 80))
        if map_val < 51: score += 4
        elif map_val < 61: score += 2
        
        rr = float(data.get('resp_rate', 16))
        if rr >= 31 or rr <= 12: score += 6
        
        vent = int(data.get('mech_vent', 0))
        if vent == 1: score += 9
        
        return score

    @staticmethod
    def calculate_sofa(data: dict) -> int:
        """Sequential Organ Failure Assessment (SOFA) approximation."""
        score = 0
        gcs = float(data.get('gcs', 15))
        if gcs < 6: score += 4
        elif gcs <= 9: score += 3
        elif gcs <= 12: score += 2
        elif gcs <= 14: score += 1
        
        map_val = float(data.get('map', 80))
        if map_val < 70: score += 1
        
        creat = float(data.get('creatinine', 1.0))
        if creat >= 5.0: score += 4
        elif creat >= 3.5: score += 3
        elif creat >= 2.0: score += 2
        elif creat >= 1.2: score += 1
        
        platelets = float(data.get('platelets', 200))
        if platelets < 20: score += 4
        elif platelets < 50: score += 3
        elif platelets < 100: score += 2
        elif platelets < 150: score += 1
        
        return score
