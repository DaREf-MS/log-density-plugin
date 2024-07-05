import pytest
from services.model_service import create_model
import subprocess
from fastapi import HTTPException

# Variables for the tests
valid_url = "https://github.com/example/repo.git"

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
    # Mock that the repo does not already exists, prevent cloning it and prevent creating an AI model
    mock_os_makedirs.return_value = None
    mock_os_path.return_value = False
    mock_git_clone.return_value = None
    mock_subprocess.return_value = None

    response = await create_model(valid_url)
    # logging.debug(f"Response JSON: {response}")

    assert response["message"] == "AI model created successfully"
    assert "path" in response

@pytest.mark.asyncio
async def test_repo_already_exists(mock_os_makedirs, mock_os_path):
    # Mock that the repo already exists
    mock_os_makedirs.return_value = None
    mock_os_path.return_value = True

    response = await create_model(valid_url)
    # logging.debug(f"Response JSON: {response}")

    assert response["message"] == "Repository already exists"
    assert "path" in response

@pytest.mark.asyncio
async def test_create_model_script_execution_failure(mock_os_makedirs, mock_os_path, mock_git_clone, mock_subprocess):
    # Mock that the repo does not already exists, prevent cloning it and cause an error when running a script
    mock_os_makedirs.return_value = None
    mock_os_path.return_value = False
    mock_git_clone.return_value = None
    mock_subprocess.side_effect = subprocess.CalledProcessError(returncode = 1, cmd = "")
    
    with pytest.raises(HTTPException) as e:
        await create_model(valid_url)
    # logging.debug(f"Script execution error: {e}")
    
    assert e.value.status_code == 500
    assert "Script execution failed" in e.value.detail

@pytest.mark.asyncio
async def test_create_model_script_exception(mock_os_makedirs, mock_os_path, mock_git_clone, mock_subprocess):
    # Mock that the repo does not already exists, prevent cloning it and cause a generic error
    mock_os_makedirs.return_value = None
    mock_os_path.return_value = False
    mock_git_clone.return_value = None
    mock_subprocess.side_effect = Exception("Generic error")

    with pytest.raises(HTTPException) as e:
        await create_model(valid_url)
    # logging.debug(f"Generic error: {e}")

    assert e.value.status_code == 500
    assert "An error occurred" in e.value.detail