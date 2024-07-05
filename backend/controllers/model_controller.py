from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from services.model_service import create_model

router = APIRouter()

# Class to define body fields for POST requests
class JavaProject(BaseModel):
    url: str

    # Validate if field url is empty or not
    @field_validator('url')
    def check_url(cls, value):
        if not value.strip():
            # Status code 422 with relevant message
            raise ValueError('The URL to the GitHub repository must not be empty.')
        return value

@router.post("/model/create")
async def create_model_req(project: JavaProject):
    return await create_model(project.url)