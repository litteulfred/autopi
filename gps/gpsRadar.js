// insertion des librairies
var	_ = require('lodash'),
	fs = require('fs'),
	child_process = require('child_process'),
	glb = require('globalAutoradio'),
	Gps = require('../lib/libgps.js'),
    ini = require('ini'),
//    sockNavig = require('socket.io-client')('http://localhost:8126');
    gpsd = require('node-gpsd');
    
/* ----------------------------------------------------- */
/* lecture fichier de CONF                               */
/* ----------------------------------------------------- */
var fileIni = fs.readFileSync('./data/config.ini', 'utf-8');
 
//Création d'un JSON à partir du fichier ini '
var config = ini.parse(fileIni);

// mis en place des modes options globales
var defaults = {
	vitesse: '-',
	altitude: '-',
//	orientation: 0,
	xPosit: '0.18',
	yPosit: '47.2',
	time: '-',
	compas: '0',
	log: false,
	radarDistance: '-',
	maxspeed: '0',
	alerte: false,
	color: 'black',
	nbrSat: '0',
	nbrSatTrue: '0',
	sendTime: '0'
};
donnees = _.defaults(defaults);

if ( config.GPS.simu ) {

	if ( config.GPS.verbose) {
		console.log(glb.Time() +' [GPS]\t activation mode SIMU');
	}
	
	var ioSimu = require('socket.io').listen('8888');
	ioSimu.sockets.on('connection', function (socketSimu) {

		if (config.GPS.verbose) {
			console.log(glb.Time() +' [GPS]\t connection programme SIMU');
		}
		
		socketSimu.on('DATASIMU', function(data) {
		
			donnees.vitesse = data['vit'];
			donnees.xPosit = data['x'];
			donnees.yPosit = data['y'];
			donnees.compas = data['orient'];
		
		})
	})
	

} else {
	
	if ( config.GPS.verbose) {
		console.log(glb.Time() +' [GPS]\t activation mode GPSD');
	}
	
	/* ----------------------------------------------------- */
	/* activation listener GPSD                              */
	/* ----------------------------------------------------- */
	var listener = new gpsd.Listener();
	
	/* evenmitter du signal SKY GPSD                         */
	/*               --> recup du nbre de satellite          */
	/* ----------------------------------------------------- */
	listener.on('SKY', function (sky) {

		//	var nbrSatTrue = 0;
		//	var nbrSat = "";
		donnees.nbrSatTrue = 0;
		donnees.nbrSat = 0;
		
		if ( sky['satellites'] ) {

			donnees.nbrSat = sky['satellites'].length;

			sky['satellites'].forEach(function(sat) {
  			
				if ( sat['used'] ) {
					donnees.nbrSatTrue = parseInt(donnees.nbrSatTrue) + parseInt(1);
				}
			});
		
			if (config.GPS.debug) {
				console.log(glb.Time() +' [GPS]\t nombre de satellite : '+donnees.nbrSat+', true : '+donnees.nbrSatTrue);
			}
		
			//	socket.emit('ETATGPS', {nbrSat: nbrSat, nbrSatTrue: nbrSatTrue});
		}
	});

	/* evenmitter du signal TPV GPSD                               */
	/*      --> recup date                                         */
	/*      --> recup des coordonee + vitesse + altitude + track   */
	/* ----------------------------------------------------------- */
	var MAJdate = false;
	listener.on('TPV', function (tpv) {
        
		// NB : mode 2 = reception 2D, mode 3 = reception 3D.
		if ( tpv['mode'] > 1 ) {
        
			// activation log
/*			if ( ! donnees.log ) {
				
				if (config.GPS.verbose) {
					console.log(glb.Time() +' [GPS]\t activation traces GPS ');
				}
				logGPS();
				donnees.log = true;
			}
  */      
		
			// mise a jour date et activation NTP
			if ( ! MAJdate && tpv['time'] ) {

				var tmpDate = tpv['time'].split('T');
				var date = tmpDate['0'].split('-');
				var heure = tmpDate['1'].split(':');
        		
				if (config.GPS.verbose) {
					console.log(glb.Time() +' [GPS]\t Mise a jour date et heure '+date['1']+date['2']+heure['0']+heure['1']+date['0']);
				}
        		
				var DateCMD = child_process.exec('sudo date -u '+date['1']+date['2']+heure['0']+heure['1']+date['0']);
				DateCMD.stdout.on('data', function (data) {
				
					if (config.system.verbose) {
						console.log(glb.Time() +' [GPS]\t MAJ date '+data);
					}
				});
				DateCMD.stderr.on('data', function (data) {
					
					if (config.system.verbose) {
						console.log(glb.Time() +' [GPS]\t MAJ date ERR '+data);
					}
				});
				var ntpCMD = child_process.exec('sudo /etc/init.d/ntp restart');
				ntpCMD.stdout.on('data', function (data) {
					
					if (config.system.verbose) {
						console.log(glb.Time() +' [GPS]\t restart NTPD '+data);
					}
				});
				ntpCMD.stderr.on('data', function (data) {
			
					if (config.system.verbose) {
						console.log(glb.Time() +' [GPS]\t restart NTPD ERR '+data);
					}
				});

				MAJdate = true;
			}

			// mise a jour data globale
			donnees.compas = parseInt(tpv['track']);
			donnees.xPosit = tpv['lon'];
			donnees.yPosit = tpv['lat'];
			donnees.vitesse =  parseInt(parseFloat(tpv['speed']) * parseFloat(3.6));
			donnees.altitude = parseInt(tpv['alt']);
		
		} 
	})

	listener.connect(function() {
		listener.watch();
	});
}

