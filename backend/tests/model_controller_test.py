import pytest
from fastapi.testclient import TestClient
from main import app
import logging

client = TestClient(app)

# Variables for the tests
project_name = "repo"
valid_url = f"https://github.com/example/{project_name}.git"
empty_url = ""
project_path = f"/dossier_host/{project_name}_project/{project_name}"

@pytest.mark.asyncio
async def test_model_creation_success(mocker):
    mocker.patch("services.training_model_service.create_model_service", return_value={"message": "AI model created successfully", "path": project_path})
    
    response = client.post("/model/create", json={"url": valid_url})
    
    logging.debug(f"Response status code: {response.status_code}")
    logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 200

# pytest -p no:cacheprovider --log-cli-level=DEBUG