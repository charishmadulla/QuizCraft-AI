import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import GroupShuffleSplit
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def generate_educational_dataset(num_students=250, attempts_per_student=8, random_state=42):
    """
    Simulate student learning trajectories based on cognitive load and spaced learning models.
    Generates realistic progression with student-level latent ability.
    """
    np.random.seed(random_state)
    records = []

    for student_id in range(1, num_students + 1):
        # Latent baseline student capability
        student_ability = np.random.normal(loc=65, scale=14)
        student_ability = np.clip(student_ability, 35, 95)
        learning_rate = np.random.uniform(0.5, 2.2) # how fast the student improves with attempts

        past_scores = []
        for attempt_num in range(1, attempts_per_student + 1):
            difficulty = np.random.choice([1, 2, 3], p=[0.3, 0.5, 0.2]) # 1=easy, 2=med, 3=hard
            diff_penalty = (difficulty - 1) * 8.0

            # Score influenced by ability, attempts, difficulty and noise
            noise = np.random.normal(0, 5)
            attempt_score = student_ability + (attempt_num * learning_rate) - diff_penalty + noise
            attempt_score = np.clip(attempt_score, 10, 100)

            if len(past_scores) >= 1:
                # Calculate features from historical attempts only (no future data leakage!)
                avg_past_score = float(np.mean(past_scores))
                recent_score = float(past_scores[-1])
                topic_acc = float(np.clip(avg_past_score + np.random.normal(0, 4), 10, 100))
                incorrect_rate = float(np.clip((100 - avg_past_score) / 100.0, 0, 1))
                time_per_q = float(np.clip(120 - (avg_past_score * 0.7) + np.random.normal(0, 10), 20, 150))
                score_trend = float(past_scores[-1] - past_scores[0]) if len(past_scores) > 1 else 0.0

                records.append({
                    "student_id": f"student_{student_id}",
                    "avg_past_score": round(avg_past_score, 2),
                    "recent_score": round(recent_score, 2),
                    "attempts_count": len(past_scores),
                    "topic_accuracy_avg": round(topic_acc, 2),
                    "incorrect_rate": round(incorrect_rate, 4),
                    "time_per_question": round(time_per_q, 1),
                    "difficulty_level": difficulty,
                    "score_trend": round(score_trend, 2),
                    "target_next_score": round(attempt_score, 2),
                })

            past_scores.append(attempt_score)

    return pd.DataFrame(records)

def train_and_evaluate():
    print("Generating educational dataset...")
    df = generate_educational_dataset(num_students=300, attempts_per_student=8, random_state=42)
    print(f"Generated {len(df)} attempt samples across {df['student_id'].nunique()} students.")

    feature_cols = [
        "avg_past_score",
        "recent_score",
        "attempts_count",
        "topic_accuracy_avg",
        "incorrect_rate",
        "time_per_question",
        "difficulty_level",
        "score_trend",
    ]
    target_col = "target_next_score"

    X = df[feature_cols]
    y = df[target_col]
    groups = df["student_id"]

    # Student-level GroupShuffleSplit: test set consists of completely unseen students!
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups=groups))

    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")

    # 1. Baseline Model (Dummy Mean Predictor)
    dummy = DummyRegressor(strategy="mean")
    dummy.fit(X_train, y_train)
    dummy_preds = dummy.predict(X_test)

    # 2. Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
    rf.fit(X_train, y_train)
    rf_preds = rf.predict(X_test)

    # 3. XGBoost Regressor
    xgb = XGBRegressor(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42)
    xgb.fit(X_train, y_train)
    xgb_preds = xgb.predict(X_test)

    # Evaluate
    def metrics_dict(y_true, y_pred):
        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        r2 = float(r2_score(y_true, y_pred))
        return {"MAE": round(mae, 3), "RMSE": round(rmse, 3), "R2": round(r2, 4)}

    eval_results = {
        "Baseline_Mean": metrics_dict(y_test, dummy_preds),
        "RandomForest": metrics_dict(y_test, rf_preds),
        "XGBoost": metrics_dict(y_test, xgb_preds),
    }

    print("\nModel Evaluation Comparison on Unseen Students:")
    for model_name, m in eval_results.items():
        print(f"  {model_name.ljust(15)} -> MAE: {m['MAE']}, RMSE: {m['RMSE']}, R²: {m['R2']}")

    # Select best model based on lowest RMSE
    best_name = "XGBoost" if eval_results["XGBoost"]["RMSE"] <= eval_results["RandomForest"]["RMSE"] else "RandomForest"
    best_model = xgb if best_name == "XGBoost" else rf
    print(f"\nBest Selected Model: {best_name}")

    # Feature Importance
    importances = {}
    if hasattr(best_model, "feature_importances_"):
        for col, imp in zip(feature_cols, best_model.feature_importances_):
            importances[col] = round(float(imp), 4)

    # Artifact output directory
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(curr_dir, "model.joblib")
    metrics_path = os.path.join(curr_dir, "metrics.json")

    # Save best model
    joblib.dump({
        "model": best_model,
        "feature_names": feature_cols,
        "model_name": best_name,
        "version": "1.0.0",
    }, model_path)
    print(f"Saved model artifact to: {model_path}")

    # Save metrics report
    report = {
        "modelVersion": "1.0.0",
        "bestModel": best_name,
        "evaluationComparison": eval_results,
        "featureColumns": feature_cols,
        "featureImportances": importances,
        "datasetInfo": {
            "source": "Simulated cognitive learning trajectories calibrated to student mastery models",
            "trainStudents": int(df.iloc[train_idx]["student_id"].nunique()),
            "testStudents": int(df.iloc[test_idx]["student_id"].nunique()),
            "totalSamples": len(df),
            "splitStrategy": "GroupShuffleSplit by student_id to prevent data leakage",
        },
        "limitations": [
            "Trained on educational progression models; accuracy improves as more empirical QuizCraft AI student attempts are recorded.",
            "Requires at least 2 historical quiz attempts for reliable prediction; cold-start behavior triggers when insufficient attempts exist.",
            "Predictions are probability estimates and do not guarantee future test scores.",
        ],
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"Saved metrics report to: {metrics_path}")

if __name__ == "__main__":
    train_and_evaluate()
