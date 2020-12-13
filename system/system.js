// insertion des librairies
var _ = require('lodash'),
	fs = require('fs'),
	child_process = require('child_process'),
	ini = require('ini');
	glb = require('globalAutoradio');

/* ----------------------------------------------------- */
/* lecture fichier de CONF                               */
/* ----------------------------------------------------- */
var fileIni = fs.readFileSync('./data/config.ini', 'utf-8');
 
//Création d'un JSON à partir du fichier ini '
var config = ini.parse(fileIni);


// mis en place des modes options globales
var defaults = {
    screensaver: false
};
options = _.defaults(defaults);

// activation des mesures
if (config.system.mesures) {
	var Mesures = child_process.exec('sh ./system/mesures.sh stop && sh ./system/mesures.sh start');
	Mesures.stdout.on('data', function (data) {
	
		
	
		if (config.system.debug) {
			console.log(glb.Time() +' [SYSTEM]\t mesures '+data);
		}
	});
	Mesures.stderr.on('data', function (data) {
		if (config.system.verbose) {
			console.log(glb.Time() +' [SYSTEM]\t mesures ERR '+data);
		}
	});
	//child_process.exec('sh ./system/mesure.sh start');
}


// initialisation du serveur socket
var io = require('socket.io').listen('8124');
io.sockets.on('connection', function (socket) {
	if (config.system.verbose) {
		console.log(glb.Time() +' [SYSTEM]\t un client est connecté');
	}

	// recuperation du mode wifi
	var modeWifi = child_process.exec('ls -l /etc/network/interfaces | awk -F"interfaces." \'{print $3}\'');
	modeWifi.stdout.on('data', function (data) {
		if (config.system.verbose) {
			console.log(glb.Time() +' [SYSTEM]\t mode Wifi : '+data);
		}
		socket.emit('ETATWIFI', 'MODE:'+data.trim());
	});

	// ------------------------------- //
	// GESTION VOLUME                  //
	// ------------------------------- //
	function CheckVolume() {
		
		var volume = child_process.exec('amixer sget '+config.system.soundCard+' | grep "Front Left:" | awk \'{print $4}\'');
		volume.stdout.on('data', function (data) {
		
			socket.emit('VOLUME', data / parseInt(2));
		
			if (config.system.debug) {
				console.log(glb.Time() +' [SYSTEM]\t volume : '+data);
			}
		
		});
		volume.stderr.on('data', function (data) {
		
			if (config.system.verbose) {
				console.log(glb.Time() +' [SYSTEM]\t ERR volume : '+data);
			}
		
		});
		setTimeout(CheckVolume, 500);
	}

	// ------------------------------- //
	// NTP CHECK                       //
	// ------------------------------- //
	function CheckNTP() {
	
		var ntp = child_process.exec('ntpq -p');
		ntp.stdout.on('data', function (data) {

			if ( data.indexOf('*') != -1 ) {
				socket.emit('NTP', 'OK');
			} else {
				socket.emit('NTP', 'KO');
			}
			if (config.system.debug) {
				console.log(data);
			}
		});
		ntp.stderr.on('data', function (error) {

			socket.emit('NTP', 'KO');
			if (config.system.debug) {
				console.log(error);
			}
		});
		setTimeout(CheckNTP, config.system.freq);
	
	}
	
	// -------------------------------- //
	// VMSTAT                           //
	// -------------------------------- //
	function Vmstat() { 
	
			var fileVmstat = child_process.exec('ls -1rt ./log/vmstat* | tail -n1');
			fileVmstat.stdout.on('data', function(file) {
	
				var vmstat = child_process.exec('tail -1 '+file);
				vmstat.stdout.on('data', function(data) {
					var tabVmstat = data.split(":");
					var memUse = (parseInt(config.system.memTot) - parseInt(tabVmstat['4'])) / parseInt(1024);
					
					if (config.system.debug) {
						console.log('CPU : '+tabVmstat['18']+' mem : '+memUse);
					}
					
					var etat = {
							cpu: tabVmstat['18'],
							mem: Math.round(memUse),
							temp: tabVmstat['19'],
							swap: tabVmstat['3'],
							buff: tabVmstat['5'],
							cache: tabVmstat['6'],
							swapSi: tabVmstat['7'],
							swapSo: tabVmstat['8'],
							ioBi: tabVmstat['9'],
							ioBo: tabVmstat['10'],
							systemIn: tabVmstat['11'],
							systemCs: tabVmstat['12'],
							cpuUs: tabVmstat['13'],
							cpuSy: tabVmstat['14'],
							cpuId: tabVmstat['15'],
							cpuWa: tabVmstat['16'],
							cpuSt: tabVmstat['17'],
						}
					
					socket.emit('ETAT', etat);
					
				});
			});
			
			setTimeout(Vmstat, config.system.freq);
	}

	// -------------------------------- //
	// appli STAT                       //
	// -------------------------------- // 
	function appliStat() { 
	
			var fileAppli = child_process.exec('ls -1rt ./log/appli* | tail -n1');
			fileAppli.stdout.on('data', function(file) {
	
				var appli = child_process.exec('tail -1 '+file);
				appli.stdout.on('data', function(data) {
					var tabAppli = data.split(":");
					var memUse = 0;
					var cpuUse = 0;
					var lstAppli = config.system.lstAppli.split(" ");
					var i = 1;
					var etat = {};
			
					// calcul MEM et CPU tot des appli + par appli
					lstAppli.forEach( function(appli) {

						var key = "mem."+appli;
						etat[key] = [Math.round(tabAppli[i] / 1024)];

						memUse = parseInt(memUse) + parseInt(tabAppli[i]);
						i++;
						
						var key = "cpu."+appli;
						etat[key] = [tabAppli[i]];
						
						cpuUse = parseFloat(cpuUse) + parseFloat(tabAppli[i]);
						i++;
						
						// envoi de l'etat GPSD
						//if ( appli == "gpsd") {
						//	if ( etat['mem.gpsd'] != 0 ) {
						//		socket.emit('GPSD', 'ON');
						//	} else {
						//		socket.emit('GPSD', 'OFF');
						//	}
						//}
							
					});
					
					etat.mem = Math.round(parseInt(memUse) / 1024);
					etat.cpu = Math.round(cpuUse);
					socket.emit('ETATAPPLI', etat);
					
				});
			});
			
			setTimeout(appliStat, config.system.freq);
	}

	// -------------------------------- //
	// WIFI CHECK                       //
	// -------------------------------- //
	function CheckWIFI() {

		var wifi = child_process.exec('./system/checkWifi.sh -a');
		wifi.stdout.on('data', function (data) {
			if (config.system.debug) {
				console.log(' etat WIFI '+data);
			}
			
			socket.emit('ETATWIFI', data);
			
			if ( data.indexOf("OFF") == -1 ) {
				
				var lstWifi = child_process.exec('./system/checkWifi.sh -s');
				lstWifi.stdout.on('data', function (listeWifi) {
					if (config.system.debug) {
						console.log(' liste WIFI '+listeWifi);
					}
					socket.emit('ETATWIFI', listeWifi);
				})
			}
		});
		wifi.stderr.on('data', function (data) {
			console.log('ERROR etat WIFI '+data);
		});

		setTimeout(CheckWIFI, config.system.freq);

	}
    
    // -------------------------------- //
    // BLUETOOTH CHECK                  //
    // -------------------------------- //
    function CheckBLUE() {

        var bluetooth = child_process.exec('./system/checkBluetooth.sh -a');
        bluetooth.stdout.on('data', function (data) {
            if (config.system.debug) {
                console.log(' etat BLUETOOTH '+data);
            }
            
            socket.emit('ETATBLUE', data);
            
/*            if ( data.indexOf("OFF") == -1 ) {
                
                var lstWifi = child_process.exec('./system/checkWifi.sh -s');
                lstWifi.stdout.on('data', function (listeWifi) {
                    if (config.system.debug) {
                        console.log(' liste WIFI '+listeWifi);
                    }
                    socket.emit('ETATWIFI', listeWifi);
                })
            }
            */
        });
        bluetooth.stderr.on('data', function (data) {
            console.log('ERROR etat BLUE '+data);
        });

        setTimeout(CheckBLUE, config.system.freq);

    }
    
	// activation des check
	if (config.system.wifi) {
		CheckWIFI();
	}
    if (config.system.bluetooth) {
        CheckBLUE();
    }
	CheckNTP();
	Vmstat();
//	appliStat();
	CheckVolume();
	
	// activation / desactivation bluetooth
	socket.on('BLUETOOTH', function(cmd) {
	
		if (config.system.verbose) {
			console.log(glb.Time() +' [SYSTEM]\t Reception BLUETOOTH : '+cmd);
		}
	
		// activation du bluetooth
		if ( cmd == 'ON' ) {
		
		}
		// désactivation du bluetooth
		if ( cmd == 'OFF' ) {
		
		}
	
	});

	// activation / desactivation WIFI
	socket.on('WIFI', function(cmd) {
	
		if (config.system.verbose) {
			console.log(glb.Time() +' [SYSTEM]\t Reception WIFI : '+cmd);
		}
	
		// activation du wifi
		if ( cmd == 'ON' ) {
			var wifi = child_process.exec('./system/checkWifi.sh -D');
			wifi.stderr.on('data', function (data) {
				console.log('ERROR etat WIFI '+data);
			});
		}
		// désactivation du wifi
		if ( cmd == 'OFF' ) {
			var wifi = child_process.exec('./system/checkWifi.sh -A');
			wifi.stderr.on('data', function (data) {
				console.log('ERROR etat WIFI '+data);
			});
		}
		if ( cmd == 'adhoc' || cmd == 'reseau' ) {
			var wifi = child_process.exec('./system/checkWifi.sh -S '+cmd);
			wifi.stderr.on('data', function (data) {
				console.log('ERROR etat WIFI '+data);
			});
		}
	});
	
	/* ----------------------------------------------------- */
	/* activation ecran de veille                            */
	/* ----------------------------------------------------- */
	if (config.system.screensaver) {

		if (config.system.verbose) {
			console.log(glb.Time() +' [SYSTEM]\t activation screensaver');
		}

		var ScreenSaver = child_process.exec('sh ./system/CheckMouse.sh');
		ScreenSaver.stdout.on('data', function (data) {
	
			if (config.system.debug) {
				console.log(glb.Time() +' [SYSTEM]\t screensaver '+data);
			}
		
			socket.emit('SCREENSAVER', data);
		
		});
		ScreenSaver.stderr.on('data', function (data) {
			if (config.system.debug) {
				console.log(glb.Time() +' [SYSTEM]\t screensaver ERR '+data);
			}
		});
	}
	
	/* ----------------------------------------------------- */
	/* contrôle du volume                                    */
	/* ----------------------------------------------------- */
	if (config.system.volume) {
		
		if (config.system.verbose) {
			console.log(glb.Time() +' [SYSTEM]\t activation contrôle du volume');
		}
		var Volume = child_process.exec('./system/volumeROT');
		Volume.stdout.on('data', function (data) {
	
			if (config.system.verbose) {
				console.log(glb.Time() +' [SYSTEM]\t volume '+data+'--');
			}
		
			var tab = data.split(":")
		
			socket.emit('VOLUME', tab['1'] / parseInt(2));;
		
		});
		Volume.stderr.on('data', function (data) {
			if (config.system.verbose) {
				console.log(glb.Time() +' [SYSTEM]\t volume ERR '+data);
			}
		});
	}

});

