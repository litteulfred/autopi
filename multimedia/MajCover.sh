#!/bin/bash

export NODE_PATH=lib/node_modules

python ./multimedia/MajCover.py

echo " ---> creation de THUMB"

for fic in $(ls -1 ./data/cover/*.jpg)
do
	printf "[MAJCOVER SH] "$fic
	convert $fic -resize 50x50 $fic.THUMB
done
