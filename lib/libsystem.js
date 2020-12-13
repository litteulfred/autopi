var verbose = true;

// activation / desactivation WIFI
function wifiONOFF() {

	if ( ! document.getElementById("checkWifi").checked ) {
		
		if (verbose) {
			console.log('[LIBSYSTEM]\t switchWifi OFF');
		}
		sockSys.emit('WIFI', 'OFF');
	
	} else {
		
		if (verbose) {
			console.log('[LIBSYSTEM]\t switchWifi ON');
		}
		sockSys.emit('WIFI', 'ON');
	
	}

}

// switch du mode WIFI adhoc / reseau
function switchWifi(mode) {
	sockSys.emit('WIFI', mode);
}