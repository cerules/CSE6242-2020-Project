import sqlite3
import nltk
import os
import argparse
nltk.download('punkt')


parser = argparse.ArgumentParser(description="Extract abstract sentences into text file")
parser.add_argument("--sqlitePath", type=str, default="../data/ontovec.db", required=False, help="path to sqlite db file")
parser.add_argument("--sentencesDir", type=str, default="../data/sentences/", required=False, help="Folder to save semantic scholar files in")
parser.add_argument("--limit", type=int, default=1000, required=False, help="max number of abstracts to include")

args = parser.parse_args()

dbName = args.sqlitePath
os.makedirs(os.path.dirname(args.sentencesDir), exist_ok=True)
sentencesFile = os.path.join(args.sentencesDir, "sentences")
limit = args.limit

conn = sqlite3.connect(dbName)
cur = conn.cursor()

cur.execute(f"SELECT * FROM papers, paper_field WHERE papers.id = paper_field.paperId AND paper_field.fieldOfStudy = 'Computer Science' AND papers.year >= 2010 LIMIT {limit}")

def sentencesFilePath(count):
    return sentencesFile + "." + str(count) + ".txt"

count = 0
total = 500
iterations = 0
abstracts = []
paper = cur.fetchone()
while paper is not None:
    if paper[2] is not None and paper[2] != "":
        abstracts.append(paper[2])
        count = count + 1 
    if count == total:
        sentences = []
        for abstract in abstracts:
            sentences = sentences + nltk.sent_tokenize(abstract)
            with open(sentencesFilePath(iterations), 'a', encoding="utf-8") as file:
                for sentence in sentences:
                    file.write(sentence.strip("\n") + "\n")
        count = 0
        abstracts = []
        iterations = iterations + 1
        print(sentencesFilePath(iterations))
    paper = cur.fetchone()
if len(abstracts) != 0:
    sentences = []
    for abstract in abstracts:
        sentences = sentences + nltk.sent_tokenize(abstract)
        with open(sentencesFilePath(iterations), 'a', encoding="utf-8") as file:
            for sentence in sentences:
                file.write(sentence.strip("\n") + "\n")
conn.close()