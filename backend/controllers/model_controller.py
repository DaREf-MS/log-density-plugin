from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator, ValidationError
from services.training_model_service import create_model_service

router = APIRouter()

# Class to define body fields for POST requests
class JavaProject(BaseModel):
    url: str

    # Validate if field url is empty or not
    @field_validator('url')
    def check_url(cls, value):
        if not value.strip():
            raise ValueError('The URL to the GitHub repository must not be empty.')
        return value

@router.post("/model/create")
async def create_model(project: JavaProject):
    try:
        return await create_model_service(project.url)
    except ValidationError as e:
        raise HTTPException(status_code = 400, detail = e.errors())