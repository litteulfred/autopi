#!/bin/bash

sudo xset s off
sudo xset -dpms
sudo xset s noblank

qjoypad&
touchegg&
#/home/pi/rebootPI.sh&
cd /home/pi/autoradio
./start.sh&

lxterm&
