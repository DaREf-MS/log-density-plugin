import pytest
from fastapi.testclient import TestClient
from main import app
import subprocess
import logging

client = TestClient(app)

# Variables for the tests
valid_url = "https://github.com/example/repo.git"
empty_url = ""

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
    mock_os_makedirs.return_value = None
    mock_os_path.return_value = False
    mock_git_clone.return_value = None
    mock_subprocess.return_value = None

    response = client.post("/model/create", json = {"url": valid_url})
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 200
    assert response.json()["message"] == "AI model created successfully"
    mock_os_makedirs.assert_called_once()
    mock_git_clone.assert_called_once()
    mock_subprocess.call_count == 2

@pytest.mark.asyncio
async def test_repo_already_exists(mock_os_makedirs, mock_os_path, mock_git_clone, mock_subprocess):
    mock_os_makedirs.return_value = None
    mock_os_path.return_value = True

    response = client.post("/model/create", json = {"url": valid_url})
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 200
    assert response.json().get("message") == "Repository already exists"
    mock_os_makedirs.assert_called_once()
    mock_git_clone.assert_not_called()
    mock_subprocess.assert_not_called()

@pytest.mark.asyncio
async def test_empty_url(mock_git_clone, mock_subprocess):
    response = client.post("/model/create", json = {"url": empty_url})
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "Value error, The URL to the GitHub repository must not be empty."
    mock_git_clone.assert_not_called()
    mock_subprocess.assert_not_called()

@pytest.mark.asyncio
async def test_missing_url_field(mock_git_clone, mock_subprocess):
    response = client.post("/model/create", json = {})
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "Field required"
    mock_git_clone.assert_not_called()
    mock_subprocess.assert_not_called()

@pytest.mark.asyncio
async def test_create_model_script_execution_failure(mock_os_makedirs, mock_os_path, mock_git_clone, mock_subprocess):
    mock_os_makedirs.return_value = None
    mock_os_path.return_value = False
    mock_git_clone.return_value = None
    mock_subprocess.side_effect = subprocess.CalledProcessError(returncode = 1, cmd = "")

    response = client.post("/model/create", json = {"url": valid_url})
    # logging.debug(f"Script execution error: {e}")

    assert response.status_code == 500
    assert "Script execution failed" in response.json()["detail"]
    mock_os_makedirs.assert_called_once()
    mock_git_clone.assert_called_once()
    mock_subprocess.assert_called()

@pytest.mark.asyncio
async def test_create_model_script_exception(mock_os_makedirs, mock_os_path, mock_git_clone, mock_subprocess):
    mock_os_makedirs.return_value = None
    mock_os_path.return_value = False
    mock_git_clone.return_value = None
    mock_subprocess.side_effect = Exception("Generic error")

    response = client.post("/model/create", json = {"url": valid_url})
    # logging.debug(f"Generic error: {e}")

    assert response.status_code == 500
    assert "An error occurred" in response.json()["detail"]
    mock_os_makedirs.assert_called_once()
    mock_git_clone.assert_called_once()
    mock_subprocess.assert_called()