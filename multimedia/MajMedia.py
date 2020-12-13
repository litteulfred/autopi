#!/usr/bin/env python
# -*- coding: utf-8 -*-

import psycopg2
import os
import subprocess, re
from subprocess import call
from mutagen.mp3 import MP3
from mutagen.mp4 import MP4
from mutagen.flac import FLAC

# mise en place de l'encoding UTF8
import sys
reload(sys)  
sys.setdefaultencoding('utf8')

# configuration
REPalbum = "media/audio"
REPvideo = "media/video"
REPCover = "data/cover"

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
def CreateTableSql():

	print "creation des table bibliotheque et playlist"

	print "--> creation table artists"
	try:
		cursor.execute("""DROP TABLE IF EXISTS artists;""")
		db.commit()
		cursor.execute("""CREATE TABLE artists (
		id SERIAL PRIMARY KEY,
		nomArtist VARCHAR(64)
		);""")
		db.commit()
	except:
		print "--> ERREUR de creation table artists"
		exit(1)

	print "--> creation table album"
	try:
		cursor.execute("""DROP TABLE IF EXISTS albums;""")
		db.commit()
		cursor.execute("""
		CREATE TABLE albums (
		id SERIAL PRIMARY KEY,
		artistsID SMALLINT,
		nomAlbum VARCHAR(128),
		date VARCHAR(4),
		coverPath VARCHAR(512)
		)""")
		db.commit()
	except:
		print "--> ERREUR de creation table album"
		exit(1)
	
	print "--> creation table titres"
	try:
		cursor.execute("""DROP TABLE IF EXISTS titres;""")
		db.commit()
		cursor.execute("""
		CREATE TABLE IF NOT EXISTS titres (
		id SERIAL PRIMARY KEY,
		artistsID SMALLINT,
		albumsID SMALLINT,
		nomTitre VARCHAR(128),
		piste SMALLINT,
		path VARCHAR(256),
		duree REAL,
		bitrate INTEGER,
		bitrate_mode VARCHAR(8),
		stereo VARCHAR(11),
		versMPEG REAL,
		encoder VARCHAR(32),
		NbrChannel SMALLINT
		)""")
		db.commit()
	except:
		print "--> ERREUR de creation table titres"
		exit(1)

	print "--> creation table EnCours"
	try:
		cursor.execute("""DROP TABLE IF EXISTS EnCours;""")
		db.commit()
		cursor.execute("""
		CREATE TABLE IF NOT EXISTS EnCours (
		id SERIAL,
		playlist VARCHAR(20),
		numPiste SMALLINT
		)
		""")
		db.commit()
	except:
		print "--> ERREUR de creation table EnCours"
		exit(1)

	print "--> creation table playALL"
	try:
		cursor.execute("""DROP TABLE IF EXISTS playALL;""")
		db.commit()
		cursor.execute("""
		CREATE TABLE IF NOT EXISTS playALL (
		id SERIAL,
		titreID SMALLINT
		)""")
		db.commit()
	except:
		print "--> ERREUR de creation table playALL"
		exit(1)

	print "--> creation table video"
	try:
		cursor.execute("""DROP TABLE IF EXISTS videos;""")
		db.commit()
		cursor.execute("""
		CREATE TABLE IF NOT EXISTS videos (
		id SERIAL,
		nomTitre VARCHAR(64),
		duree VARCHAR(16),
        reprise VARCHAR(9),
		path VARCHAR(256),
		coverPath VARCHAR(512)
		)""")
		db.commit()
	except:
		print "--> ERREUR de creation table videos"
		exit(1)

