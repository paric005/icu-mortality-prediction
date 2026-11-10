"""
Pre-defined clinical ICU patient profiles for instant testing and demonstration
"""

SAMPLE_PATIENTS = [
    {
        'id': 'SEPTIC-72',
        'name': 'Patient A - Severe Sepsis & AKI',
        'description': '72yo male admitted with septic shock secondary to pneumonia, acute kidney injury, and respiratory compromise.',
        'clinical_data': {
            'age': 72,
            'heart_rate': 122,
            'map': 58,
            'resp_rate': 29,
            'temp_c': 38.8,
            'spo2': 91,
            'gcs': 11,
            'wbc': 22.4,
            'creatinine': 3.1,
            'bun': 62,
            'glucose': 210,
            'potassium': 5.4,
            'sodium': 133,
            'platelets': 95,
            'mech_vent': 1
        }
    },
    {
        'id': 'POSTOP-61',
        'name': 'Patient B - Post-Op Cardiac Recovery',
        'description': '61yo female post elective coronary artery bypass graft (CABG), hemodynamically stable, extubated on room air.',
        'clinical_data': {
            'age': 61,
            'heart_rate': 78,
            'map': 86,
            'resp_rate': 15,
            'temp_c': 36.8,
            'spo2': 98,
            'gcs': 15,
            'wbc': 7.8,
            'creatinine': 0.85,
            'bun': 14,
            'glucose': 115,
            'potassium': 4.1,
            'sodium': 139,
            'platelets': 245,
            'mech_vent': 0
        }
    },
    {
        'id': 'DKA-45',
        'name': 'Patient C - Diabetic Ketoacidosis',
        'description': '45yo male presenting with severe DKA, Kussmaul respirations, moderate dehydration, electrolyte derangements.',
        'clinical_data': {
            'age': 45,
            'heart_rate': 112,
            'map': 75,
            'resp_rate': 26,
            'temp_c': 37.2,
            'spo2': 97,
            'gcs': 14,
            'wbc': 15.6,
            'creatinine': 1.6,
            'bun': 34,
            'glucose': 415,
            'potassium': 5.7,
            'sodium': 131,
            'platelets': 280,
            'mech_vent': 0
        }
    },
    {
        'id': 'NEURO-38',
        'name': 'Patient D - Severe Traumatic Brain Injury',
        'description': '38yo female motor vehicle collision with subdural hematoma, intubated, comatose, therapeutic hypothermia.',
        'clinical_data': {
            'age': 38,
            'heart_rate': 118,
            'map': 63,
            'resp_rate': 24,
            'temp_c': 35.6,
            'spo2': 93,
            'gcs': 5,
            'wbc': 16.8,
            'creatinine': 1.4,
            'bun': 28,
            'glucose': 175,
            'potassium': 4.3,
            'sodium': 144,
            'platelets': 120,
            'mech_vent': 1
        }
    }
]
