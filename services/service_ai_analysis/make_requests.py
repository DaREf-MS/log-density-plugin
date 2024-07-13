import requests
import json

# URL of your FastAPI endpoint
url = 'http://127.0.0.1:8080/predict'

# Data to be sent to the API
data = {
    "url": "https://github.com/apache/zookeeper.git",
    "filepath": r"zookeeper\zookeeper-contrib\zookeeper-contrib-loggraph\src\main\java\org\apache\zookeeper\graph\LogSkipList.java"
}

# Convert the dictionary to JSON
json_data = json.dumps(data)

# Set the appropriate headers. In this case, we're sending JSON data
headers = {
    'Content-Type': 'application/json'
}

# Send the POST request
response = requests.post(url, data=json_data, headers=headers)

# Print the response from the server
print(response.text)
