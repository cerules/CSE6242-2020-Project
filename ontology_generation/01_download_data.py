import urllib.request
import gzip
import json
import sqlite3
import os
import argparse
from tqdm import tqdm

def createPaperTables(cur):
    cur.execute('''CREATE TABLE IF NOT EXISTS papers (id TEXT PRIMARY KEY, title TEXT, abstract TEXT, doi TEXT, year INTEGER)''')
    cur.execute('''CREATE TABLE IF NOT EXISTS paper_field (paperId TEXT, fieldOfStudy TEXT)''')
    
def insertField(cursor, paperId, field):
    sql = "INSERT INTO paper_field (paperId, fieldOfStudy) VALUES (?, ?)"
    cursor.execute(sql, (paperId, field))

def insertPaper(cursor, paper):
    sql = "INSERT INTO papers (id,title,abstract,doi,year) VALUES (?, ?, ?, ?, ?)"
    cursor.execute(sql, (paper['id'], paper['title'], paper['paperAbstract'], paper['doi'], paper['year']))
    for field in paper['fieldsOfStudy']:
        insertField(cursor, paper['id'], field)

def tryOpenCachedFile(file, fileCacheDir):
    if fileCacheDir is None:
        return None
    try:
        with open(os.path.join(fileCacheDir, file), "rb") as cachedFile:
            unzippedBytes = gzip.decompress(cachedFile.read())
            print("loaded {} from cache".format(file))
            return unzippedBytes
    except:
        print("{} is not cached".format(file))
        return None

def requestFileHttp(file, fileCacheDir):
    response = urllib.request.urlopen(base_url + file)
    responseBytes = response.read()
    if fileCacheDir:
        with open(os.path.join(fileCacheDir, file), "wb") as cachedFile:
            cachedFile.write(responseBytes)
            print("cached {}".format(file))
    unzippedBytes = gzip.decompress(responseBytes)
    return unzippedBytes

def downloadFile(file, cur, fileCacheDir):
    unzippedBytes = tryOpenCachedFile(file, fileCacheDir)
    if unzippedBytes is None:
        unzippedBytes = requestFileHttp(file, fileCacheDir)

    decodedFile = unzippedBytes.decode('utf-8')
    jsons = decodedFile.split("\n")
    with tqdm(total=len(jsons)) as pbar:
        pbar.set_description(file)
        for jsonPaper in jsons:
            if jsonPaper and jsonPaper.strip():
                try:
                    paper = json.loads(jsonPaper)
                    if "Computer Science" in paper['fieldsOfStudy']:
                        insertPaper(cur, paper)
                except:
                    print("failed: {}".format(jsonPaper))
            pbar.update(1)
            

parser = argparse.ArgumentParser(description="download semantic scholar data")
parser.add_argument("--sqlitePath", type=str, default="../data/ontovec.db", required=False, help="path to sqlite db file")
parser.add_argument("--cacheDir", type=str, required=False, help="Folder to save semantic scholar files in")
parser.add_argument("--fileLimit", type=int, required=False, default="-1", help="limit on number of files to download from semantic scholar")

args = parser.parse_args()

dbName = args.sqlitePath
fileCacheDir = args.cacheDir
base_url = "https://s3-us-west-2.amazonaws.com/ai2-s2-research-public/open-corpus/2020-03-01/"

response = urllib.request.urlopen(base_url + "manifest.txt")
manifest = response.read().decode('utf-8')
files = manifest.split("\n")
files = files[:-2] # last two files are sample and readme

if args.fileLimit > 0:
    files = files[0:args.fileLimit]

conn = sqlite3.connect(dbName)
cur = conn.cursor()
createPaperTables(cur)
conn.commit()
conn.close()  

for file in files:
    conn = sqlite3.connect(dbName)
    cur = conn.cursor()
    downloadFile(file, cur, fileCacheDir)
    conn.commit()
    conn.close()  
