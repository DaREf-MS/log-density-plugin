from fastapi import APIRouter, HTTPException
from service_ai_analysis.models.project_analysis import ProjectAnalysis
from service_ai_analysis.models.project_file import ProjectFile
from service_ai_analysis.services.analysis_service import predict_file_densities, analyze_project

router = APIRouter()


@router.post("/predict")
async def predict_req(project: ProjectFile):
    var = await predict_file_densities(project.url, project.fileContent)
    return var


@router.post("/analyzeProject")
async def analyze_project_req(analysis: ProjectAnalysis):
    results = await analyze_project(analysis.gitUrl, analysis.files)
    return results