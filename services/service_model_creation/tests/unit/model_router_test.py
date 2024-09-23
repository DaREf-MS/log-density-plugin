import pytest
from fastapi.testclient import TestClient
from service_model_creation.main import app
import logging

client = TestClient(app)

# Variables for the tests
project_name = "repo"
valid_url = f"https://github.com/example/{project_name}.git"
empty_url = ""
project_path = f"/dossier_host/{project_name}_project/{project_name}"

# Mock functions
@pytest.fixture
def mock_os_makedirs(mocker):
    return mocker.patch("os.makedirs")

@pytest.fixture
def mock_os_path(mocker):
    return mocker.patch("os.path.exists")

@pytest.fixture
def mock_git_clone(mocker):
    return mocker.patch("git.Repo.clone_from")

@pytest.fixture
def mock_subprocess(mocker):
    return mocker.patch("subprocess.run")

@pytest.mark.asyncio
async def test_create_model_success(mock_os_makedirs, mock_os_path, mock_git_clone, mock_subprocess):
    # Mock that the repo does not already exists, then prevent cloning it and creating an AI model
    mock_os_makedirs.return_value = None
    mock_os_path.return_value = False
    mock_git_clone.return_value = None
    mock_subprocess.return_value = None

    response = client.post("/create", json = {"url": valid_url})
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 200
    assert response.json().get("message") == "AI model created successfully"

@pytest.mark.asyncio
async def test_repo_already_exists(mock_os_makedirs, mock_os_path):
    # Mock that the repo was already cloned and exists locally
    mock_os_makedirs.return_value = None
    mock_os_path.return_value = True

    response = client.post("/create", json = {"url": valid_url})
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 200
    assert response.json().get("message") == "Repository already exists"

@pytest.mark.asyncio
async def test_empty_url():
    response = client.post("/create", json = {"url": empty_url})
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "Value error, The URL to the GitHub repository must not be empty."

@pytest.mark.asyncio
async def test_missing_url_field():
    response = client.post("/create", json = {})
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "Field required"