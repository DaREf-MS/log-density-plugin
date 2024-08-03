from fastapi import APIRouter, HTTPException
from models.project_file import ProjectFile
from services.analysis_service import predict, analyze_project
from models.project_analysis import ProjectAnalysis

router = APIRouter()

@router.post("/predict")
async def predict_req(project: ProjectFile):
    var = await predict(project.url, project.fileContent)
    return var

@router.post("/analyzeProject")
async def analyze_project_req(analysis: ProjectAnalysis):
    print(analysis.gitUrl)
    print(analysis.files)

    results = await analyze_project(analysis.gitUrl, analysis.files)
    return results