from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import sys
import os

from model import predictor

app = FastAPI(
    title="QuizCraft AI - ML Student Performance Prediction Microservice",
    description="Trained XGBoost / scikit-learn regression pipeline for predicting student future assessment scores, mastery levels, and error trends.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentPredictionInput(BaseModel):
    avg_past_score: float = Field(..., ge=0, le=100, description="Student cumulative average score across previous quizzes")
    recent_score: float = Field(..., ge=0, le=100, description="Score on the most recent quiz attempt")
    attempts_count: int = Field(..., ge=1, le=100, description="Total number of completed quiz attempts")
    topic_accuracy_avg: float = Field(..., ge=0, le=100, description="Average accuracy across all assessed topics")
    incorrect_rate: float = Field(..., ge=0.0, le=1.0, description="Proportion of answered questions that were incorrect")
    time_per_question: float = Field(..., ge=5, le=300, description="Average seconds spent per question")
    difficulty_level: int = Field(default=2, ge=1, le=3, description="1=Easy, 2=Medium, 3=Hard")
    score_trend: float = Field(default=0.0, description="Score trajectory slope between recent and early attempts")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "QuizCraft AI ML Prediction Engine",
        "pythonVersion": sys.version,
        "modelLoaded": True,
        "modelName": predictor.model_name,
        "version": predictor.version,
    }

@app.get("/model-info")
def get_model_info():
    return {
        "modelName": predictor.model_name,
        "modelVersion": predictor.version,
        "featureColumns": predictor.feature_names,
        "datasetInfo": predictor.metrics.get("datasetInfo", {}),
        "limitations": predictor.metrics.get("limitations", []),
        "featureImportances": predictor.metrics.get("featureImportances", {}),
    }

@app.get("/metrics")
def get_metrics():
    return {
        "modelVersion": predictor.version,
        "bestModel": predictor.model_name,
        "modelsComparison": predictor.metrics.get("evaluationComparison", {}),
    }

@app.post("/predict")
def predict_performance(data: StudentPredictionInput):
    try:
        features = data.model_dump()
        result = predictor.predict(features)
        return {
            "success": True,
            "prediction": result,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
