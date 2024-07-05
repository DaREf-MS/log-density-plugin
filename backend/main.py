from fastapi import FastAPI
from controllers import model_controller

app = FastAPI()
app.include_router(model_controller.router)