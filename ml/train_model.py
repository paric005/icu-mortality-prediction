import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score, 
    recall_score, f1_score, confusion_matrix, roc_curve
)

# -------------------------------------------------------------
# 1. GENERATE REALISTIC CLINICAL ICU DATASET (PhysioNet / MIMIC-III Benchmark)
# -------------------------------------------------------------
def generate_icu_dataset(n_samples=6000, random_state=42):
    np.random.seed(random_state)
    print(f"Generating clinical ICU dataset with {n_samples} patient records...")

    # Clinical features
    age = np.random.normal(63, 14, n_samples).clip(18, 95).round(1)
    gender = np.random.choice([0, 1], n_samples, p=[0.45, 0.55]) # 0=Female, 1=Male
    heart_rate = np.random.normal(88, 20, n_samples).clip(45, 175).round(1)
    mean_arterial_pressure = np.random.normal(76, 18, n_samples).clip(35, 135).round(1)
    resp_rate = np.random.normal(21, 6, n_samples).clip(8, 48).round(1)
    spo2 = np.random.normal(95.5, 4.0, n_samples).clip(68, 100).round(1)
    temperature = np.random.normal(37.1, 0.9, n_samples).clip(34.2, 40.8).round(1)
    gcs = np.random.choice(
        [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        n_samples,
        p=[0.05, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06, 0.06, 0.07, 0.08, 0.10, 0.15, 0.20]
    )
    bun = np.random.exponential(24, n_samples).clip(5, 130).round(1)
    creatinine = np.random.exponential(1.5, n_samples).clip(0.4, 12.0).round(2)
    wbc = np.random.normal(12.5, 6.5, n_samples).clip(1.2, 48.0).round(1)
    glucose = np.random.normal(142, 55, n_samples).clip(55, 490).round(1)
    lactate = np.random.exponential(2.2, n_samples).clip(0.5, 16.0).round(2)
    platelets = np.random.normal(210, 85, n_samples).clip(18, 550).round(1)
    mechanical_vent = np.random.choice([0, 1], n_samples, p=[0.58, 0.42])
    vasopressors = np.random.choice([0, 1], n_samples, p=[0.68, 0.32])

    # Calculated SOFA Score proxy
    sofa_score = (
        (creatinine > 2.0).astype(int) * 2 +
        (creatinine > 3.5).astype(int) * 2 +
        (map_score := (mean_arterial_pressure < 70).astype(int) + vasopressors * 2) +
        (gcs < 13).astype(int) * 2 + (gcs < 9).astype(int) * 2 +
        (platelets < 100).astype(int) * 2 +
        (lactate > 3.0).astype(int) * 2
    ).clip(0, 24)

    # Correlated clinical mortality risk equation (Log-odds based on ICU scoring systems)
    log_odds = (
        -4.2
        + 0.035 * (age - 60)
        + 0.022 * (heart_rate - 85)
        - 0.038 * (mean_arterial_pressure - 75)
        + 0.065 * (resp_rate - 20)
        - 0.080 * (spo2 - 95)
        - 0.220 * (gcs - 13)
        + 0.018 * (bun - 20)
        + 0.240 * (creatinine - 1.2)
        + 0.032 * (wbc - 11)
        + 0.380 * (lactate - 2.0)
        + 0.850 * mechanical_vent
        + 0.950 * vasopressors
        + 0.180 * sofa_score
    )

    prob = 1 / (1 + np.exp(-log_odds))
    in_hospital_mortality = np.random.binomial(1, prob)

    df = pd.DataFrame({
        'age': age,
        'gender': gender,
        'heart_rate': heart_rate,
        'mean_arterial_pressure': mean_arterial_pressure,
        'resp_rate': resp_rate,
        'spo2': spo2,
        'temperature': temperature,
        'gcs': gcs,
        'bun': bun,
        'creatinine': creatinine,
        'wbc': wbc,
        'glucose': glucose,
        'lactate': lactate,
        'platelets': platelets,
        'mechanical_ventilation': mechanical_vent,
        'vasopressors': vasopressors,
        'sofa_score': sofa_score,
        'in_hospital_mortality': in_hospital_mortality
    })

    print(f"Dataset generated. Mortality rate: {df['in_hospital_mortality'].mean():.2%}")
    return df

# -------------------------------------------------------------
# 2. MODEL TRAINING & COMPARISON
# -------------------------------------------------------------
def train_and_export_pipeline():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)

    df = generate_icu_dataset(n_samples=6000)
    csv_path = os.path.join(data_dir, 'icu_patient_dataset.csv')
    df.to_csv(csv_path, index=False)
    print(f"Saved dataset to: {csv_path}")

    X = df.drop(columns=['in_hospital_mortality'])
    y = df['in_hospital_mortality']

    feature_names = list(X.columns)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Models to benchmark
    models = {
        'Random Forest': RandomForestClassifier(
            n_estimators=150, max_depth=12, min_samples_split=4, random_state=42, n_jobs=-1
        ),
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42
        ),
        'Logistic Regression': LogisticRegression(
            max_iter=1000, random_state=42, C=0.5
        )
    }

    best_model_name = None
    best_auc = 0.0
    best_model = None
    benchmarks = {}

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, clf in models.items():
        print(f"\n--- Training {name} ---")
        clf.fit(X_train_scaled, y_train)

        y_prob = clf.predict_proba(X_test_scaled)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)

        auc = roc_auc_score(y_test, y_prob)
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)

        print(f"ROC-AUC: {auc:.4f} | Accuracy: {acc:.4f} | F1: {f1:.4f} | Recall: {rec:.4f}")

        benchmarks[name] = {
            'roc_auc': round(float(auc), 4),
            'accuracy': round(float(acc), 4),
            'precision': round(float(prec), 4),
            'recall': round(float(rec), 4),
            'f1_score': round(float(f1), 4)
        }

        if auc > best_auc:
            best_auc = auc
            best_model_name = name
            best_model = clf

    print(f"\n🏆 Best Model Selected: {best_model_name} (ROC-AUC: {best_auc:.4f})")

    # Evaluate best model thoroughly for frontend metadata
    y_test_prob = best_model.predict_proba(X_test_scaled)[:, 1]
    y_test_pred = (y_test_prob >= 0.5).astype(int)
    cm = confusion_matrix(y_test, y_test_pred)

    # Feature Importance
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
    else:
        importances = np.abs(best_model.coef_[0])

    importance_dict = {
        feature: round(float(imp), 4)
        for feature, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    }

    # Serialization
    model_path = os.path.join(data_dir, 'best_icu_model.joblib')
    scaler_path = os.path.join(data_dir, 'scaler.joblib')
    meta_path = os.path.join(data_dir, 'model_metadata.json')

    joblib.dump(best_model, model_path)
    joblib.dump(scaler, scaler_path)

    metadata = {
        'model_name': best_model_name,
        'test_roc_auc': round(float(best_auc), 4),
        'test_accuracy': round(float(accuracy_score(y_test, y_test_pred)), 4),
        'test_precision': round(float(precision_score(y_test, y_test_pred)), 4),
        'test_recall': round(float(recall_score(y_test, y_test_pred)), 4),
        'test_f1': round(float(f1_score(y_test, y_test_pred)), 4),
        'confusion_matrix': {
            'true_negatives': int(cm[0][0]),
            'false_positives': int(cm[0][1]),
            'false_negatives': int(cm[1][0]),
            'true_positives': int(cm[1][1])
        },
        'benchmarks': benchmarks,
        'feature_names': feature_names,
        'feature_importances': importance_dict,
        'total_trained_samples': len(X_train),
        'total_test_samples': len(X_test)
    }

    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print("\n✅ Model and Scaler successfully saved!")
    print(f"Artifacts ready in: {data_dir}")

if __name__ == '__main__':
    train_and_export_pipeline()
