#!/bin/bash

ficLog="/home/pi/autoradio/log/checkDateGPS.sh"
> $ficLog

# arret GPSD au cas ou
if service gpsd stop
then
	echo "--> arret GPSD OK" >> $ficLog
else
	echo "--> arret GPSD KO" >> $ficLog
fi
	

# ouverture du canal GPS
exec 5</dev/gps0
Date=""
heure=""

# lecture du resultat
while [[ $Date -eq "" || $heure -eq "" ]]
do
	res=$(read -t 10 RESPONSE <&5 && echo $RESPONSE)
	if echo $res | grep GPRMC > /dev/null
	then
		echo "--> $res" >> $ficLog
		heure=$(echo $res | awk -F"," '{print $2}' | cut -c -4)
		Date=$(echo $res | awk -F"," '{print $10}')
	fi
done

# fermeture du port
exec 5<&-

jour=${Date:0:2}
mois=${Date:2:2}

echo "--> date $mois$jour$heure" >> $ficLog
if date -u $mois$jour$heure
then
	echo "--> mise a la date OK" >> $ficLog
else
	echo "--> mise a la date KO" >> $ficLog
	exit 1
fi

# relance GPS et NTP
if service gpsd start
then
	echo "--> relance GPSD OK" >> $ficLog
else
	echo "--> relance GPSD KO" >> $ficLog
fi
if service ntp restart
then
	echo "--> relance NTP OK" >> $ficLog
else
	echo "--> relance NTP KO" >> $ficLog
fi
