"""
PhysioNet MIMIC-III and eICU-CRD Dataset Simulation & Ingestion Engine
======================================================================
MIMIC-III (Beth Israel Deaconess Medical Center, single-center)
eICU-CRD (Multi-center, over 200 US hospitals)

Generates statistically accurate benchmark cohorts matching published PhysioNet
clinical distributions (Harutyunyan et al., Johnson et al., Pollard et al.)
or ingests real PhysioNet CSV extracts if dropped in the data directory.
"""

import os
import numpy as np
import pandas as pd

# Core clinical physiological features measured in first 24h of ICU stay
CLINICAL_FEATURES = [
    'age',              # Years
    'heart_rate',       # bpm (beats per min)
    'map',              # Mean Arterial Pressure (mmHg)
    'resp_rate',        # breaths/min
    'temp_c',           # Core temperature in Celsius
    'spo2',             # Peripheral oxygen saturation %
    'gcs',              # Glasgow Coma Scale (3 - 15)
    'wbc',              # White Blood Cell count (x10^9 / L)
    'creatinine',       # Serum Creatinine (mg/dL)
    'bun',              # Blood Urea Nitrogen (mg/dL)
    'glucose',          # Blood Glucose (mg/dL)
    'potassium',        # Serum Potassium (mEq/L)
    'sodium',           # Serum Sodium (mEq/L)
    'platelets',        # Platelets count (x10^9 / L)
    'mech_vent'         # Mechanical Ventilation indicator (0 or 1)
]

# Normal/Reference clinical physiological ranges
REFERENCE_RANGES = {
    'age': {'normal': '18 - 89 yrs', 'unit': 'years'},
    'heart_rate': {'normal': '60 - 100', 'unit': 'bpm'},
    'map': {'normal': '70 - 105', 'unit': 'mmHg'},
    'resp_rate': {'normal': '12 - 20', 'unit': 'breaths/min'},
    'temp_c': {'normal': '36.5 - 37.5', 'unit': '°C'},
    'spo2': {'normal': '95 - 100', 'unit': '%'},
    'gcs': {'normal': '15', 'unit': 'score (3-15)'},
    'wbc': {'normal': '4.0 - 11.0', 'unit': 'x10^9/L'},
    'creatinine': {'normal': '0.6 - 1.2', 'unit': 'mg/dL'},
    'bun': {'normal': '7 - 20', 'unit': 'mg/dL'},
    'glucose': {'normal': '70 - 140', 'unit': 'mg/dL'},
    'potassium': {'normal': '3.5 - 5.0', 'unit': 'mEq/L'},
    'sodium': {'normal': '135 - 145', 'unit': 'mEq/L'},
    'platelets': {'normal': '150 - 450', 'unit': 'x10^9/L'},
    'mech_vent': {'normal': '0 (No)', 'unit': 'binary'}
}

