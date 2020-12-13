#!/bin/bash

# arret / relance des mesures
#
# #############################


startMesure () {
	echo "activation des mesures"
	#./system/checkAppli.sh&
	./system/checkVmstat.sh&
}

stopMesure () {
	echo "arret des mesures"
	for process in checkAppli.sh checkVmstat.sh
	do
		for i in $(ps -ef | grep $process | grep -v grep | awk '{print $2}')
		do
			kill -15 $i
		done
	done
}

razFicOut () {
	echo "suppression des fichiers CSV"
	rm -f log/*.csv
}

case $1 in
	start) 
		startMesure
		;;
	stop) 
		stopMesure
		;;
	raz) 
		razFicOut
		;;
esac
