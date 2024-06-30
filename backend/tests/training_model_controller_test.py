from fastapi.testclient import TestClient
import sys
sys.path.append("/app/controllers")
from training_model_controller import app

client = TestClient(app)

def test_create_model(mocker):
    project_url = {"url": "https://github.com/some/repo.git"}
    mocker.patch('training_model_controller.create_model_service', return_value={"message": "AI model created successfully"})

    response = client.post("/create", json=project_url)
    assert response.status_code == 200
    assert response.json() == {"message": "AI model created successfully"}