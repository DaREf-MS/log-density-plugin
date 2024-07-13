from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.post("/predict")
async def predict_req(project: ProjectFile):
    var = await predict(project.url, project.filepath)
    print("voici le var:       ",var)
    return var
