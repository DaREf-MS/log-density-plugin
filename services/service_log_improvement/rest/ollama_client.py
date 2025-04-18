import requests

BASE_URL = "http://ollama:11434"

def pull_model(model):
    """
    Checks if the model is installed in Ollama. If not, it will attempt to pull the model.

    :param model: The model to check and pull.
    :return: True if the model was successfully pulled or is already available, else False.
    """
    url = f"{BASE_URL}/api/tags"  # Ollama API to list available models
    pull_url = f"{BASE_URL}/api/pull"  # Ollama API to pull a model

    try:
        # Check if the model is available
        response = requests.get(url)
        response.raise_for_status()
        models = response.json().get("models", [])

        # If model is not found, attempt to pull it
        if not any(m["name"] == model for m in models):
            print(f"Model {model} not found. Attempting to pull...")
            pull_response = requests.post(pull_url, json={"name": model})
            pull_response.raise_for_status()
            print(f"Model {model} has been successfully pulled.")
            return True
        else:
            print(f"Model {model} is already installed.")
            return True
    except requests.exceptions.RequestException as e:
        print(f"Error checking or pulling model: {e}")
        return False


def generate(prompt, model="llama3.2:3b"):
    """
    Send a prompt to an Ollama model and return the response.

    :param prompt: The input text to send to the model.
    :param model: The model to use (default: "llama2").
    :return: The model's response as a string.
    """
    url = f"{BASE_URL}/api/generate"  # Default Ollama API endpoint
    data = {
        "model": model,
        "prompt": prompt,
        "stream": False  # Set to True if you want a streaming response
    }

    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json().get("response", "No response received.")
    except requests.exceptions.RequestException as e:
        return f"Error: {e}"
