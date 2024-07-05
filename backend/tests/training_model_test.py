import pytest
from fastapi.testclient import TestClient
from ..main import app
from unittest.mock import patch
import subprocess
import asyncio

client = TestClient(app)

@pytest.fixture
def mock_repo_clone_from():
    with patch('training_model_service.Repo.clone_from') as mock:
        yield mock

@pytest.fixture
def mock_subprocess_run():
    with patch('training_model_service.subprocess.run') as mock:
        yield mock

@pytest.fixture
def mock_os_makedirs():
    with patch('training_model_service.os.makedirs') as mock:
        yield mock

@pytest.mark.asyncio
async def test_create_model_success(mock_repo_clone_from, mock_subprocess_run, mock_os_makedirs):
    project_url = {"url": "https://github.com/some/repo.git"}
    mock_repo_clone_from.return_value = None
    mock_subprocess_run.return_value = None
    mock_os_makedirs.return_value = None

    response = client.post("/create", json=project_url)

    assert response.status_code == 200
    assert response.json()["message"] == "AI model created successfully"
    mock_os_makedirs.assert_called_once()
    mock_repo_clone_from.assert_called_once()
    mock_subprocess_run.assert_any_call(f"preprocess_project /dossier_host/repo_project/repo", shell=True, check=True)
    mock_subprocess_run.assert_any_call(f"python3 /app/training/LSTM_Log_Density_Model.py /dossier_host/repo_project/repo", shell=True, check=True)

@pytest.mark.asyncio
async def test_create_model_subprocess_error(mock_repo_clone_from, mock_subprocess_run, mock_os_makedirs):
    project_url = {"url": "https://github.com/some/repo.git"}
    mock_repo_clone_from.return_value = None
    mock_subprocess_run.side_effect = subprocess.CalledProcessError(1, 'cmd')
    mock_os_makedirs.return_value = None

    response = client.post("/create", json=project_url)

    assert response.status_code == 500
    assert "Script execution failed" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_model_generic_error(mock_repo_clone_from, mock_subprocess_run, mock_os_makedirs):
    project_url = {"url": "https://github.com/some/repo.git"}
    mock_repo_clone_from.return_value = None
    mock_subprocess_run.side_effect = Exception("Generic error")
    mock_os_makedirs.return_value = None

    response = client.post("/create", json=project_url)

    assert response.status_code == 500
    assert "An error occurred" in response.json()["detail"]
