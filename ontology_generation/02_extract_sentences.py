import sqlite3
import nltk
nltk.download('punkt')
dbName = "./ontovec.db"
sentencesFile = "./data/sentences/csSentences_2020"

conn = sqlite3.connect(dbName)
cur = conn.cursor()

cur.execute("SELECT * FROM papers, paper_field WHERE papers.id = paper_field.paperId AND paper_field.fieldOfStudy = 'Computer Science' AND papers.year >= 2020 LIMIT 1000")

def sentencesFilePath(count):
    return sentencesFile + "." + str(count) + ".txt"

count = 0
total = 10
iterations = 0
abstracts = []
paper = cur.fetchone()
while paper is not None:
    if paper[2] is not None and paper[2] != "":
        abstracts.append(paper[2])
        count = count + 1 
    if count == total: # todo: handle case where we finish reading papers but haven't written the last few
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