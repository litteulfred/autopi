#!/bin/bash

if lsof | grep /dev/ttyUSB0 > /dev/null 2>&1
then
	echo "Device ttyUSB0 utilise... exit"
	exit 1
fi

ino build -m atmega328 && ino upload -m atmega328
