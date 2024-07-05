## 1) Collecting data:

* Run JavaASTExtract.java to collect the data necessary for the Model <br> 
* You need to pass the name of the project as the only argument : java JavaASTExtract _project_

## 2) Running the model:
* Run LSTM_Log_Density_Model.py to train and test the model on the collected data <br> 
* You need to pass the name of the project as the only argument : python3 LSTM_Log_Density_Model.py _project_  <br> 
The LSTM model will be saved under: 'log_density_model_' + project + '.json' <br>
The LSTM model weights will be saved under: 'log_density_weights_' + project + '.h5' <br>
The word2Vec model will be saved under: 'Word2vec_model_' + project + '.pkl' <br>
P.S: the R script will be executed automatically once you run the LSTM_Log_Density_Model.py

-------------------------

Il y un Dockerfile qui installe toutes les dépendances et qui permet de rouler les différents scripts:
pour le build:

```sh
cd backend
```

```sh
docker build -t pfe-app-image .
```

pour rouler une invite de command bash:
```sh
docker run -it -v < Path absolu vers le dossier avec les java projects >:/dossier_host -p 8080:8080 pfe-app-image /usr/bin/bash
```

Cette dernière command donne accès au dossier courant (lorsque la commande est lancé) à travers du folder /dossier_host
dans le container. On peut s'en servir pour acceder à des dossiers de projets java sur l'ordinateur host.

pour rouler le code java dans le container sur un dossier de projet java on peut faire
```sh
preprocess_project ../../dossier_host/open_source_java_projects/some_java_project_folder
```
où l'argument est le path vers le dossier du code java à analyser.

pour rouler le script python qui utilise les données produites par le java:
```sh
python3 LSTM_Log_Density_Model.py /dossier_host/open_source_java_projects/some_java_project_folder
```

Je recommande d'utiliser l'extension Dev Containers de VScode pour debug le code qui roule dans le container.

<!-- TODO: doc for dependencies and tests for running locally -->
<!-- pytest -p no:cacheprovider --log-cli-level=DEBUG
pytest -p no:cacheprovider ./tests/unit --log-cli-level=DEBUG
pytest -p no:cacheprovider ./tests/integration --log-cli-level=DEBUG -->