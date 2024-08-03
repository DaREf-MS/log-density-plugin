import pytest
from unittest.mock import MagicMock
from service_ai_analysis.services.analysis_service import predict_file_densities
from fastapi import HTTPException

# Variables for the tests
github_url = "https://github.com/example/repo.git"
file_content = "class Test {}"

# Fixtures for mocks
@pytest.fixture
def mock_tempfile(mocker):
    return mocker.patch("service_ai_analysis.services.analysis_service.tempfile.NamedTemporaryFile", autospec=True)

@pytest.fixture
def mock_predict(mocker):
    return mocker.patch("service_ai_analysis.services.analysis_service.predict", autospec=True)

@pytest.fixture
def mock_os_path_join(mocker):
    return mocker.patch("os.path.join")

@pytest.mark.asyncio
async def test_predict_file_densities_success(mock_tempfile, mock_predict, mock_os_path_join):
    # Setup mocks
    mock_tempfile.return_value.__enter__.return_value.name = 'tempfile.java'
    mock_predict.return_value = {"output": "mocked result"}
    mock_os_path_join.side_effect = lambda *args: '/'.join(args)

    # Call the function
    result = await predict_file_densities(github_url, file_content)

    # Assertions
    assert result == {"output": "mocked result"}
    mock_tempfile.assert_called_once()
    mock_predict.assert_called_once()
