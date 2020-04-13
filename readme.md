# OntoVec

## Step 0: Install dependencies

`conda env create -f ontovec.yml`

`pip install sense2vec`
`pip install git+https://github.com/LIAAD/yake`

`clone https://github.com/stanfordnlp/GloVe`

run make in the GloVe directory

## Step 1: Download Data

Downloads academic paper metadata from [Semantic Scholar](https://www.semanticscholar.org/)'s [Open Research Corpus](http://s2-public-api-prod.us-west-2.elasticbeanstalk.com/corpus/)

Can be run with default arguments. For more information run the script with --help.

```python ./01_download_data.py```


## Step 2: Extract Sentences

Extracts sentences from paper abstracts

Can be run with default arguments. For more information run the script with --help.

```python ./02_extract_sentences.py```

## step 3: Extract Keywords

Uses [YAKE!](https://github.com/LIAAD/yake) to extract keywords from paper abstracts.

Can be run with default arguments. For more information run the script with --help.

```python ./03_extract_keywords.py```

## step 4: Train sense2vec glove model

Trains a sense2vec glove model on the paper abstracts using the sentences extracted in step 2.

Should clone [forked version of sense2vec](https://github.com/cerules/sense2vec) that fixes formatting issue until the issue is fixed / this [pull request](https://github.com/explosion/sense2vec/pull/98) is completed

input arguments depend on previous step's output locations. Glove build directory as well as sense2vec scripts directory are required as input. If using the default set arguments your arguments should look something like this:

```./04_sense2vec_train.sh ../../GloVe/build/ ../../sense2vec/scripts/ ./data/sense2vec_train/```

## step 5: Connect keywords based on word vector distance

Uses the word vectors generated in step 4 and the keywords generated in step 3 to ouptut a node and edges file. The nodes consist of keywords who have word vectors. Edges exist between two nodes if the cosine similarity of their two word vectors is greater than the given threshold.

outputs an edges.csv and words.csv file.

Can be run with default arguments. For more information run the script with --help.

```python ./05_initial_ontology.py```

## step 6: visualize/modify

Visualize the words and edges in a graph.

Edges can be added and removed as seen fit.