from fastapi import FastAPI
from controllers import training_model_controller

app = FastAPI()
app.include_router(training_model_controller.router)