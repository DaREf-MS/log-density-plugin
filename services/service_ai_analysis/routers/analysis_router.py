from fastapi import APIRouter, HTTPException
from service_ai_analysis.models.project_file import ProjectFile
from service_ai_analysis.services.analysis_service import predict_file_densities

router = APIRouter()

@router.post("/predict")
async def predict_req(project: ProjectFile):
    var = await predict_file_densities(project.url, project.fileContent)
    return var
