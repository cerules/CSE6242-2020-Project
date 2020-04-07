from sense2vec import Sense2Vec
import sqlite3
import csv
import argparse
import os

parser = argparse.ArgumentParser(description="create initial ontology graph")
parser.add_argument("--keywordDB", type=str, required=True, help="path to sqlite keywords db file")
parser.add_argument("--s2vModel", type=str, required=True, help="path to trained sense2vec model")
args = parser.parse_args()

# load s2v model
s2v = Sense2Vec().from_disk(args.s2vModel)
words = list(s2v.keys())

# load keywords
conn = sqlite3.connect(args.keywordDB)
c = conn.cursor()
c.execute("SELECT DISTINCT words from keywords")

keywords = c.fetchall()
keywords = list(map(lambda  w : str(w)[2:-3].replace(" ", "_").lower(), keywords))

# finde kewyords with word vectors
vectoredKeywords = []
for keyword in keywords:
    bestSense = s2v.get_best_sense(keyword)
    if bestSense is not None and bestSense != "":
        vectoredKeywords.append(bestSense)
vectoredKeywords.sort()

# find related words based on similarity threshold
relatedWords = []
for idx, vectoredKeyword in enumerate(vectoredKeywords):
    similars = s2v.most_similar(vectoredKeyword)
    for similar in similars:
        if similar[0] in vectoredKeywords and similar[1] > 0.8:
            # print(f"{vectoredKeyword} is related to {similar[0]} with similarity {similar[1]}")
            relatedWords.append({'source': idx, 'target': vectoredKeywords.index(similar[0]), 'similarity': similar[1]})

os.makedirs(os.path.dirname("ontologyGraph/"), exist_ok=True)
# save edges file
with open("ontologyGraph/edges.csv", "w") as csvfile:
    edgeWriter = csv.writer(csvfile)
    for relatedWord in relatedWords:
        edgeWriter.writerow([relatedWord["source"], relatedWord["target"], relatedWord["similarity"]])

# save words file
with open("ontologyGraph/words.csv", "w") as csvfile:
    edgeWriter = csv.writer(csvfile)
    for idx, vectoredKeyword in enumerate(vectoredKeywords):
        row = [idx, vectoredKeyword]
        row.extend(list(s2v[vectoredKeyword]))
        edgeWriter.writerow(row)