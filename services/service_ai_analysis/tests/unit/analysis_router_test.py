import pytest
from fastapi.testclient import TestClient
from main import app
import logging

client = TestClient(app)

@pytest.mark.asyncio
async def test_create_model_success():
    response = client.get("/test")
    # logging.debug(f"Response status code: {response.status_code}")
    # logging.debug(f"Response JSON: {response.json()}")

    assert response.status_code == 200
    assert response.json().get("message") == "test"