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
    logging.info(f"Received project URL: {project_url.url}")  # pour log que l'url a été reçu par le backend (juste poru tester)
    try:
        # Attempt to process the URL through the service
        response = await create_model_service(project_url.url)
        return response
    except Exception as e:
        # Log any exceptions that occur during the processing
        logging.error(f"Error processing URL {project_url.url}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
