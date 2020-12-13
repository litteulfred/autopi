// insertion des librairies
var	_ = require('lodash'),
	fs = require('fs'),
	child_process = require('child_process'),
	glb = require('globalAutoradio'),
	Gps = require('../lib/libgps.js'),
    ini = require('ini');
    
/* ----------------------------------------------------- */
/* lecture fichier de CONF                               */
/* ----------------------------------------------------- */
var fileIni = fs.readFileSync('./data/config.ini', 'utf-8');
 
//Création d'un JSON à partir du fichier ini '
var config = ini.parse(fileIni);

// mis en place des modes options globales
var defaults = {
    tempsMorceau: '0',
    lat: '47.205697',
    lon: '0.18198200000006182'
};
options = _.defaults(defaults);

/* ----------------------------------------------------- */
/* serveur SOCKET                                        */
/* ----------------------------------------------------- */
if (config.poi.verbose) {
	console.log(glb.Time() +' [POI]\t Activation du serveur SOCKET');
} 
var io = require('socket.io').listen('8126');
io.sockets.on('connection', function (socket) {

	if (config.poi.verbose) {
		console.log(glb.Time() +' [POI]\t connexion IHM');
	}
	
	// connection socket POI
	//var sockGPS = io.connect('http://'+hostAutoradio+':8124');
	
	// recuperation et envoi des groupes de POI
	Gps.GetPOIgroup( function(result) {

		socket.emit('GRPPOI', result);

		Gps.GetAllPOIVF( function(row) {
			socket.emit('POI', row);
		});
	});
	
	// reception de demande de POI
	socket.on('GETPOI', function(poiID) {
	
		console.log(' Reception demande de poi :'+poiID['ident']+" - "+poiID['id']+" -- "+poiID['distance']);
	
		// recuperation des parametres pour recherche POI
		poiSource = {
			lat: options.lat,
			lon: options.lon,
			id: poiID['id'],
			distance: poiID['distance'],
			distStart: poiID['distStart'],
			lstPOIid: poiID['lstPOIid']
		}

		// demande SQL des POI par idPOI
		if ( poiID['ident'] == 'POI' ) {
			Gps.GetPOIbyPOIid(poiSource, function(result) {
				sendPOI2Ihm (result);		
			});
		}
		// demande SQL des POI par groupe
		if ( poiID['ident'] == 'GRP' ) {
			Gps.GetPOIbyGRP(poiSource, function(result) {
				sendPOI2Ihm (result);		
			});
		}
		// function d'envoi des POI a l IHM
		function sendPOI2Ihm (listPOI) {
			
			socket.emit('LSTPOI', 'START::');
			
			listPOI.forEach( function(row) {
			
				// mise en place des TAGS spécifiques
				var tabRow = row.split('::');				
				var tmp = tabRow[3].replace(/\\'/gi, "'");
				tmp = tmp.replace(/>/gi, '');
				
				if ( config.poi.debug ) {
					console.log(' [POI] poi '+tmp);
				}
				
				tags = JSON.parse(tmp);
				var name = 'NONE';
				if ( tags['name'] ) {
					name = tags['name'];
				}
				if ( tags['operator'] ) {
					name = tags['operator'];
				}
				if ( tags['brand'] ) {
					name = tags['brand'];
				}
				if ( name == 'NONE' ) {
					name = 'inconnu';
				}

				// icon par defaut si 'xx'
				if ( tabRow[4] == 'xx' ) {
					iconAff = 'unknown_96_96.png';
				} else {
					iconAff = tabRow[4];
				}

				// envoi des POI a l IHM
				var envoi = tabRow[1]+'::'+tabRow[2]+'::'+tabRow[0]+'::'+name+'::'+tabRow[3]+'::'+iconAff;				
				socket.emit('LSTPOI', envoi);
			});
			socket.emit('LSTPOI', 'END::');
		}
	});
	
	// reception demande de POI on GROUPE
	socket.on('GETPOIGRP', function(poiGrpId) {
		Gps.GetPOIonGRP(poiGrpId, function(row) {
			socket.emit('POIONGRP', row);
		});
	})
});