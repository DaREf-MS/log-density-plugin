from keras.models import model_from_json
import json
import os
import pickle
import sys
import preprocessing

# TODO - all paths start from project_path

def load_model(project_dir):
    "Load a model trained and saved in project_dir\n" \
    "project_dir - ends with a '/'"
    
    parent_path = os.path.dirname(project_dir)
    project_name = os.path.basename(project_dir)

    model_name = os.path.join(parent_path, 'log_density_model_' + project_name + '.json')
    model_weights = os.path.join(parent_path, 'log_density_weights_' + project_name + '.weights.h5')

    print("LOADING MODEL")
    infile = open(model_name, 'r')
    json_string = json.load(infile)
    infile.close()

    loaded_model = model_from_json(json_string)
    print("LOADING WEIGHTS")
    loaded_model.load_weights(model_weights)
        
    return loaded_model

def load_syntactic_nodes(project_dir):
    print("LOADING SYNTATIC NODES")
    syntactic_nodes = None
    with open(os.path.join(os.path.dirname(project_dir), 'syntactic_nodes.pkl'), "rb") as file:
        syntactic_nodes = pickle.load(file)
    return syntactic_nodes

def preprocess_nodes(x, syntactic_nodes, project_dir):
    
    project_name = os.path.basename(project_dir)
    parent_path = os.path.dirname(project_dir)
    
    x_tokenized = preprocessing.tokenizer(x, syntactic_nodes)
    x_transformed = preprocessing.input_transform(project_name, parent_path, x_tokenized)
    
    return x_transformed

import subprocess
import pprint
import json
import pandas
def preprocess_file(filepath, syntactic_nodes, project_dir):
    
    # obtain nodes from Java thing
    result = subprocess.run(["preprocess_project", filepath], capture_output=True, text=True)
    
    preprocessed_file_json = json.loads(result.stdout)
    blocks_table = pandas.DataFrame(preprocessed_file_json["blocks"])
    
    nodes = blocks_table['nodes'].to_list()
    
    x = preprocess_nodes(nodes, syntactic_nodes, project_dir)
    
    blocks_table = blocks_table.drop('nodes', axis=1)
    blocks_table['x'] = [*x]
    
    blocks = blocks_table.to_dict(orient='records')
    return {**preprocessed_file_json, "blocks": blocks}

# TODO - remove hardcoded project dirs
project_dir = sys.argv[1]
syn = load_syntactic_nodes(project_dir)

test_file = "/dossier_host/zookeeper_project/zookeeper/zookeeper-contrib/zookeeper-contrib-loggraph/src/main/java/org/apache/zookeeper/graph/LogSkipList.java"
preprocessed_file = preprocess_file(test_file, syn, project_dir)

import numpy as np
model = load_model(project_dir)
x = np.array([block["x"] for block in preprocessed_file['blocks']])
print(x)
y = model.predict(x)
print(y)
log_level_per_block = np.argmax(y, axis=1)
print(log_level_per_block)
print([block["blockLineStart"] for block in preprocessed_file['blocks']])

average_class = np.average(log_level_per_block)
prediced_class = round(average_class)
print(prediced_class)

log_density_classes = [
    "No logs",
    "Very low log density",
    "Low log density",
    "Medium log density",
    "High log density",
    "Very High log density"
]

print(log_density_classes[prediced_class])