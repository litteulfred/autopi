#!/bin/bash

action=$1
macID=$2

# activation de la connexion audio
if [ $action = "start" ]
then

bluetoothctl << EOF
connect $macID
exit
EOF

    bluealsa-aplay $macID &
    
    node ./system/bluetooth.js&
    
fi

# des activation de la connexion audio
if [ $action = "stop" ]
then

    sh ./system/kill.sh none bluetooth.js

bluetoothctl << EOF
disconnect $macIDC
exit
EOF

fi
