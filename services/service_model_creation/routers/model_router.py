from fastapi import APIRouter, HTTPException
from service_model_creation.models.java_project import JavaProject
from service_model_creation.services.model_service import create_model

router = APIRouter()

@router.post("/create")
async def create_model_req(project: JavaProject):
    return await create_model(project.url)