# recuperation des cover
#      utilisation de "sacad"

import psycopg2
import os
import unicodedata
import subprocess, re
from subprocess import call

# mise en place de l'encoding UTF8
import sys
reload(sys)  
sys.setdefaultencoding('utf8')

# configuration
REPCover = "data/cover"

# initialisation de la base de donnee
print "initialisation database bibliotheque"
try:
    db = psycopg2.connect("dbname='db_media' user='pi' host='127.0.0.1' password='muscadet'")
    cursor = db.cursor()
except:
    print "I am unable to connect to the database"
    exit(1)

print "Database connectee"

# function de mise a jour du cover en base
def majCoverBDD(pathCover,albumID):

	print "--> mise a jour cover"
	try:
		cursor.execute("""UPDATE albums SET coverPath = %s WHERE id = %s;""", (pathCover,albumID,) )
		db.commit()
	except:
		print "--> ERREUR mise a jour cover"
		exit(1)

# on recupere la liste des albums
cursor.execute("""SELECT albums.id as id, artists.nomArtist as artist, albums.nomAlbum as album FROM albums INNER JOIN artists on artists.id = albums.artistsID""")
rows = cursor.fetchall()
for lig in rows:
	
	albumID = lig[0]
	artist = lig[1]
	album = lig[2]
	
	# suppression des accents
	tmpcover = unicode(artist+"."+album+".jpg", 'utf-8')
	cover = unicodedata.normalize('NFD', tmpcover).encode('ascii', 'ignore')
	cover = cover.replace(' ','_')
	cover = cover.replace('/','-')
	cover = cover.replace('\'','-')
	pathCover = REPCover+'/'+cover
	
	print "traitement : ",artist," ",album," ",cover
	
	# on verifie la presence du cover
	if os.path.exists(pathCover):
		print 'cover existant, on met a jour la BDD'
		majCoverBDD(pathCover,albumID)
		
	else:
	
		# recherche du cover
		print 'cover absent, recherche du cover'
		cmd = ['sacad', artist, album, '600', pathCover]
		p = subprocess.call(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		
		# maj BDD si cover downloaded
		if os.path.exists(pathCover):
			majCoverBDD(pathCover,albumID)
