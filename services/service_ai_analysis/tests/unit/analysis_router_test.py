import pytest
from fastapi.testclient import TestClient
from service_ai_analysis.main import app
from unittest.mock import MagicMock

# Mock functions
@pytest.fixture
def mock_predict(mocker):
    # Patch 'predict' where it's used, not where it's defined
    return mocker.patch("service_ai_analysis.services.analysis_service.predict", autospec=True)

@pytest.mark.asyncio
async def test_predict_success(mock_predict):
    mock_predict.return_value = None
    
    from service_ai_analysis.main import app
    client = TestClient(app)

    response = client.post("/predict", json={"url": "http://example.com/repo.git", "fileContent": "class Test {}"})
    
    assert response.status_code == 200

    mock_predict.assert_called_once()