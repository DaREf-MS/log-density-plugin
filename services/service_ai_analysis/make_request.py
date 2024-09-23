import requests
import json

# Function to read file contents into a string
def read_file(file_path):
    with open(file_path, 'r') as file:
        file_content = file.read()
    return file_content

# Replace with your file path
file_path = '/home/fire/Documents/PFE/PFE_Server/services/training_data/zookeeper_project/zookeeper/zookeeper-recipes/zookeeper-recipes-lock/src/main/java/org/apache/zookeeper/recipes/lock/LockListener.java'

# Read file contents into a string
file_content = read_file(file_path)

# Prepare JSON data
json_data = {
    'url': "https://github.com/apache/zookeeper.git",
    'fileContent': file_content
}

# Replace with your POST endpoint URL
url = 'http://localhost:8081/predict'

print("will send this\n", file_content)

# Send POST request with JSON data
response = requests.post(url, json=json_data)

# Check if request was successful
if response.status_code == 200:
    print('File content sent successfully!')
    print(response.text)  # Print error response if any
else:
    print(f'Failed to send file content. Status code: {response.status_code}')
    print(response.text)  # Print error response if any
