#!/bin/bash

# verification de l'etat du WIFI
#
# ###############################

checkWifi () {
	
	# etat : ON=carte active, CON=carte connecte
	etatWifi="OFF:"

	# test etat carte
	if ! /usr/sbin/rfkill list 0 | grep yes > /dev/null 2>&1
	then
		etatWifi="ON:"
		
		if /sbin/iw dev wlan0 link | grep SSID > /dev/null 2>&1
		then
			
			etatWifi="CON:"$(/sbin/iw dev wlan0 link | grep SSID | awk -F":" '{print $2}')
			etatWifi=$etatWifi":"$(/sbin/ifconfig wlan0 | grep "inet " | awk '{print $2}')
			#etatWifi=$etatWifi":"$(ls -l /etc/network/interfaces | awk -F"interfaces." '{print $3}')
		fi
	fi
	
	echo $etatWifi
	 	
}

scanWifi () {
	
	lstWifi="LSTWIFI"
	for ssid in $(sudo /sbin/iw dev wlan0 scan | grep SSID | awk -F":" '{print $2}')
	do
		lstWifi=$lstWifi":"$ssid
	done
	
	echo $lstWifi		

}

startWifi () {
	#sudo rm -f /etc/network/interfaces
	#sudo ln -fs /etc/network/interfaces.$1 /etc/network/interfaces	
	sudo /usr/sbin/rfkill unblock 0 && sudo systemctl restart networking.service
}
stopWifi () {
	sudo /usr/sbin/rfkill block 0
}
switchMode () {
	sudo rm -f /etc/network/interfaces
	sudo ln -fs /etc/network/interfaces.$1 /etc/network/interfaces
	sudo reboot
}

while getopts "asADS:" option
do
	case $option in
		a)
			#echo "check etat du wifi"
			checkWifi
			;;
		s)
			#echo "scan wifi"
			scanWifi
			;;
		D)
			# activation WIFI
			startWifi
			;;
		A)
			# stop Wifi
			stopWifi
			;;
		S)
			# switch Wifi adhoc / reseau
			switchMode $OPTARG
			;;
	esac
done