# -----------------------------------
# fonction insertions SQL
# -----------------------------------
def InsertSQLAudio(AllInfo):
	# insertion de l'artiste en BDD
	cursor.execute("""SELECT nomArtist FROM artists WHERE nomArtist = %s""", (AllInfo['Artist'], ))
	rows = cursor.fetchall()
	if len(rows) == 0:
		cursor.execute("""INSERT INTO artists (nomArtist) VALUES (%s)""", (AllInfo['Artist'],))
		db.commit()
         
	cursor.execute("""SELECT id, nomArtist FROM artists WHERE nomArtist = %s""", (AllInfo['Artist'],))
	IDartist = cursor.fetchall()
         
	# insertion de l'album si non existant pour l'artists
	# ---------------------------------------------------
	AllInfo['Annee'] = AllInfo['Annee'][0:4] # mise au format de la date uniquement sur l annee (supposé 4 premier caractere)        
	cursor.execute("""SELECT artistsID, nomAlbum FROM albums WHERE artistsID = %s AND nomAlbum = %s""", (IDartist[0][0], AllInfo['Album']))
	rows = cursor.fetchall()
	if len(rows) == 0:
		cursor.execute("""INSERT INTO albums (artistsID, nomAlbum, date, coverPath) VALUES (%s, %s, %s, %s)""", (IDartist[0][0], AllInfo['Album'], AllInfo['Annee'], AllInfo['coverPath']))
		db.commit()

	# insertion des titres
	# --------------------
	tmpPiste = str(AllInfo['Piste']).split('/')
	AllInfo['Piste'] = tmpPiste[0]
	cursor.execute("""SELECT id FROM albums WHERE nomAlbum = %s""", (AllInfo['Album'],))
	IDalbum = cursor.fetchall()
	Path = path+"/"+filename
	cursor.execute("""INSERT INTO titres (artistsID, albumsID, nomTitre, piste, duree, path, bitrate, bitrate_mode, stereo, versMPEG, encoder, NbrChannel)
	VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
	(IDartist[0][0], IDalbum[0][0], AllInfo['Titre'], AllInfo['Piste'], AllInfo['Duree'], AllInfo['Path'], AllInfo['infoBitrate'], AllInfo['bitrateMode'], AllInfo['stereo'], AllInfo['infoVers'], AllInfo['encoder'], AllInfo['infoChannel']))
	db.commit()

# création des tables SQL
CreateTableSql()

# ---------------------------------------------------------
# recherche des fichiers audio, à partir de REPalbum
# ---------------------------------------------------------
print "recherche des fichiers audio et insertion en tables"
REPalbum = unicode(REPalbum)
i=0
for path, dirs, files in os.walk(REPalbum):
	for filename in files:

		# suppression des fichier ._* en provenance de mac os
		if re.match('^._', filename) is not None:
			print "suppression de "+filename
			os.remove(path+"/"+filename)
      
		# -----------------------------------------      
		# insertion des fichiers MP3 en table
		# -----------------------------------------      
		elif ".MP3" in filename or ".mp3" in filename:
        
			i = i + 1
         
			# recuperation des infos via Mutagen
			print path, filename
			MutaMP3 = MP3(path+"/"+filename)
			AllInfo = { 'Duree': MutaMP3.info.length }
         
			if 'TPE1' in MutaMP3.keys():
				AllInfo['Artist'] = MutaMP3['TPE1'][0]
			else:
				AllInfo['Artist'] = "Unknown"
 
			if 'TALB' in MutaMP3.keys():
				AllInfo['Album'] = MutaMP3['TALB'][0]
			else:
				AllInfo['Album'] = "Unknown"

			if 'TIT2' in MutaMP3.keys():
				AllInfo['Titre'] = MutaMP3['TIT2'][0]
			else:
				AllInfo['Titre'] = "Unknown"

			if 'TRCK' in MutaMP3.keys():
				AllInfo['Piste'] = MutaMP3['TRCK'][0]
			else:
				AllInfo['Piste'] = "99"

			if 'TDRC' in MutaMP3.keys():
				AllInfo['Annee'] = str(MutaMP3['TDRC'][0])
			else:
				AllInfo['Annee'] = "1900"

			##s = str(MutaMP3.info.bitrate_mode)
			##AllInfo['bitrateMode'] = s.replace('BitrateMode.', '')
			AllInfo['bitrateMode'] = ""

			if MutaMP3.info.mode == 0:
				AllInfo['stereo'] = 'stereo'
			elif MutaMP3.info.mode == 1:
				AllInfo['stereo'] = 'jointstereo'
			elif MutaMP3.info.mode == 2:
				AllInfo['stereo'] = 'dualchannel'
			elif MutaMP3.info.mode == 3:
				AllInfo['stereo'] = 'mono'
			else:
				AllInfo['stereo'] = 'unknow'
        
			##AllInfo['encoder']= str(MutaMP3.info.encoder_info)
			AllInfo['encoder'] = "";
			AllInfo['infoBitrate'] = MutaMP3.info.bitrate
			AllInfo['infoVers'] = MutaMP3.info.version
			##AllInfo['infoChannel'] = MutaMP3.info.channels
			AllInfo['infoChannel'] = "0"
			AllInfo['Path'] = path+"/"+filename
			
			# insertion cover
			#if os.path.isfile(path+"/cover.jpg"):
			#if os.path.isfile(REPCover+"/"+os.path.basename(path)+".jpg"):
			#	AllInfo['coverPath'] = REPCover+"/"+os.path.basename(path)+".jpg"
			#else:
			AllInfo['coverPath'] = 'images/defaultcover.png'
			
			# insertion des infos en tables 
 			InsertSQLAudio(AllInfo)

		# -----------------------------------------      
		# insertion des fichiers MP4 en table
		# -----------------------------------------      
		elif ".M4A" in filename or ".m4a" in filename:
        
			i = i + 1
         
			# recuperation des infos via Mutagen
			MutaMP4 = MP4(path+"/"+filename)
			AllInfo = { 'Duree': MutaMP4.info.length }
         
			if '\xa9ART' in MutaMP4.keys():
				AllInfo['Artist'] = MutaMP4['\xa9ART'][0]
			else:
				AllInfo['Artist'] = "Unknown"
 
			if '\xa9alb' in MutaMP4.keys():
				AllInfo['Album'] = MutaMP4['\xa9alb'][0]
			else:
				AllInfo['Album'] = "Unknown"

			if '\xa9nam' in MutaMP4.keys():
				AllInfo['Titre'] = MutaMP4['\xa9nam'][0]
			else:
				AllInfo['Titre'] = "Unknown"

			if 'trkn' in MutaMP4.keys():
				AllInfo['Piste'] = MutaMP4['trkn'][0][0]
			else:
				AllInfo['Piste'] = "99"

			if '\xa9day' in MutaMP4.keys():
				AllInfo['Annee'] = str(MutaMP4['\xa9day'][0])
			else:
				AllInfo['Annee'] = "1900"

			#AllInfo['bitrateMode'] = MutaMP4.info.codec_description
			AllInfo['bitrateMode'] = ""

			AllInfo['stereo'] = 'unknow'
        
			##AllInfo['encoder']= str(MutaMP4.info.codec)
			AllInfo['encoder'] = ""
			AllInfo['infoBitrate'] = MutaMP4.info.bitrate
			##AllInfo['infoVers'] = MutaMP4.info.codec_description
			AllInfo['infoVers'] = "0"
			AllInfo['infoChannel'] = MutaMP4.info.channels
			AllInfo['Path'] = path+"/"+filename
			
			# insertion cover
			#if os.path.isfile(path+"/cover.jpg"):
			#	AllInfo['coverPath'] = path+"/cover.jpg"
			#else:
			AllInfo['coverPath'] = 'images/defaultcover.png'
			
			# insertion des infos en tables 
 			InsertSQLAudio(AllInfo)

		# -----------------------------------------      
		# insertion des fichiers FLAC en table
		# -----------------------------------------      
		elif ".FLAC" in filename or ".flac" in filename:
			
			i = i + 1
			
			MutaFLAC = FLAC(path+"/"+filename)
			AllInfo = { 'Duree': MutaFLAC.info.length }
			
			#print filename," - ",MutaFLAC['title'][0], MutaFLAC['album'][0]
			
			if 'artist' in MutaFLAC.keys():
				AllInfo['Artist'] = MutaFLAC['artist'][0]
			else:
				AllInfo['Artist'] = "Unknown"
 
			if 'album' in MutaFLAC.keys():
				AllInfo['Album'] = MutaFLAC['album'][0]
			else:
				AllInfo['Album'] = "Unknown"

			if 'title' in MutaFLAC.keys():
				AllInfo['Titre'] = MutaFLAC['title'][0]
			else:
				AllInfo['Titre'] = "Unknown"

			if 'tracknumber' in MutaFLAC.keys():
				AllInfo['Piste'] = MutaFLAC['tracknumber'][0]
			else:
				AllInfo['Piste'] = "99"

			if 'date' in MutaFLAC.keys():
				AllInfo['Annee'] = str(MutaFLAC['date'][0])
			else:
				AllInfo['Annee'] = "1900"

			#AllInfo['bitrateMode'] = MutaMP4.info.codec_description
			AllInfo['bitrateMode'] = ""

			AllInfo['stereo'] = 'unknow'
        
			##AllInfo['encoder']= str(MutaMP4.info.codec)
			AllInfo['encoder'] = ""
			AllInfo['infoBitrate'] = MutaFLAC.info.bitrate
			##AllInfo['infoVers'] = MutaMP4.info.codec_description
			AllInfo['infoVers'] = "0"
			AllInfo['infoChannel'] = MutaFLAC.info.channels
			AllInfo['Path'] = path+"/"+filename
			
			# insertion cover
			#if os.path.isfile(path+"/cover.jpg"):
			#	AllInfo['coverPath'] = path+"/cover.jpg"
			#else:
			AllInfo['coverPath'] = 'images/defaultcover.png'

			#print AllInfo
			
			# insertion des infos en tables 
 			InsertSQLAudio(AllInfo)


# ---------------------------------------------------------
# recherche des fichiers video, à partir de REPvideo
# ---------------------------------------------------------
print "recherche des fichiers video et insertion en tables"
REPvideo = unicode(REPvideo)
j=0
for path, dirs, files in os.walk(REPvideo):
	for filename in files:
		
		# suppression des fichier ._* en provenance de mac os
		if "._" in filename:
			print "suppression de "+filename
			os.remove(path+"/"+filename)
      
		# -----------------------------------------      
		# insertion des fichiers video en table
		# -----------------------------------------      
		elif ".AVI" in filename or ".avi" in filename or ".MKV" in filename or ".mkv" in filename or ".MP4" in filename or ".mp4" in filename or ".m4v" in filename or ".M4V" in filename:
		
			# recuperation de la durée de la video
			duree = "00:00:00"
			Path = path+"/"+filename
			cmd = ['ffprobe', '-show_format', '-pretty', '-loglevel', 'quiet', Path]
			p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
			for line in p.stdout:
				if 'duration' in line:
					duree = line.split('=')[1]
			
			titre = '.'.join(filename.split('.')[:-1])

			# insertion des video en table			
			cursor.execute("""
			INSERT INTO videos (nomTitre, duree, reprise, path, coverPath) VALUES (%s, %s, %s, %s, %s)
			""", (titre, duree.split('.')[0], '0:0:0', Path, 'images/coverVideo.png'))
			db.commit()

# --------------------------------------------        
# creation de la playlist par defaut ALL
# --------------------------------------------        
cursor.execute("""INSERT INTO playALL (titreID)
SELECT id FROM titres
ORDER BY random()""")
db.commit()

cursor.execute("""INSERT INTO EnCours (id, playlist, numPiste) VALUES ('1', 'playall', '1')""");
db.commit()

print "nombre de fichier audio trouvé :", i
cursor.execute("""SELECT COUNT(*) FROM titres""")
rows = cursor.fetchall()
db.commit()
print "nombre de fichier audio inséré en table :", rows[0][0]
db.close()
