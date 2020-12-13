#!/bin/bash
#
# script de bascule de la fenêtre active
#
# #######################################

# recup de l'ID de la fenetre
case $1 in
	AUTORADIO) WindowsID=$(wmctrl -l | grep MULTIMEDIA | awk '{print $1}');;
	NAVIT) WindowsID=$(wmctrl -l | grep navit | awk '{print $1}');;
	SYSTEM) WindowsID=$(wmctrl -l | grep SYSTEM | awk '{print $1}');;
	NAVIGO) WindowsID=$(wmctrl -l | grep NAVIGO | awk '{print $1}');;
esac

wmctrl -i -R $WindowsID
