# -*- coding: utf-8 -*-
import yake
import sqlite3

def get_words(num_papers=10, max_phrases_per_paper=10, max_words_in_phrase=1, min_confidence=0):
    
    # Connect to abstract database
    conn = sqlite3.connect('ontovec.db')
    c = conn.cursor()
    
    # pull abstracts from database
    c.execute("SELECT * FROM papers LIMIT " + str(num_papers) + ";")
    papers = c.fetchall()
    
    c.close()
    conn.close()
    
    # Extract keywords from abstracts
    kw_extractor = yake.KeywordExtractor(top=max_phrases_per_paper, n=max_words_in_phrase)

    keywords = []
    for paper in papers:
        words = kw_extractor.extract_keywords(paper[1])
        for word in words:
            if word[0] > min_confidence:
                keywords.append((paper[0],word[1]))    
    
    # Connect to keywords database
    conn = sqlite3.connect('keywords.db')
    c = conn.cursor()
    
    # Make table of keywords
    c.execute("DROP TABLE IF EXISTS keywords;")
    c.execute("CREATE TABLE keywords(paperID TEXT, words TEXT);")
    
    # Populate keywords database with keywords
    c.executemany('INSERT INTO keywords VALUES (?, ?)', keywords)
    
    c.close()
    conn.close()
    
    return keywords

