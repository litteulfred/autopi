#!/bin/bash

# verification de l'etat du Bluetooth
#
# ###################################

checkBT () {
	
	# etat : ON=carte active, CON=carte connecte
	etatBT="OFF:"
	
	# test etat carte
	if ! /usr/sbin/rfkill list 1 | grep yes > /dev/null 2>&1
	then
		etatBT="ON:"
		
		if /sbin/iw dev wlan0 link | grep Connected > /dev/null 2>&1
		then
			
			etatBT="CON:"$(/sbin/iw dev wlan0 link | grep SSID | awk -F":" '{print $2}')
		fi
	fi
	
	echo $etatBT
	 	
}

scanBT () {
	
	lstBT=""
	for ssid in $(sudo /sbin/iw dev wlan0 scan | grep SSID | awk -F":" '{print $2}')
	do
		lstBT=$ssid":"$lstBT
	done
	
	echo $lstBT		

}

startBT () {
	sudo /usr/sbin/rfkill unblock 0
}
stopBT () {
	sudo /usr/sbin/rfkill block 0
}

while getopts "asAD" option
do
	case $option in
		a)
			#echo "check etat du wifi"
			checkBT
			;;
		s)
			#echo "scan wifi"
			scanBT
			;;
		D)
			# activation WIFI
			startBT
			;;
		A)
			# stop Wifi
			stopBT
			;;
	esac
done