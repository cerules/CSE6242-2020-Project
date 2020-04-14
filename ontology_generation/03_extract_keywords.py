# -*- coding: utf-8 -*-
import yake
import sqlite3
import argparse
from tqdm import tqdm

def get_words(abstract_db, keyword_db, year=2020, max_phrases_per_paper=10, max_words_in_phrase=2, max_score=1.0):
    
    # Connect to abstract database
    conn = sqlite3.connect(abstract_db)
    c = conn.cursor()
    
    # pull abstracts from database
    c.execute(f"SELECT * FROM papers WHERE papers.year >= {year};")
    papers = c.fetchall()
    
    c.close()
    conn.close()
    
    # Extract keywords from abstracts
    kw_extractor = yake.KeywordExtractor(top=max_phrases_per_paper, n=max_words_in_phrase)

    keywords = []
    with tqdm(total=len(papers)) as pbar:
        pbar.set_description("Extracting keywords from papers")
        for paper in papers:
            words = kw_extractor.extract_keywords(paper[1])
            for word in words:
                if word[0] < max_score:
                    keywords.append((paper[0],word[1],word[0]))    
            pbar.update(1)
    
    # Connect to keywords database
    conn = sqlite3.connect(keyword_db)
    c = conn.cursor()
    
    # Make table of keywords
    c.execute("DROP TABLE IF EXISTS keywords;")
    c.execute("CREATE TABLE keywords(paperID TEXT, words TEXT, confidence REAL);")
    
    # Populate keywords database with keywords
    c.executemany('INSERT INTO keywords VALUES (?, ?, ?)', keywords)
    conn.commit()
    c.close()
    conn.close()
    print("complete")
    return keywords

parser = argparse.ArgumentParser(description="Extract keywords from paper abstracts")
parser.add_argument("--abstractSqlitePath", type=str, default="../data/ontovec.db", required=False, help="path to paper abstract sqlite db file")
parser.add_argument("--keywordSqlitePath", type=str, default="../data/keywords.db", required=False, help="path to output keyword sqlite db file")
parser.add_argument("--yearCutOff", type=str, default="2020", required=False, help="year to filter paper abstracts. Only extracts keywords from papers with year >= yearCutOff")

args = parser.parse_args()

get_words(args.abstractSqlitePath, args.keywordSqlitePath, args.yearCutOff)
