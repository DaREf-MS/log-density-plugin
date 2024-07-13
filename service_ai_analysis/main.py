from fastapi import FastAPI
from routers import analysis_router

app = FastAPI()
app.include_router(analysis_router.router)

@app.get("/")
async def create_model_req():
    return {"msg": "Hello world!"}