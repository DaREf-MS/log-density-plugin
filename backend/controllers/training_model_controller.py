from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sys
sys.path.append("/app/services")
from training_model_service import create_model_service

class ProjectUrl(BaseModel):
    url: str

app = FastAPI()

@app.post("/create")
async def create_model(project_url: ProjectUrl):
    return await create_model_service(project_url.url)
