import pytest
from services.service_ai_analysis.services.analysis_service import predict_file_densities
import logging

# Variables for the tests
url = f"https://github.com/example/repo.git"
file_content = "class Test {}"

# Mock functions
@pytest.fixture
def mock_predict(mocker):
    return mocker.patch("services.service_ai_analysis.services.analysis_service.predict", autospec=True)

@pytest.mark.asyncio
async def test_predict_file_densities_success(mock_predict):
    mock_predict.return_value = {"result": "success"}
    
    result = await predict_file_densities(url, file_content)
    
    mock_predict.assert_called_once()
    
    assert result == {"result": "success"}
