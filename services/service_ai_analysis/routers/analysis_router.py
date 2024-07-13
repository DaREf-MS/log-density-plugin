from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/test")
async def create_model_req():
    return { "message": "test" }