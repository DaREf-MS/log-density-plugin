from fastapi import FastAPI
from service_log_improvement.routers import analysis_router
from service_log_improvement.rest.ollama_client import pull_model

app = FastAPI()
app.include_router(analysis_router.router)

pull_model("llama3.2:3b")