#!/bin/bash

function replace {
	mv "$1" $(echo "$1" | sed "s/à/a/g" | \
		sed "s/\ /_/g" | \
		sed "s/'/_/g" | \
		sed "s/ç/c/g" | \
		sed "s/é/e/g" | \
		sed "s/è/e/g" | \
		sed "s/ê/e/g" | \
		sed "s/ë/e/g" | \
		sed "s/î/i/g" | \
		sed "s/ï/i/g" | \
		sed "s/ô/o/g" | \
		sed "s/ö/o/g" | \
		sed "s/ù/u/g" | \
		sed "s/ü/u/g" | \
		sed "s/Â/A/g" | \
		sed "s/Ç/C/g" | \
		sed "s/É/E/g" | \
		sed "s/È/E/g" | \
		sed "s/Ê/E/g" | \
		sed "s/Ë/E/g" | \
		sed "s/Î/I/g" | \
		sed "s/Ï/I/g" | \
		sed "s/Ô/O/g" | \
		sed "s/Ö/O/g" | \
		sed "s/Ù/U/g" | \
		sed "s/\?/\./g" | \
		sed "s/Ü/U/") 2> /dev/null
}

export TEMP1=`mktemp`
cd media/audio || exit 1
ls -1  > $TEMP1
while read i
do

	echo "$i"
	
	# passage dans sous repertoire
	export TEMP2=`mktemp`
	cd "$i"
	ls -1 > $TEMP2
	while read j
	do
		echo " --> $j"
		replace "$j"
	done < $TEMP2
	rm $TEMP2
	cd ..
	
	replace "$i"

done < $TEMP1
rm $TEMP1

# passage sur les fichiers
export TEMP3=`mktemp`
find . -type f > $TEMP3
while read k
do
	echo "$k"
	replace "$k"
done < $TEMP3
rm -f $TEMP3
cd ../..
