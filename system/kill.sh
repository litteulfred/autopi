#!/bin/bash

echo "parametre d arret : -$1-"

if echo $2 | grep ALL
then
	Process="mpv ihmMedia.py volumeROT ihmInit.py initMultimedia.js ihmSystem multimedia.js system.js http.js checkDateGPS.sh gpsRadar.js usb.js CheckMouse.sh navigo.js ihmNavigo.py navit bluetooth.js bluealsa-aplay"

else
	Process=$2
fi

echo "arret des process $Process"
for process in $(echo $Process)
do
	echo "Arret de --$process--"

    listeProcess=$(ps -ef | grep $process | grep -v grep | grep -v kill.sh | awk '{print $2}')
    echo $listeProcess
	for i in $(echo $listeProcess)
	do
		#kill -15 $i
        echo "Arret $process PID $i"
		kill -9 $i
        echo "CR commande kill -9 $i : $?"
	done
done

# arret base de donnee
if echo $2 | grep ALL
then
    kill -15 $(ps -ef | grep master.js | grep -v grep |  grep -v kill.sh | awk '{print $2}')
    sh ./sql/postgresql.sh stop
fi

if echo $1 | grep halt
then
	echo "halt de l autoradio"
	sudo halt
fi
