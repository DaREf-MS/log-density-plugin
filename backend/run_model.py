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

## Treat file/part-of-it after java did its thing
x_example = '[MethodDeclaration, MethodCallExpr, ReturnStmt, FieldAccessExpr] [String, getAddress, getBind, host]'
import numpy
x_transformed=numpy.array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                           0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                           0,0,26,25,30,16,3330,1466,108,1466,354,1585],dtype=numpy.int32)

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

# TODO - remove this
project_dir = "/dossier_host/open_source_java_projects/proj_tomcat/tomcat" #sys.argv[2]
syn = load_syntactic_nodes(project_dir)
print(syn)

x = preprocess_nodes([x_example], syn, project_dir)

print(x[0])
print(x_transformed)

assert numpy.all(x[0] == x_transformed)

model = load_model(project_dir)
print(model)

y = model.predict(x)
print(y)