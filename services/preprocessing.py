import re
from gensim.models.word2vec import Word2Vec
from gensim.corpora.dictionary import Dictionary

MAXLEN = 100

def word_splitter(word, docText):
    splitted = re.sub('([A-Z][a-z]+)', r' \1', re.sub('([A-Z]+)', r' \1', word)).split()
    for word in splitted:
        docText.append(word.lower())

def tokenizer(text, syntactic_nodes):
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

import os
def input_transform(project_name, path, words):
    model = Word2Vec.load(os.path.join(path, 'Word2vec_model_' + project_name + '.pkl'))
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
        combined = sequence.pad_sequences(combined, maxlen=MAXLEN)
        return w2indx, w2vec, combined


