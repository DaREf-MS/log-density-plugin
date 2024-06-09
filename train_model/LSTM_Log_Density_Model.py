import subprocess
import json
import os
import ast
import re as re
import multiprocessing
import numpy as np
from gensim.models.word2vec import Word2Vec
from gensim.corpora.dictionary import Dictionary
import random as rn
import pandas as pd
import sys
import csv
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
from sklearn.utils import resample
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Embedding, LSTM

seed_value = 128
os.environ['PYTHONHASHSEED'] = str(seed_value)
np.random.seed(seed_value)
rn.seed(seed_value)
csv.field_size_limit(100000000)
sys.setrecursionlimit(1000000)
# set parameters:
vocab_dim = 100
maxlen = 100
n_iterations = 1
n_exposures = 10
window_size = 7
batch_size = 24
n_epoch = 1 # plus grand pour meilleure qualite 50 recommande
n_fold = 10  # how many folds, basically should be set to 10
input_length = 100
cpu_count = multiprocessing.cpu_count()
syntactic_nodes = []


def word_splitter(word, docText):
    splitted = re.sub('([A-Z][a-z]+)', r' \1', re.sub('([A-Z]+)', r' \1', word)).split()
    for word in splitted:
        docText.append(word.lower())


def tokenizer(text):
    ''' Simple Parser converting each document to lower-case, then
        removing the breaks for new lines and finally splitting on the
        whitespace
    '''
    newText = []
    for doc in text:
        docText = []
        for word in str(doc).replace("'", "").replace("[", "").replace("]", "").replace(",", "").replace('"', "").split(' '):
            if word not in syntactic_nodes:
                word_splitter(word, docText)
            else:
                docText.append(word)
        newText.append(docText)
    return newText


def input_transform(project_name, path, words):
    model = Word2Vec.load(path + 'Word2vec_model_' + project_name + '.pkl')
    _, _, dictionaries = create_dictionaries(model, words)
    return dictionaries


def create_dictionaries(model=None, combined=None):
    ''' Function does are number of Jobs:
        1- Creates a word to index mapping
        2- Creates a word to vector mapping
        3- Transforms the Training and Testing Dictionaries

    '''
    from keras.preprocessing import sequence

    if (combined is not None) and (model is not None):
        gensim_dict = Dictionary()
        gensim_dict.doc2bow(model.wv.index_to_key, allow_update=True)
        w2indx = {v: k + 1 for k, v in gensim_dict.items()}
        w2vec = {word: model.wv[word] for word in w2indx.keys()}

        def parse_dataset(combined):
            ''' Words become integers
            '''
            data = []
            for sentence in combined:
                new_txt = []
                for word in sentence:
                    try:
                        new_txt.append(w2indx[word])
                    except:
                        new_txt.append(0)
                data.append(new_txt)
            return data

        combined = parse_dataset(combined)
        combined = sequence.pad_sequences(combined, maxlen=maxlen)
        return w2indx, w2vec, combined


def word2vec_train(combined, project_name, path):
    model = Word2Vec(vector_size=vocab_dim,  # dimension of word embedding vectors
                     min_count=n_exposures,
                     window=window_size,
                     workers=cpu_count, sg=1)
    model.build_vocab(combined)
    model.save(path + 'Word2vec_model_' + project_name + '.pkl')
    index_dict, word_vectors, combined = create_dictionaries(model=model, combined=combined)
    return index_dict, word_vectors, combined


def get_data(index_dict, word_vectors, combined):
    n_symbols = len(index_dict) + 1
    embedding_weights = np.zeros((n_symbols, vocab_dim))
    for word, index in index_dict.items():
        embedding_weights[index, :] = word_vectors[word]

    return n_symbols, embedding_weights


def train_test_density_lstm(project_name, path, n_symbols, embedding_weights, x_train, y_train, x_test, y_test):
    model = Sequential()
    model.add(Embedding(output_dim=vocab_dim,
                        input_dim=n_symbols,
                        mask_zero=True,
                        weights=[embedding_weights],
                        input_length=input_length))
    model.add(LSTM(units=128, activation='sigmoid'))
    model.add(Dropout(0.2))  # to avoid overfitting
    model.add(Dense(6, activation='sigmoid'))  # Output layer

    print('Compiling the Density Model..')
    model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

    print('Training the Density Model...')
    history = model.fit(x_train, y_train, batch_size=batch_size, epochs=n_epoch, verbose=1)

    print('Evaluating the Density Model...')
    score = model.evaluate(x_test, y_test, batch_size=batch_size)
    # y_prediction = model.predict(x)
    json_string = model.to_json()
    with open(path + 'log_density_model_' + project_name + '.json', 'w') as outfile:
        json.dump(json_string, outfile)
    model.save_weights(path + 'log_density_weights_' + project_name + '.weights.h5')
    np.set_printoptions(threshold=sys.maxsize)
    
    print('Test score:', score, model.metrics_names)

    label_predicted_probs = model.predict(x_test, batch_size=batch_size, verbose=1)
    label_predicted = np.array([[1 if p > 0.5 else 0 for p in row] for row in label_predicted_probs])
    val_accuracy = accuracy_score(y_test, label_predicted)
    val_auc = 0
    classes = 0
    for i in range(6):
        y_test_i = [row[i] for row in y_test]
        label_predicted_i = [row[i] for row in label_predicted]
        try:
            val_auc_i = roc_auc_score(y_test_i, label_predicted_i)
            val_auc += val_auc_i
            classes += 1
        except Exception as error:
            print(error)
            print('class', str(i))
    val_auc = val_auc / classes
    print('Accuracy: ', val_accuracy)
    print('AUC (testing): ', val_auc)

    vector_to_value = {tuple(np.array(v)): k for k, v in value_to_vector.items()}

    with open(path + 'log_density_predicted_labels_' + project_name + '.txt', 'wt') as f:
        for data in label_predicted:
            result = vector_to_value.get(tuple(data), None)
            if result:
                f.write(str(result) + '\n')
            else:
                f.write('0\n')

    with open(path + 'log_density_target_labels_' + project_name + '.txt', 'wt') as f:
        for data in y_test:
            f.write(str(data) + '\n')

    with open(path + 'log_density_results_' + project_name + '.txt', 'wt') as f:
        f.write('Test score:' + str(score) + '  ' + str(model.metrics_names) + '\n')
        f.write('Accuracy: ' + str(val_accuracy) + '\n')
        f.write('AUC: ' + str(val_auc) + '\n')

    return model


