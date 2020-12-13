#!/bin/bash

# verification de l'etat du bluetooth
#
# ###############################

checkBlue () {
    
    # etat : ON=carte active, CON=carte connecte
    etatBlue="OFF:"

    # test etat carte
    if ! /usr/sbin/rfkill list 1 | grep yes > /dev/null 2>&1
    then
        etatBlue="ON:"
        
#        if /sbin/iw dev wlan0 link | grep SSID > /dev/null 2>&1
#        then
            
#            etatWifi="CON:"$(/sbin/iw dev wlan0 link | grep SSID | awk -F":" '{print $2}')
#            etatWifi=$etatWifi":"$(/sbin/ifconfig wlan0 | grep "inet " | awk '{print $2}')
#        fi
    fi
    
    echo $etatBlue
         
}

#scanWifi () {
#    
#    lstWifi="LSTWIFI"
#    for ssid in $(sudo /sbin/iw dev wlan0 scan | grep SSID | awk -F":" '{print $2}')
#    do
#        lstWifi=$lstWifi":"$ssid
#    done
#    
#    echo $lstWifi        
#
#}

startBlue () {
    sudo /usr/sbin/rfkill unblock 1
}
stopBlue () {
    sudo /usr/sbin/rfkill block 1
}

while getopts "asAD" option
do
    case $option in
        a)
            #echo "check etat du bluetooth"
            checkBlue
            ;;
        s)
            #echo "scan blue"
            #scanWifi
            ;;
        D)
            # activation bluetooth
            startBlue
            ;;
        A)
            # stop bluetooth
            stopBlue
            ;;
    esac
done

