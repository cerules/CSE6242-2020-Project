import urllib.request
import gzip
import json
import sqlite3
from tqdm import tqdm

base_url = "https://s3-us-west-2.amazonaws.com/ai2-s2-research-public/open-corpus/2020-03-01/"
response = urllib.request.urlopen(base_url + "manifest.txt")
manifest = response.read().decode('utf-8')
files = manifest.split("\n")
files = files[:-2] # last two files are sample and readme

conn = sqlite3.connect("ontovec.db")
c = conn.cursor()
c.execute('''CREATE TABLE papers (id text, title text, abstract text, doi text)''')

def insertPaper(cursor, paper):
    sql = "INSERT INTO papers (id,title,abstract,doi) VALUES (?, ?, ?, ?)"
    cursor.execute(sql, (paper['id'], paper['title'], paper['paperAbstract'], paper['doi']))

for file in files:
    print(file)
    response = urllib.request.urlopen(base_url + file)
    unzippedBytes = gzip.decompress(response.read())
    decodedFile = unzippedBytes.decode('utf-8')
    jsons = decodedFile.split("\n")
    with tqdm(total=len(jsons)) as pbar:
        pbar.set_description(file)
        for jsonPaper in jsons:
            if jsonPaper and jsonPaper.strip():
                try:
                    paper = json.loads(jsonPaper)
                    insertPaper(c, paper)
                except:
                    print("failed: {}".format(jsonPaper))
            pbar.update(1)

# Save (commit) the changes
conn.commit()

# We can also close the connection if we are done with it.
# Just be sure any changes have been committed or they will be lost.
conn.close()