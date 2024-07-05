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
    # Mock that the repo does not already exists, then prevent cloning it and creating an AI model
    mocker.patch("os.path.exists", return_value=False)
    mocker.patch("git.Repo.clone_from")
    mocker.patch("subprocess.run")

    response = client.post("/model/create", json={"url": valid_url})
    
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 200
    assert response.json().get("message") == "AI model created successfully"

@pytest.mark.asyncio
async def test_repository_already_exists(mocker):
    # Mock that the repo was already cloned and exists locally
    mocker.patch("os.path.exists", return_value=True)

    response = client.post("/model/create", json={"url": valid_url})
    
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 200
    assert response.json().get("message") == "Repository already exists"

@pytest.mark.asyncio
async def test_empty_url(mocker):
    response = client.post("/model/create", json={"url": empty_url})
    
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "Value error, The URL to the GitHub repository must not be empty."

@pytest.mark.asyncio
async def test_missing_url_field(mocker):
    response = client.post("/model/create", json={})
    
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "Field required"