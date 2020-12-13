// insertion des librairies
var	_ = require('lodash'),
	fs = require('fs'),
//	child_process = require('child_process'),
	glb = require('globalAutoradio'),
	Nav = require('../lib/libnavigo.js'),
    ini = require('ini'),
    ioClient = require('socket.io-client');
        
/* ----------------------------------------------------- */
/* lecture fichier de CONF                               */
/* ----------------------------------------------------- */
var fileIni = fs.readFileSync('./data/config.ini', 'utf-8');
 
//Création d'un JSON à partir du fichier ini '
var config = ini.parse(fileIni);

// mis en place des modes options globales
var defaults = {
	ficSIMU: './simu/GPStrace.avoine.saumur.sim'
};
donnees = _.defaults(defaults);
	

/* ----------------------------------------------------- */
/* serveur SOCKET                                        */
/* ----------------------------------------------------- */
if (config.GPS.verbose) {
	console.log(glb.Time() +' [GPS]\t Activation du serveur SOCKET');
}
var io = require('socket.io').listen('8126');
io.sockets.on('connection', function (socket) {

	console.log(glb.Time() +' [GPS]\t connexion du client');
	
	// ouverture du fichier de simu
	

});