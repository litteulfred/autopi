#!/usr/bin/env python
# -*- coding: utf-8 -*-

import psycopg2
import os

# mise en place de l'encoding UTF8
import sys
reload(sys)  
sys.setdefaultencoding('utf8')

# configuration
REProm = "media/jeux"

# initialisation de la base de donnée
print "initialisation database bibliotheque"
try:
    db = psycopg2.connect("dbname='db_media' user='pi' host='127.0.0.1' password='muscadet'")
    cursor = db.cursor()
except:
    print "I am unable to connect to the database"
    exit(1)

print "Database connectee"

# -----------------------------------
# creation des tables
# -----------------------------------
print "--> creation table jeux"
try:
	cursor.execute("""DROP TABLE IF EXISTS jeux;""")
	db.commit()
	cursor.execute("""
	CREATE TABLE IF NOT EXISTS jeux (
	id SERIAL,
	nomJeux VARCHAR(64),
	path VARCHAR(512),
	coverPath VARCHAR(512),
	emulator VARCHAR(64)
	)""")
	db.commit()
except:
	print "--> ERROR creation table jeux"
	exit(1)

# -----------------------------------
# recherche des fichiers
# -----------------------------------	
print "recherche des ROM jeux"
REProm = unicode(REProm)
i=0
for path, dirs, files in os.walk(REProm):
	for filename in files:
	      
		# suppression des fichier ._* en provenance de mac os
		if "._" in filename:
			print "suppression de "+filename
			os.remove(path+"/"+filename)
      
		# -----------------------------------------      
		# insertion des fichiers MP3 en table
		# -----------------------------------------      
		elif ".v64" in filename or ".V64" in filename or ".nes" in filename or ".NES" in filename:
		
			i = i + 1
			
			Path = path+"/"+filename
			nomJeux = '.'.join(filename.split('.')[:-1])
			
			if ".v64" in filename or ".V64" in filename:
				emulator = 'mupen64plus'
				coverPath = 'images/defaultN64.png'
			
			if ".nes" in filename or ".NES" in filename:
				emulator = '/usr/games/mednafen'
				coverPath = 'images/defaultNES.png'
			
			# insertion en table
			cursor.execute("""INSERT INTO jeux (nomJeux, path, coverPath, emulator) VALUES (%s, %s, %s, %s)""", (nomJeux, Path, coverPath, emulator))
			db.commit()
			
print "nombre de fichier rom trouvé :", i
cursor.execute("""SELECT COUNT(*) FROM jeux""")
rows = cursor.fetchall()
db.commit()
print "nombre de fichier rom inséré en table :", rows[0][0]
db.close()			
