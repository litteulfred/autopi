# convertion des fichiers POI en fichier txt pour Navit
#
# #######################################################

import os
import sys
import re 

reload(sys)  
sys.setdefaultencoding('utf8')

REPpoiSrc = "data/navit/POIsrc"
REPpoiTrg = "data/navit/POI"
REPmapSrc = "media/cartes"
POIfile = "data/navit/poi.xml"
MAPfile = "data/navit/map.xml"
POIajoute = ""
numCustom = ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0",]

ListPOICust = "poi_custom0,poi_custom1,poi_custom2,poi_custom3,poi_custom4,poi_custom5,poi_custom6,poi_custom7,poi_custom8,poi_custom9,poi_customa,poi_customb,poi_customc,poi_customd,poi_custome,poi_customf"

print "suppression du fichiers poi.xml"
if os.path.isfile(POIfile): os.remove(POIfile)

print "ouverture du new poi.xml"
filePOI = open(POIfile, "a")

print "suppression du fichier map.xml"
if os.path.isfile(MAPfile): os.remove(MAPfile)

print "recherche des cartes et insertion des BIN dans MAPfile"
fileMAP = open(MAPfile, "a")
fileMAP.write("<mapset enabled=\"yes\">\n")

REPmapSrc = unicode(REPmapSrc)
i=0
for path, dirs, files in os.walk(REPmapSrc):
	for filename in files:
		if ".bin" in filename:
			fileMAP.write("\t<map type=\"binfile\" enabled=\"yes\" data=\""+path+"/"+filename+"\" />\n")

print "recherche des fichiers POI"
REPpoiSrc = unicode(REPpoiSrc)
i=0
for path, dirs, files in os.walk(REPpoiSrc):
	j = 0
	for filename in files:
	
		if ".asc" in filename:

			target = filename.split('.')
			fileOut = REPpoiTrg+"/"+target[0]+".custom"+str(j)+".txt"
	
			print "--> traitement de "+path+"/"+filename+" : "+target[0]+", "+str(j)
			
			# on recherche si le POI n a pas ete insere precedement
			if POIajoute.find(target[0]) == -1:
			
				print "----> creation du POI dans poi.xml"
			
				# insertion de type / icons des POI dans poi.xml
				filePOI.write("<itemgra item_types=\"poi_custom"+str(j)+"\" order=\"8-\">\n")
				filePOI.write("\t<icon src=\"data/navit/POI/"+target[0]+".png\"/>\n")
				filePOI.write("</itemgra>\n")
				POIajoute = POIajoute+":"+target[0]
			
			
				# insertion du fichier POI en MAP FILE
				fileMAP.write("\t<map type=\"textfile\" enabled=\"yes\" data=\""+fileOut+"\" />\n")
					
				# suppression du customX de la liste totale
				tmp = ListPOICust.replace('poi_custom'+str(j)+',','')
				ListPOICust = tmp
				
				# sauvegarde du num de custom
				numCustom[j] = target[0]
				
				# on supprime le fichier target .txt
				if os.path.isfile(fileOut): os.remove(fileOut)
			
			tmpIconPOI = REPpoiTrg+"/"+target[0]+".png"
			iconPOI = tmpIconPOI.encode('utf8')
	
			for line in open(path+"/"+filename):
						
				fileTrg = open(fileOut, "a")
				
				line = line.rstrip()
				SplitLine = line.split(',')
				fileTrg.write("mg:"+SplitLine[0]+" "+SplitLine[1]+" type=poi_custom"+str(numCustom.index(target[0]))+" label="+SplitLine[2]+" icon_src="+iconPOI+"\n")
			
			j += 1

# insertion des poi_custom restant	
filePOI.write("<itemgra item_types=\""+ListPOICust+"\" order=\"10-\">\n")
filePOI.write("\t<icon src=\"%s\" />\n")
filePOI.write("</itemgra>\n")

# fermeture du MAP FILE
fileMAP.write("</mapset>\n")

			