// ---------------------------------------------
// verification distance du radar le plus proche
// ---------------------------------------------
function checkRadar() {
			
	Gps.CheckDistRadar(parseFloat(donnees.yPosit), parseFloat(donnees.xPosit), function(radarProche) {		

		donnees.radarDistance = parseInt(radarProche['distance'] * 1000);
		donnees.maxspeed = radarProche['maxspeed'];
			
		// gestion des alarmes
		if (config.GPS.debug) {
			console.log(glb.Time() +' [GPS]\t radar : '+donnees.maxspeed+" "+donnees.radarDistance);
		}

		if ( donnees.radarDistance < 1100 ) {
					
			donnees.alerte = true;
			donnees.color = 'green';
					
			if (config.GPS.verbose) {
				console.log(glb.Time() +' [GPS]\t beep 1000 metre');
			}			
		}

		if ( donnees.radarDistance < 1000 && donnees.maxspeed > 0 && donnees.vitesse > donnees.maxspeed ) {
				
			donnees.alerte = true;
			donnees.color = 'red';
					
			if (config.GPS.verbose) {
				console.log(glb.Time() +' [GPS]\t beep alerte');
			}		
		}
			
		if ( donnees.radarDistance > 1100 ) {
					
			donnees.alerte = false;
			donnees.color = 'black';
					
			if (config.GPS.debug) {
				console.log(glb.Time() +' [GPS]\t beep off');
			}		
		}	
	});
	setTimeout(checkRadar, 1000);
}
checkRadar();


/* ----------------------------------------------------- */
/* serveur SOCKET                                        */
/* ----------------------------------------------------- */
if (config.GPS.verbose) {
	console.log(glb.Time() +' [GPS]\t Activation du serveur SOCKET');
}
var io = require('socket.io').listen('8122');
io.sockets.on('connection', function (socket) {

	if (config.GPS.verbose) {
		console.log(glb.Time() +' [GPS]\t connection IHM cliente');
	}
	
/*	var dateFicLog = new Date();
	var ficTraceGps = "gps/GPStrace."+dateFicLog.getFullYear()+dateFicLog.getMonth()+dateFicLog.getDate()+"."+dateFicLog.getHours()+dateFicLog.getMinutes();
	function logGPS() {
		
		var date = new Date();
		temps = date.getTime();
		var log = temps+";"+donnees.vitesse+";"+donnees.altitude+";"
					+donnees.orientation+";"
					+donnees.xPosit+";"
					+donnees.yPosit+"\n";
		fs.appendFile(ficTraceGps, log, 'UTF8', function(err) {
			if (err) {
				console.log(glb.Time() + ' [MASTER]\t ERR ecriture trace '+err);
			}
		});
		setTimeout(logGPS, 1000);
	}
*/	 
        
        	// envoi des donnees GPS
/*        	dataGPS = {
				'orient': tpv['track'],
				'x': tpv['lon'],
				'y': tpv['lat'],
				'vit': tpv['speed']
			}
*/			
	// envoi des data GPS toutes x secondes
	function sendData() {
		
/*		var t = new Date();
		var time = t.getTime();
		var deltaTime = parseInt(time) - parseInt(donnees.sendTime);
		if ( deltaTime > 1 ){
*/								
		
		if (config.GPS.debug) {
			console.log(glb.Time() +' [GPS]\t envoi data GPS '+donnees);
		}

		socket.emit('DATAGPS', donnees);
		setTimeout(sendData, 1000);
    }
	sendData();
	
});