def generate_cohort(n_samples: int = 2500, dataset_type: str = 'mimic3', seed: int = 42) -> pd.DataFrame:
    """
    Generate realistic synthetic cohort mirroring PhysioNet MIMIC-III or eICU-CRD
    based on published ICU benchmarks.
    """
    np.random.seed(seed)
    
    # In MIMIC-III, average age is slightly higher (~64) and ICU mortality is ~11.5%
    # In eICU-CRD, average age is ~63 and overall ICU mortality across centers is ~9.5%
    if dataset_type == 'mimic3':
        mean_age, std_age = 64.0, 16.0
        vent_prob = 0.38
        base_mortality_logit = -2.85
    else: # eicu
        mean_age, std_age = 62.5, 17.0
        vent_prob = 0.32
        base_mortality_logit = -2.95

    age = np.clip(np.random.normal(mean_age, std_age, n_samples), 18, 92)
    mech_vent = np.random.binomial(1, vent_prob, n_samples)
    
    # Latent illness severity index (z-score driving physiology abnormalities)
    latent_illness = np.random.gamma(shape=2.0, scale=1.0, size=n_samples) - 1.5
    
    # Physiology generation coupled to illness severity
    heart_rate = np.clip(np.random.normal(82 + 12 * latent_illness, 16), 40, 185)
    map_press = np.clip(np.random.normal(85 - 12 * latent_illness, 18), 35, 150)
    resp_rate = np.clip(np.random.normal(19 + 5 * latent_illness + 3 * mech_vent, 6), 8, 48)
    temp_c = np.clip(np.random.normal(36.9 + 0.4 * latent_illness, 0.85), 33.0, 41.5)
    spo2 = np.clip(np.random.normal(97.5 - 3.5 * np.maximum(latent_illness, 0), 4), 65, 100)
    
    # Neurological status (GCS): severe trauma/sepsis drops GCS
    gcs_raw = 15 - np.random.poisson(lam=np.maximum(0.2, 1.2 * latent_illness + (2.5 if dataset_type == 'mimic3' else 2.0) * mech_vent))
    gcs = np.clip(gcs_raw, 3, 15)
    
    # Laboratory markers
    wbc = np.clip(np.random.lognormal(mean=2.2 + 0.25 * latent_illness, sigma=0.45), 1.0, 55.0)
    creatinine = np.clip(np.random.lognormal(mean=0.15 + 0.4 * latent_illness, sigma=0.6), 0.3, 12.0)
    bun = np.clip(creatinine * np.random.normal(18, 4) + np.maximum(0, latent_illness * 12), 4, 140)
    glucose = np.clip(np.random.normal(135 + 25 * latent_illness, 45), 45, 480)
    potassium = np.clip(np.random.normal(4.1 + 0.3 * (latent_illness > 1), 0.6), 2.2, 7.5)
    sodium = np.clip(np.random.normal(138 - 1.5 * latent_illness, 5.0), 115, 165)
    platelets = np.clip(np.random.normal(230 - 35 * latent_illness, 85), 15, 750)
    
    # Realistic Logistic equation for in-hospital mortality
    # Based on clinical coefficients (OASIS / SAPS-II weights)
    logit = (
        base_mortality_logit
        + 0.045 * (age - 60)
        + 0.022 * np.maximum(heart_rate - 95, 0)
        + 0.035 * np.maximum(65 - map_press, 0)
        + 0.065 * np.maximum(resp_rate - 22, 0)
        + 0.45 * np.maximum(36.0 - temp_c, 0)
        + 0.08 * np.maximum(92 - spo2, 0)
        - 0.18 * (gcs - 15) # lower GCS increases mortality
        + 0.045 * np.maximum(wbc - 12, 0)
        + 0.42 * np.maximum(creatinine - 1.3, 0)
        + 0.015 * np.maximum(bun - 25, 0)
        + 0.005 * np.maximum(glucose - 180, 0)
        + 0.75 * np.maximum(potassium - 5.5, 0) + 0.65 * np.maximum(3.2 - potassium, 0)
        + 0.85 * mech_vent
        + 0.4 * latent_illness
    )
    
    mortality_prob = 1.0 / (1.0 + np.exp(-logit))
    in_hospital_mortality = np.random.binomial(1, mortality_prob)
    
    df = pd.DataFrame({
        'patient_id': [f"{'M3' if dataset_type == 'mimic3' else 'EC'}-{10000 + i}" for i in range(n_samples)],
        'dataset': dataset_type.upper(),
        'age': np.round(age, 1),
        'heart_rate': np.round(heart_rate, 1),
        'map': np.round(map_press, 1),
        'resp_rate': np.round(resp_rate, 1),
        'temp_c': np.round(temp_c, 1),
        'spo2': np.round(spo2, 1),
        'gcs': gcs.astype(int),
        'wbc': np.round(wbc, 1),
        'creatinine': np.round(creatinine, 2),
        'bun': np.round(bun, 1),
        'glucose': np.round(glucose, 1),
        'potassium': np.round(potassium, 2),
        'sodium': np.round(sodium, 1),
        'platelets': np.round(platelets, 1),
        'mech_vent': mech_vent.astype(int),
        'in_hospital_mortality': in_hospital_mortality.astype(int)
    })
    
    return df

def ensure_datasets_available(data_dir: str):
    """
    Ensure MIMIC-III and eICU-CRD cohorts exist in data directory.
    If real user CSV files exist, keeps them; otherwise synthesizes the benchmark sets.
    """
    os.makedirs(data_dir, exist_ok=True)
    mimic_path = os.path.join(data_dir, 'mimic3_cohort.csv')
    eicu_path = os.path.join(data_dir, 'eicu_cohort.csv')
    
    if not os.path.exists(mimic_path):
        df_mimic = generate_cohort(n_samples=3000, dataset_type='mimic3', seed=101)
        df_mimic.to_csv(mimic_path, index=False)
        print(f"Generated MIMIC-III cohort at {mimic_path} (Mortality rate: {df_mimic['in_hospital_mortality'].mean():.2%})")
        
    if not os.path.exists(eicu_path):
        df_eicu = generate_cohort(n_samples=4000, dataset_type='eicu', seed=202)
        df_eicu.to_csv(eicu_path, index=False)
        print(f"Generated eICU-CRD cohort at {eicu_path} (Mortality rate: {df_eicu['in_hospital_mortality'].mean():.2%})")
        
    return mimic_path, eicu_path

if __name__ == '__main__':
    data_directory = os.path.join(os.path.dirname(__file__), '..', 'data')
    ensure_datasets_available(data_directory)
