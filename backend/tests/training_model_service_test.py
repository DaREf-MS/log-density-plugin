import pytest
from training_model_service import create_model_service
from unittest.mock import patch, MagicMock
import os
import subprocess
import asyncio

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

def test_create_model_service(mock_repo_clone_from, mock_subprocess_run, mock_os_makedirs):
    project_url = "https://github.com/some/repo.git"
    project_name = project_url.split('/')[-1].replace('.git', '')
    output_dir = os.path.join("/dossier_host", project_name + "_project")
    project_path = os.path.join(output_dir, project_name)

    mock_repo_clone_from.return_value = None
    mock_subprocess_run.return_value = None
    mock_os_makedirs.return_value = None

    async def run_test():
        response = await create_model_service(project_url)

        assert response["message"] == "AI model created successfully"
        assert response["path"] == project_path
        mock_os_makedirs.assert_called_once_with(output_dir, exist_ok=True)
        mock_repo_clone_from.assert_called_once_with(project_url, project_path)
        mock_subprocess_run.assert_any_call(f"preprocess_project {project_path}", shell=True, check=True)
        mock_subprocess_run.assert_any_call(f"python3 /app/training/LSTM_Log_Density_Model.py {project_path}", shell=True, check=True)

    asyncio.run(run_test())

@pytest.mark.asyncio
async def test_create_model_service_subprocess_error(mock_repo_clone_from, mock_subprocess_run, mock_os_makedirs):
    project_url = "https://github.com/some/repo.git"
    mock_repo_clone_from.return_value = None
    mock_subprocess_run.side_effect = subprocess.CalledProcessError(1, 'cmd')

    with pytest.raises(Exception) as exc_info:
        await create_model_service(project_url)

    assert exc_info.value.status_code == 500
    assert "Script execution failed" in str(exc_info.value)

@pytest.mark.asyncio
async def test_create_model_service_generic_error(mock_repo_clone_from, mock_subprocess_run, mock_os_makedirs):
    project_url = "https://github.com/some/repo.git"
    mock_repo_clone_from.return_value = None
    mock_subprocess_run.side_effect = Exception("Generic error")

    with pytest.raises(Exception) as exc_info:
        await create_model_service(project_url)

    assert exc_info.value.status_code == 500
    assert "An error occurred" in str(exc_info.value)
