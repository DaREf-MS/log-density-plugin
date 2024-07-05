from fastapi import APIRouter
from pydantic import BaseModel
from services.training_model_service import create_model_service

router = APIRouter()

class JavaProject(BaseModel):
    url: str

@router.post("/create")
async def create_model(project: JavaProject):
    return await create_model_service(project.url)