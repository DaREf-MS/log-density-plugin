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
# Projet de fin d'étude - Développement d'une extension d'analyse de logging
## Rouler les tests localement
Tous les tests:
```sh
cd backend
pytest -p no:cacheprovider
```

Tests unitaires:
```sh
pytest -p no:cacheprovider ./tests/unit
```

Test d'intégration:
```sh
pytest -p no:cacheprovider ./tests/integration
```
Pour obtenir plus d'informations lors de séance de débogage:
- Saisir le fichier test approprié dans `backend/tests/unit` ou `backend/tests/integration` ;
- Décommenter les parties de code contenant `logging.debug()` ou en ajouter ;
- Rouler la commande `pytest` désirée en ajoutant  l'option `--log-cli-level=DEBUG` .

## Dockerfile et image Docker
Il y un fichier Dockerfile qui installe toutes les dépendances et qui permet de rouler les différents scripts.

Pour construire une image Docker:
```sh
cd backend
docker build -t pfe-app-image .
```

Pour rouler une invite de command bash:
```sh
docker run -it -v < Path absolu vers le dossier avec les java projects >:/dossier_host -p 8080:8080 pfe-app-image /usr/bin/bash
```
Cette dernière command donne accès au dossier courant (lorsque la commande est lancée) à travers le dossier /dossier_host dans le container. On peut s'en servir pour accéder à des dossiers de projets Java sur l'ordinateur host.

Pour rouler le code java dans le container sur un dossier de projet java:
```sh
preprocess_project ../../dossier_host/open_source_java_projects/some_java_project_folder
```
où l'argument est le path vers le dossier du code java à analyser.

Pour rouler le script python qui utilise les données produites par le java:
```sh
python3 LSTM_Log_Density_Model.py /dossier_host/open_source_java_projects/some_java_project_folder
```