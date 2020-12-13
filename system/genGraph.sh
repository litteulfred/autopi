#!/bin/bash
#
# generation des graph
#
# #######################

date=$1

for graph in $(ls -1 data/graph/confGraph*)
do
	if [ $graph == "data/graph/confGraphCPU.conf" ]
	then
		FileOut="log\/graphCPU.png"
		FileIn="log\/vmstat.$1.csv"
	fi

	if [ $graph == "data/graph/confGraphMEM.conf" ]
	then
		FileOut="log\/graphMEM.png"
		FileIn="log\/vmstat.$1.csv"
	fi

	if [ $graph == "data/graph/confGraphMEMAPPLI.conf" ]
	then
		FileOut="log\/graphMEMAPPLI.png"
        FileIn="log\/appli.$1.csv"
	fi

	if [ $graph == "data/graph/confGraphCPUAPPLI.conf" ]
	then
		FileOut="log\/graphCPUAPPLI.png"
                FileIn="log\/appli.$1.csv"
	fi

	echo $graph -- $FileIn -- $FileOut

	cat $graph | sed -e "s/FILEOUT/$FileOut/g" | sed -e "s/FILEIN/$FileIn/g" > tmpGraph.conf

	cat tmpGraph.conf | gnuplot

done
rm -f tmpGraph.conf
