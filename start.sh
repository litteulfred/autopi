#!/bin/bash

export NODE_PATH=lib/node_modules

export PATH=/usr/local/pgsql/bin:$PATH

# création des liens
rm -rf ~/.mednafen/mednafen-09x.cfg
ln -fs $(dirname $PWD)/autoradio/data/mednafen-09x.cfg ~/.mednafen/mednafen-09x.cfg
rm -r media
ln -fs $HOME/media media
rm -r ~/.config/touchegg/touchegg.conf
ln -fs $HOME/autoradio/data/touchegg.conf ~/.config/touchegg/touchegg.conf

rm -r ./data/config.ini
cd data; ln -fs config.ini.$HOSTNAME config.ini
cd ..

echo $(date) : sauvegarde des LOG
# bascule des fichiers de LOG
for i in $(ls -1 log | grep -v PREV | grep -v GPX | grep -v csv )
do
	mv log/$i log/$i.PREV
done

echo $(date) : start master
nodejs common/master.js > log/master.log 2>&1 &
