import os
import json
import joblib
import numpy as np
import pandas as pd

class StudentPerformancePredictor:
    def __init__(self):
        curr_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(curr_dir, "model.joblib")
        self.metrics_path = os.path.join(curr_dir, "metrics.json")
        
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at {self.model_path}. Run train.py first.")
            
        bundle = joblib.load(self.model_path)
        self.model = bundle["model"]
        self.feature_names = bundle["feature_names"]
        self.model_name = bundle.get("model_name", "XGBoost")
        self.version = bundle.get("version", "1.0.0")
        
        with open(self.metrics_path, "r", encoding="utf-8") as f:
            self.metrics = json.load(f)

    def predict(self, feature_dict):
        # Validate that all required features exist
        row = {}
        for col in self.feature_names:
            if col not in feature_dict:
                raise ValueError(f"Missing required feature: {col}")
            row[col] = float(feature_dict[col])
            
        df_input = pd.DataFrame([row])[self.feature_names]
        raw_pred = float(self.model.predict(df_input)[0])
        clamped_score = float(np.clip(raw_pred, 0, 100))
        
        # Determine readiness tier
        if clamped_score >= 85:
            tier = "Advanced Mastery"
            tier_desc = "Student demonstrates comprehensive conceptual mastery and high exam readiness."
        elif clamped_score >= 70:
            tier = "Proficient (Exam Ready)"
            tier_desc = "Solid grasp of foundational and intermediate concepts. Minor topic polish recommended."
        elif clamped_score >= 55:
            tier = "Developing (Needs Revision)"
            tier_desc = "Moderate accuracy with noticeable gaps in specific weak topics. Targeted revision required."
        else:
            tier = "Foundational (At Risk)"
            tier_desc = "Significant conceptual deficits detected. Immediate step-by-step revision strongly advised."
            
        rmse = self.metrics.get("evaluationComparison", {}).get(self.model_name, {}).get("RMSE", 6.97)
        lower_bound = max(0.0, round(clamped_score - rmse, 1))
        upper_bound = min(100.0, round(clamped_score + rmse, 1))

        return {
            "predictedScore": round(clamped_score, 1),
            "expectedRange": {
                "lowerBound": lower_bound,
                "upperBound": upper_bound,
                "marginOfError": round(rmse, 1),
            },
            "readinessTier": tier,
            "readinessDescription": tier_desc,
            "modelVersion": self.version,
            "modelName": self.model_name,
            "evaluationMetrics": self.metrics.get("evaluationComparison", {}).get(self.model_name, {}),
            "featureImportances": self.metrics.get("featureImportances", {}),
            "limitations": self.metrics.get("limitations", []),
        }

predictor = StudentPerformancePredictor()
