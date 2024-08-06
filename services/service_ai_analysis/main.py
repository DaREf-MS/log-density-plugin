from fastapi import FastAPI
from service_ai_analysis.routers import analysis_router

app = FastAPI()
app.include_router(analysis_router.router)