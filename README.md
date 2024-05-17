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