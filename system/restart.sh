#!/bin/bash

# arret et relance des application
./system/kill.sh NONE ALL

# recuperation des traces
#tar -zcvf ./dump/log.$(date +%Y%m%d-%H%M).tgz ./log

# relance appli
./start.sh > ./log/restart.log 2>&1

# arret relance GPSD
sudo service gpsd stop
sudo service gpsd start