def divide_ML_Data_to_pos_and_neg(project_name, path):
        inputFile = path + project_name + '_MLdata_FileLevel_WithClusters.csv'
        df = pd.read_csv(inputFile, delimiter=',', engine='python', on_bad_lines='skip')
        df['Nodes'] = df['syn_feat'] + ' ' + df['sem_feat']
        pos_df = df[df['class'] > 0][['filename', 'Nodes', 'class']]
        pos_df.to_csv(path + 'pos_' + project_name + '_FileLevel_WithClusters.csv')
        neg_df = df[df['class'] == 0][['filename', 'Nodes', 'class']]
        neg_df.to_csv(path + 'neg_' + project_name + '_FileLevel_WithClusters.csv')


def read_syn_nodes(project_name, path):
    def combine_lists(s):
        try:
            list_values = ast.literal_eval(s)
            return list_values
        except (SyntaxError, ValueError):
            return []

    df = pd.read_csv(path + project_name + '_MLdata_FileLevel_WithClusters.csv', delimiter=',', engine='python', on_bad_lines='skip')
    df['combined_syn_feat'] = df['syn_feat'].apply(combine_lists)
    syntactic_nodes = list(set([item for sublist in df['combined_syn_feat'] for item in sublist]))

    return syntactic_nodes


if __name__ == '__main__':
    project = sys.argv[1]
    print(project)
    
    project_name = os.path.basename(project)
    path = os.path.dirname(project) + "/"

    # Path to the R script
    r_script_path = "clustering.R"
    # Run the R script
    result = subprocess.run(["Rscript", r_script_path, project], capture_output=True, text=True)

    print('Loading Data...')
    divide_ML_Data_to_pos_and_neg(project_name, path)
    syntactic_nodes = read_syn_nodes(project_name, path)

    neg_full = pd.read_csv(path + 'neg_' + project_name + '_FileLevel_WithClusters.csv', usecols=[1, 2, 3], engine='python')
    pos_full = pd.read_csv(path + 'pos_' + project_name + '_FileLevel_WithClusters.csv', usecols=[1, 2, 3], engine='python')
    y = pd.concat([pos_full, neg_full], axis=0)['class'].to_numpy()

    neg = neg_full['Nodes'].values.tolist()
    pos = pos_full['Nodes'].values.tolist()
    x = np.array(pos + neg)

    print('Splitting Data...')
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, train_size=0.8, random_state=seed_value, stratify=y)

    x_train_df = pd.DataFrame(data=x_train, columns=['x_train'])
    y_train_df = pd.DataFrame(data=y_train, columns=['y_train'])

    x_y = pd.concat([x_train_df, y_train_df], axis=1)
    logged = x_y.loc[x_y['y_train'] != 0]
    un_logged = x_y.loc[x_y['y_train'] == 0]

    print('Upsampling...')
    logged_upsampled = resample(logged, replace=True, n_samples=len(un_logged), random_state=2020)  # upsampling

    y_train = pd.concat([logged_upsampled, un_logged], axis=0)['y_train'].to_numpy()
    x_train = pd.concat([logged_upsampled, un_logged], axis=0)['x_train'].to_numpy()

    print('One hot encoding...')
    # One hot encoding for y
    value_to_vector = {
        0: [1, 0, 0, 0, 0, 0],
        1: [0, 1, 0, 0, 0, 0],
        2: [0, 0, 1, 0, 0, 0],
        3: [0, 0, 0, 1, 0, 0],
        4: [0, 0, 0, 0, 1, 0],
        5: [0, 0, 0, 0, 0, 1]
    }
    y_train = np.array([value_to_vector[value] for value in y_train])
    y_test = np.array([value_to_vector[value] for value in y_test])

    print('Tokenizing for Density Model...')
    x_tokenized = tokenizer(x)
    x_train_tokenized = tokenizer(x_train)
    x_test_tokenized = tokenizer(x_test)

    print('Training a Word2vec model...')
    index_dict, word_vectors, x_transformed = word2vec_train(x_train_tokenized, project_name, path)
    x_train_transformed = input_transform(project_name, path, x_train_tokenized)
    x_test_transformed = input_transform(project_name, path, x_test_tokenized)

    print('Setting up Arrays for Keras Embedding Layer...')
    n_symbols, embedding_weights = get_data(index_dict, word_vectors, x_train_tokenized)

    # Running the density model
    density_model = train_test_density_lstm(project_name, path, n_symbols, embedding_weights, x_train_transformed, y_train, x_test_transformed, y_test)


#INPUT: project + '_MLdata_FileLevel_WithClusters.csv'
#HOW TO RUN: python3 LSTM_Log_Density_Model.py project
