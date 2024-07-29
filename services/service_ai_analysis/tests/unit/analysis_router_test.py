import pytest
from fastapi.testclient import TestClient
from service_ai_analysis.main import app
from unittest.mock import MagicMock
import logging

client = TestClient(app)

# Variables for the tests
url = f"https://github.com/example/repo.git"
empty_url = ""

# Mock functions
@pytest.fixture
def mock_predict(mocker):
    return mocker.patch("service_ai_analysis.services.analysis_service.predict", autospec=True)

@pytest.mark.asyncio
async def test_predict_success(mock_predict):
    # Mock calling predict from the analysis_service file.py to prevent going into run_model.py
    mock_predict.return_value = None
    
    response = client.post("/predict", json={"url": url, "fileContent": "class Test {}"})
    logging.debug(f"Response status code: {response.status_code}")
    logging.debug(f"Response JSON: {response.json()}")
    
    assert response.status_code == 200
    mock_predict.assert_called_once()

@pytest.mark.asyncio
async def test_predict_empty_url(mock_predict):
    # Mock calling predict from the analysis_service file.py to prevent going into run_model.py
    mock_predict.return_value = None
    
    response = client.post("/predict", json={"url": empty_url, "fileContent": "class Test {}"})
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")
    
    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "Value error, The URL to the GitHub repository must not be empty."
    mock_predict.call_count == 0

@pytest.mark.asyncio
async def test_missing_url_field():
    response = client.post("/predict", json = {})
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "Field required"