#!/usr/bin/env python
# -*- coding: utf-8 -*-

import psycopg2
import os
import subprocess, re
from PIL import Image

# mise en place de l'encoding UTF8
import sys
reload(sys)
sys.setdefaultencoding('utf8')

# configuration
REPalbum = "media/photos"

# initialisation de la base de donnée
print "initialisation database bibliotheque"
try:
    db = psycopg2.connect("dbname='db_media' user='pi' host='127.0.0.1' password='muscadet'")
    cursor = db.cursor()
except:
    print "I am unable to connect to the database"
    exit(1)

print "Database connectee"

print "creation des tables photos"
print "--> creation table albumPhotos"
try:
	cursor.execute("""DROP TABLE IF EXISTS albumPhotos;""")
	db.commit()
	cursor.execute("""
	CREATE TABLE IF NOT EXISTS albumPhotos (
	id SERIAL,
	album VARCHAR(64)
	)""")
	db.commit()
except:
	print "--> ERROR creation table albumPhotos"
	exit(1)

print "--> creation table photos"
try:
	cursor.execute("""DROP TABLE IF EXISTS photos;""")
	db.commit()
	cursor.execute("""
	CREATE TABLE IF NOT EXISTS photos (
	id SERIAL,
	nom VARCHAR(64),
	width VARCHAR(8),
	height VARCHAR(8),
	albumID SMALLINT,
	path VARCHAR(256)
	)""")
	db.commit()
except:
	print "--> ERROR creation table photos"
	exit(1)

# ---------------------------------------------------------
# recherche des fichiers photos
# ---------------------------------------------------------
print "recherche des fichiers photo et insertion en tables"
REPalbum = unicode(REPalbum)
i=0
for path, dirs, files in os.walk(REPalbum):
	for filename in files:
	      
		# suppression des fichier ._* en provenance de mac os
		if "._" in filename:
			print "suppression de "+filename
			os.remove(path+"/"+filename)
			
		# -----------------------------------------      
		# insertion des fichiers JPG en table
		# -----------------------------------------      
		elif ".JPG" in filename or ".jpg" in filename:
		
			album = os.path.basename(path)
			
			print filename+" "+album+" "+path
			Path = path+"/"+filename
	
			# taille de l'image
			im = Image.open(Path)
			size = im.size
	
			# insertion de l'album en BDD
			cursor.execute("""SELECT album FROM albumPhotos WHERE album = %s""", (album, ))
			rows = cursor.fetchall()
			if len(rows) == 0:
				cursor.execute("""INSERT IGNORE INTO albumPhotos (album) VALUES (%s)""", (album,))
				db.commit()
			
			# insertion des titres
			cursor.execute("""SELECT id FROM albumPhotos WHERE album = %s""", (album,))
			IDalbum = cursor.fetchall()
			cursor.execute("""INSERT INTO photos (nom, albumID, width, height, path) VALUES (%s, %s, %s, %s, %s)""", (filename, IDalbum[0][0], size[0], size[1], Path))
			db.commit()
