from fastapi import APIRouter, HTTPException
from models.java_project import JavaProject
from services.model_service import create_model

router = APIRouter()

@router.post("/create")
async def create_model_req(project: JavaProject):
    return await create_model(project.url)