from sense2vec import Sense2Vec
import sqlite3
import csv
import argparse
import os

parser = argparse.ArgumentParser(description="create initial ontology graph")
parser.add_argument("--keywordDB", type=str, default="../data/keywords.db", required=False, help="path to sqlite keywords db file")
parser.add_argument("--s2vModel", type=str, default="../data/sense2vec_train/05", required=False, help="path to trained sense2vec model")
parser.add_argument("--outputDir", type=str, default="../data/", required=False, help="output directory")
parser.add_argument("--threshold", type=float, default=0.6, required=False, help="cosine similarity threshold used to create edges between keywords")
parser.add_argument("--keywordLimit", type=int, default=100000, required=False, help="max number of keywords to create the graph from")
args = parser.parse_args()

# load s2v model
s2v = Sense2Vec().from_disk(args.s2vModel)
words = list(s2v.keys())
limit = str(args.keywordLimit)

# load keywords
conn = sqlite3.connect(args.keywordDB)
c = conn.cursor()
c.execute(f"SELECT words, COUNT(paperID) AS word_count FROM keywords GROUP BY words ORDER BY word_count DESC limit {limit};")

vectoredKeywords = []
keyword = c.fetchone()
senses=s2v.senses
senses.remove("PUNCT") # remove punctation
senses.remove("X") # remove uncategorized words
while keyword is not None:
    keyword = keyword[0]
    keyword=str(keyword)
    if keyword.isascii(): # filter out obvious non-english words
        keyword = keyword.replace(" ", "_").lower()
        bestSense = s2v.get_best_sense(keyword, senses=senses)
        if bestSense is not None and bestSense != "":
            vectoredKeywords.append(bestSense)
    keyword = c.fetchone()

vectoredKeywords.sort()

# find related words based on similarity threshold
relatedWords = []
for idx, vectoredKeyword in enumerate(vectoredKeywords):
    similars = s2v.most_similar(vectoredKeyword)
    for similar in similars:
        if similar[0] in vectoredKeywords and similar[1] > args.threshold:
            # print(f"{vectoredKeyword} is related to {similar[0]} with similarity {similar[1]}")
            relatedWords.append({'source': idx, 'target': vectoredKeywords.index(similar[0]), 'similarity': similar[1]})

os.makedirs(os.path.dirname(args.outputDir), exist_ok=True)
# save edges file
with open(os.path.join(args.outputDir, "edges.csv"), "w") as csvfile:
    edgeWriter = csv.writer(csvfile)
    edgeWriter.writerow(["source", "target", "similarity"])
    for relatedWord in relatedWords:
        edgeWriter.writerow([relatedWord["source"], relatedWord["target"], relatedWord["similarity"]])

# save words file
with open(os.path.join(args.outputDir, "words.csv"), "w") as csvfile:
    edgeWriter = csv.writer(csvfile)
    header = ["id", "word"]
    for dimension in range(len(s2v[vectoredKeywords[0]])):
        header.append("v"+str(dimension))

    edgeWriter.writerow(header)
    for idx, vectoredKeyword in enumerate(vectoredKeywords):
        row = [idx, vectoredKeyword]
        row.extend(list(s2v[vectoredKeyword]))
        edgeWriter.writerow(row)