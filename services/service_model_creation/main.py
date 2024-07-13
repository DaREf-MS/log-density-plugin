from fastapi import FastAPI
from service_model_creation.routers import model_router

app = FastAPI()
app.include_router(model_router.router)