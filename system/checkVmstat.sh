#!/bin/bash

# script de smeure VMSTAT
# 
# #######################################

# format de sortie
# heure :	1=heureMinuteSecond
# procs :	2=r  3=b
# memoire :	4=swpd  5=free  6=buff  7=cache
# swap : 	8=si  9=so
# io :		10=bi  11=bo
# system :	12=in  13=cs
# cpu : 	14=us  15=sy  16=id  17=wa  18=st  19=total
# temp:		19=temp

interval=2
ficOut="log/vmstat."$(date +%m%d)".csv"

while true
do

	DATE=$(date +%H%M%S)
	
	# recuperation de la temperature proc
	if [ -f "/sys/class/thermal/thermal_zone0/temp" ]
	then
		tmp=$(cat /sys/class/thermal/thermal_zone0/temp)
		TEMP=$((tmp / 1000))
	else
		TEMP="--"
	fi
		
	# recuperation du vmstat
	vmstat $interval 2| tail -n1 | awk -v dat=$DATE -v temp=$TEMP '{print dat":"$1":"$2":"$3":"$4":"$5":"$6":"$7":"$8":"$9":"$10":"$11":"$12":"$13":"$14":"$15":"$16":"$17":"$13+$14+$16":"temp}' >> $ficOut
	sleep $interval
done
