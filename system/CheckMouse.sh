#!/bin/bash

PositionPrev="1"
counter="0"

while true
do

	Position=$(xdotool getmouselocation)
	PosX=$(echo $Position | cut -d" " -f1)
	PosY=$(echo $Position | cut -d" " -f2)
	
	#if echo $Position | grep "$PositionPrev" > /dev/null
	if [ "$PosX" = "x:1023" ]
	then
		
		counter=$((counter+1))

		if echo $counter | grep "600" > /dev/null
		then
			counter="0"
			touch screensaver.ON
			printf "ON"
				
		fi
	else
		counter="0"
		rm -f screensaver.ON
		printf "OFF"
	fi
	
	PositionPrev=$Position
	xdotool mousemove 1023 599
	
	sleep 1
	
done
	
