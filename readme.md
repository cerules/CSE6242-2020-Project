# OntoVec

## Step 0: Install dependencies

If you are using Windows it is recommended to use the Windows Subsystem for Linux as it is easier to compile the dependencies.

Install python dependencies from conda environment file and pip

```sh
conda env create -f ontovec.yml
pip install sense2vec
pip install git+https://github.com/LIAAD/yake
```

Clone and build the GloVe source code by running make in the GloVe directory

```sh
git clone https://github.com/stanfordnlp/GloVe
cd ./GloVe
make
```


## Step 1: Download Data

Downloads academic paper metadata from [Semantic Scholar](https://www.semanticscholar.org/)'s [Open Research Corpus](http://s2-public-api-prod.us-west-2.elasticbeanstalk.com/corpus/)

Can be run with default arguments to download all computer science papers. For more information run the script with --help.

```sh
python ./01_download_data.py
```

To download a smaller example dataset use the `--fileLimit` parameter.

```sh
python ./01_download_data.py --fileLimit 5
```


## Step 2: Extract Sentences

Extracts sentences from paper abstracts

Can be run with default arguments to extract sentences from 1000 papers. For more information run the script with --help.

```sh
python ./02_extract_sentences.py
```

In practice we set the limit argument to 100000

```sh
python ./02_extract_sentences.py --limit 100000
```

## step 3: Extract Keywords

Uses [YAKE!](https://github.com/LIAAD/yake) to extract keywords from paper abstracts.
Make sure you install it first.

```sh
pip install git+https://github.com/LIAAD/yake
```

Can be run with default arguments. For more information run the script with --help.

```sh
python ./03_extract_keywords.py
```

In practice we extracted keywords from all papers with year >= 2010

```sh
python ./03_extract_keywords.py --yearCutOff 2010
```

## step 4: Train sense2vec glove model

Trains a sense2vec glove model on the paper abstracts using the sentences extracted in step 2.

Should clone [forked version of sense2vec](https://github.com/cerules/sense2vec) that fixes formatting issue until the issue is fixed / this [pull request](https://github.com/explosion/sense2vec/pull/98) is completed

input arguments depend on previous step's output locations. Glove build directory as well as sense2vec scripts directory are required as input. If using the default set arguments your arguments should look something like this:

```sh
./04_sense2vec_train.sh ../../GloVe/build/ ../../sense2vec/scripts/ ../data/sense2vec_train/
```

## step 5: Connect keywords based on word vector distance

Uses the word vectors generated in step 4 and the keywords generated in step 3 to ouptut a node and edges file. The nodes consist of keywords who have word vectors. Edges exist between two nodes if the cosine similarity of their two word vectors is greater than the given threshold.

outputs an edges.csv and words.csv file.

Can be run with default arguments. For more information run the script with --help.

```sh
python ./05_initial_ontology.py
```

This step outputs the `words.csv` and `edges.csv` files needed for the visualization step.

The files should look something like the examples below.

`words.csv`

|id|word|v0|v1|v2|v3|...|v127|
|--|----|--|--|--|--|---|----|
|0|computer_science|0.23|0.123|-0.32|0.832|...|0.044123|
|1|machine_learning|0.98|0.123|0.45|-0.32|...|0.132|
|...|

`edges.csv`

|source|target|similarity|
|------|------|----------|
|0|1|0.6|
|...|


## step 6: visualize/modify

Visualize the words and edges in a graph.
Edges can be added and removed as seen fit.

The vizualization step requires a `words.csv` and `edges.csv` file in the `data/` directory. These should be present if you followed the previous steps with default arguments.

The easiest way to run the visualization is with a local python webserver from the root of this git repo.

For example
```sh
python -m http.server 8000
```

Finally, navigate to `localhost:8000/ui/ontology_graph.html` in your browser.