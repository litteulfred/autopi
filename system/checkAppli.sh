#!/bin/bash

# verification de la memoire et CPU par appli
#
# #######################################

# format de sortie
# heure :	1=heureMinuteSeconde
# apache :	2=memoire  3=cpu
# mysql :	4=memoire  5=cpu
# nodejs :	6=memoire  7=cpu
# ihmMedia.py :	8=memoire  9=cpu
# navit :	10=memoire  11=cpu
# mplayer :	12=memoire  13=cpu

interval=4
ficOut="log/appli."$(date +%m%d)".csv"
LstAppli=$(grep lstAppli data/config.ini | cut -d"=" -f2)

while true
do
	printf $(date +%H%M%S)":" >> $ficOut
	for i in $LstAppli
	do
		ps aux | grep $i | grep -v grep | awk 'BEGIN { mem=0; cpu=0 } {
								mem=mem+$6;
								cpu=cpu+$4 } 
							END {
								printf("%s:%s:",mem,cpu)
							}' >> $ficOut
	done
	printf "\n" >> $ficOut
	sleep $interval
done
